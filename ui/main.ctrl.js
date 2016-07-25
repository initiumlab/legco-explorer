import dc from 'dc';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import moment from 'moment';
var toInjects = ['$scope', '$timeout', 'dataTypesConfig', 'geoShapeSrvc', 'dataSrvc', '$timeout', '$routeParams', '$location'];
var Promise = require("bluebird");
import numeral from 'numeral';
import {
    agg,
    aggByKeys,
    GeoDataModel,
    unpivot
} from './services/dataMapper.js';

export default class MainCtrl {
  constructor(...args) {
    Object.assign(this, _.zipObject(toInjects, args));
    let vm = this;
    let $scope = this.$scope;
    let $location = this.$location;
    let dataSrvc = this.dataSrvc;
    let $routeParams = this.$routeParams;
    vm.geoShapes = {};

    vm.dataTypesConfig = this.dataTypesConfig;
        // TODO refactor away jquery
    $('.ui.dropdown')
            .dropdown({
              action: 'hide'
            });

    vm.toggleBoundary = function(boundary) {
      vm.boundary = boundary;
      if (boundary === 'gc') {
        vm.geojson = vm.geoShapes.gc;
      } else if (boundary === 'ca') {
        vm.geojson = vm.geoShapes.areas;
      } else {
        vm.geojson = vm.geoShapes.districts;
      }

            // event for zoom level
    };

    vm.boundary = 'gc';

    vm.geojson = null;

    this.geoShapeSrvc.getDC()
            .then(function(data) {
              vm.geoShapes.districts = data;
            });
    this.geoShapeSrvc.getCA()
            .then(function(data) {
              vm.geoShapes.areas = data;
            });
    this.geoShapeSrvc.getGC()
            .then(function(data) {
              vm.geoShapes.gc = data;
              vm.geojson = vm.geoShapes.gc;
            });
        // chroma.scale(['yellow', '008ae5']).mode('lch');
    vm.year = 2016;

    vm.slider = {
      value: vm.year,
      options: {
        floor: 2001,
        ceil: 2016,
        showTicks: true,
        hideLimitLabels: true,
        translate: v => {
          return '';
        }
                    // use tick color more slick
                    // getLegend: v => {
                    //   if (_.includes([2008, 2012, 2016], v)) {
                    //     return '立';
                    //   } else if (_.includes([2014], v)) {
                    //     return '區';
                    //   }
                    // }
      }
    };
        // force refresh as wrong value onload
    this.$timeout(function() {
      $scope.$broadcast('rzSliderForceRender');
    });

    vm.toggleCharts = function() {
      console.log('toggleCharts');
      vm.isChartOpen = !vm.isChartOpen;
      $('.drawer.sidebar')
                .sidebar({
                  'transition': 'push',
                  context: $('.widget-container .pushable')
                })
                .sidebar('setting', 'closable', false)
                .sidebar('setting', 'dimPage', false)
                .sidebar('toggle');
      vm.drawCharts();
            // TODO CSS?
            // TODO need lay after toggle
      this.$timeout(function() {
        $scope.$broadcast('redrawMap', true);
      });
    };

    vm.selectDataType = function(dataType) {
      vm.selectedDataType = dataType;
            // TODO multiple chart
      vm.chartTitle = vm.selectedDataType.chartTitle;
      _loadDataAndDraw(vm.selectedDataType.key);
    };

    let dataType = _.find(this.dataTypesConfig, {
      alias: $routeParams.dataTypeAlias
    });
    if (!dataType) {
      this.$location.path('/');
    } else {
      vm.selectDataType(dataType);
    }

        // TODO service
    var ndx, all, chart;

    var _createChart = function(createChartStrategy, onFilter) {
      const elemSelector = "#chart-container";
      d3.select(elemSelector + " svg").remove();
      return createChartStrategy(elemSelector)
                .turnOnControls(true)
                // .width('100%')
                .height(400)
                .margins({
                  left: 50,
                  top: 20,
                  right: 10,
                  bottom: 20
                })
                .on('filtered', function(chart, filterSelected) {
                  onFilter();
                });
    };

    function _drawAge() {

    }

    function _drawTurnout() {

    }
    vm.valueFormatter = v => numeral(v).format('0,0');

    function _loadDataAndDraw(dataType) {
            // Visualize by Type
      vm.dataPromise = dataSrvc.getData(dataType);

      vm.dataPromise.then(data => {
        vm.data = data;
        console.log('draw');
        const CATEGORIES = ['M', 'F'];

        // diff x-filter data
        // pivot
        const ndx = crossfilter(data);
        const all = ndx.groupAll();
        const yearDimension = ndx.dimension(d => d.year);
        yearDimension.filter(vm.year);

        var onFilter;
        var createChartStrategy;
        var timeDimension;
        var votersbyTimeGroup;
// clear
        if (dataType === 'vt_by_gc_ps_hour') {
          timeDimension = ndx.dimension(d => d.time);
          timeDimension.filter('2230');

          votersbyTimeGroup = timeDimension.group().reduceSum(d => d.value);
          // patch the crossfilter

          // let ndx = crossfilter(['0830', '0930', '1030']);
          // // newNdx.dimension(v => v);
          //
          // const dcDimension = ndx.dimension(d => d.dc);

          // TODO plot turnout by hour if need
          // TODO fix

          let byDcEntries =
          d3.nest().key(d => d.dc.toLowerCase())
          .rollup(leaves => {
            let voters = _.sumBy(leaves, l => l.value);
            let electors = _.sumBy(leaves, l => l['electors']);
            return {voters, electors};
          })
          .entries(timeDimension.top(ndx.size()));

          createChartStrategy = function(elemSelector) {
            console.log('line chart');
            timeDimension.filterAll();
            // TODO stack electors
            return dc.lineChart(elemSelector)
                   .renderArea(true)
                   .transitionDuration(1000)
                   .margins({top: 30, right: 50, bottom: 25, left: 40})
                   .x(d3.scale.ordinal())
                  // .x(d3.time.scale().domain([moment("1234", "hmm").toDate()]))
                   .xUnits(dc.units.ordinal)
                   .dimension(timeDimension)
                   .group(votersbyTimeGroup)
                   .valueAccessor(function(d) {
                     console.log(d);
                     return d.value;
                   })
                   .mouseZoomable(true);
          };

          // or custom handling for dcDimension to get directly, since gc also mapped
          // TODO agg by .dc, using d3
          // or reuse dimensiongroup
          onFilter = function(filter) {
            let byDc = _.merge({}, ...byDcEntries.map(o => _.fromPairs([[o.key, o.values]])));
            vm.geoData = new GeoDataModel(byDc, 'dc', function reducer(v1, v2) {
              return {
                voters: (v1.voters + v2.voters),
                electors: (v1.electors + v2.electors)
              };
            }, function accessor(v) {
              return numeral(v.voters).divide(v.electors).value();
            });
            if (filter) {
              chart.filter(filter).redraw();
            }
            $location.search('dc', chart.filters()[0]);
          };

          vm.valueFormatter = function(v) {
            return numeral(v).format('0.00%');
          };
        } else {
          const ageDimension = ndx.dimension(d => d.age_group);
                  // TODO simplify reduceSumByKey
                  // grouped total Population by age group
          const ageDimensionGroup = ageDimension.group()
                      .reduce((p, v) => {
                        p[v.category] = (p[v.category] || 0) + v.total;
                        return p;
                      }, (p, v) => {
                        p[v.category] = (p[v.category] || 0) - v.total;
                        return p;
                      }, () => {
                        return {};
                      });

          onFilter = function(filter) {
            var data = aggByKeys(ageDimension.top(ndx.size()));
            vm.geoData = new GeoDataModel(data, 'dc');
                      // $scope.$digest();
            if (filter) {
              chart.filter(filter).redraw();
            }
            $location.search('ageGroup', chart.filters()[0]);
          };
          createChartStrategy = function(elemSelector) {
                      // TODO responsive chart
            const getGroupValueByKey = category => d => d.value[category];
            // TODO extract
            $scope.$watch('$routeChangeSuccess', function() {
              let ageGroupFilter = $routeParams.ageGroup;
                        // TODO validations
              ageDimension.filter(ageGroupFilter);
              if (ageDimension.top(ndx.size()).length === 0) {
                ageDimension.filterAll();
              } else {
                onFilter(ageGroupFilter);
              }
            });
            return dc.barChart(elemSelector)
                          .elasticY(true)
                          .elasticX(true)
                          .on("postRender", function(chart) {
                            chart.select("svg")
                                  .attr("preserveAspectRatio", "xMinYMax meet");
                            chart.redraw();
                          })
                          .x(d3.scale.ordinal())
                          .xUnits(dc.units.ordinal)
                          .legend(dc.legend().x(100).y(10).itemHeight(20).gap(5))
                          .dimension(ageDimension)
                          .group(ageDimensionGroup, CATEGORIES[0], getGroupValueByKey(CATEGORIES[0]))
                          .stack(ageDimensionGroup, CATEGORIES[1], getGroupValueByKey(CATEGORIES[1]))
                          .brushOn(false)
                          .clipPadding(20)
                          // .ordinalColors(['#0A2463', '#FFFFFF', '#D81C1C', '#3E92CC', '#1E1B18'])
                          // .ordinalColors(['#99c0db', '#fb8072'])
                          .ordinalColors(['#9AC5E2', '#F7B8A1'])
                          .renderLabel(true);
          };
        }

                // manual hook as out of chart
        $scope.$watch('vm.year', (newVal, oldVal) => {
          yearDimension.filter(newVal);
          onFilter();
        });

        chart = _createChart(createChartStrategy, onFilter);
        onFilter();
      }).catch(err => console.error(err));

      vm.drawCharts = function() {
        dc.renderAll();
      };
    }
  }
}

MainCtrl.$inject = toInjects;
