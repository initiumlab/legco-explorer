
import dc from 'dc';
import d3 from 'd3';
import crossfilter from 'crossfilter';
var toInjects = ['$scope', '$timeout', 'dataTypesConfig', 'geoShapeSrvc', 'dataSrvc', '$timeout', '$routeParams', '$location'];
var Promise = require("bluebird");
import {agg, aggByKeys, GeoDataModel} from './services/dataMapper.js';
export default class MainCtrl {
  constructor(...args) {
    Object.assign(this, _.zipObject(toInjects, args));
    let vm = this;
    let $scope = this.$scope;
    let $location = this.$location;
    let $timeout = this.$timeout;
    vm.geoShapes = {};

    vm.dataTypesConfig = this.dataTypesConfig;
    // TODO refactor away jquery
    $('.ui.dropdown')
    .dropdown({
      action: 'hide'
    })
;

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
    $timeout(function() {
      $scope.$broadcast('rzSliderForceRender');
    });
    vm.drawCharts = function() {
      dc.renderAll();
    };

    vm.toggleCharts = function() {
      let chartOpenSearch = vm.isChartOpen ? null : 1;
      $location.search('charts', chartOpenSearch);
      _doToggleCharts();
    };
    function _doToggleCharts() {
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
      $timeout(function() {
        $scope.$broadcast('redrawMap', true);
      });
    }

    if (this.$routeParams.charts) {
      // TODO delay post DOM ready
      $timeout(function() {
        _doToggleCharts();
      });
    }
    vm.selectDataType = function(dataType) {
      vm.selectedDataType = dataType;
      // TODO multiple chart
      vm.chartTitle = vm.selectedDataType.chartTitle;
    // load data
    };

    let dataType = _.find(this.dataTypesConfig, {alias: this.$routeParams.dataTypeAlias});
    if (!dataType) {
      this.$location.path('/');
    } else {
      vm.selectDataType(dataType);
    }

// TODO service
    var ndx, all, ageDimension, ageDimensionGroup, chart;

    var _createChart = function(createChartStrategy, onFilter) {
      const elemSelector = "#chart-container";
      return createChartStrategy(elemSelector)
      .turnOnControls(true)
      // .width('100%')
      .height(400)
      .margins({left: 50, top: 20, right: 10, bottom: 20})
      .on('filtered', function(chart, filterSelected) {
        onFilter();
      });
    };

    // Visualize by Type
    vm.dataPromise = this.dataSrvc.getData('fr_dc_age_sex');

    vm.dataPromise.then(data => {
      vm.data = data;
      console.log('draw');
      console.log(data);
      const CATEGORIES = ['M', 'F'];
      const ndx = crossfilter(data);
      const all = ndx.groupAll();
      const yearDimension = ndx.dimension(d => d.year);
      yearDimension.filter(vm.year);

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

      const onFilter = function(filter) {
        var data = aggByKeys(ageDimension.top(ndx.size()));
        vm.geoData = new GeoDataModel(data, 'dc');
          // $scope.$digest();
        if (filter) {
          chart.filter(filter).redraw();
        }
        $location.search('ageGroup', chart.filters()[0]);
      };

        // manual hook as out of chart
      $scope.$watch('vm.year', (newVal, oldVal) => {
        yearDimension.filter(newVal);
        onFilter();
      });
      $scope.$watch('$routeChangeSuccess', function() {
        let ageGroupFilter = this.$routeParams.ageGroup;
        // TODO validations
        ageDimension.filter(ageGroupFilter);
        if (ageDimension.top(ndx.size()).length === 0) {
          ageDimension.filterAll();
        } else {
          onFilter(ageGroupFilter);
        }
      }.bind(this));

      const createAgeChart = function(elemSelector) {
          // TODO refactor
          // TODO responsive chart
        const getGroupValueByKey = category => d => d.value[category];
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
          .ordinalColors(['#99c0db', '#fb8072'])
          .renderLabel(true);
      };

      chart = _createChart(createAgeChart, onFilter);
      onFilter();
    }).catch(err => console.error(err));
  }
}

MainCtrl.$inject = toInjects;
