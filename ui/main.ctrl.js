import dc from 'dc';
import d3 from 'd3';
import crossfilter from 'crossfilter';
var toInjects = ['$scope', '$timeout', 'dataTypesConfig', 'geoShapeSrvc', 'dataSrvc', '$timeout'];
var Promise = require("bluebird");
import {agg, aggByKeys, GeoDataModel} from './services/dataMapper.js';
export default class MainCtrl {
  constructor(...args) {
    Object.assign(this, _.zipObject(toInjects, args));
    let vm = this;
    var $scope = this.$scope;

    vm.geoShapes = {

    };
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
      vm.drawAge();
    // TODO CSS?
    // TODO need lay after toggle
      this.$timeout(function() {
        $scope.$broadcast('redrawMap', true);
      });
    };
// $routeParams = {"bookId":"Moby"}
    vm.selectDataType = function(key) {
      vm.selectedDataType = _.find(this.dataTypesConfig, {key});
    // load data
    };
    vm.selectDataType('fr_dc_age_sex');
// TODO service
    var ndx, all, ageDimension, ageDimensionGroup;
    const CATEGORIES = ['M', 'F'];
    this.dataSrvc.getData('fr_dc_age_sex')
      .then(data => {
        // TODO refactor
        vm.data = data;

        ndx = crossfilter(vm.data);
        all = ndx.groupAll();
        ageDimension = ndx.dimension(d => d.age_group);
        // TODO simplify reduceSumByKey
        ageDimensionGroup = ageDimension.group()
        .reduce((p, v) => {
          p[v.category] = (p[v.category] || 0) + v.total;
          return p;
        }, (p, v) => {
          p[v.category] = (p[v.category] || 0) - v.total;
          return p;
        }, () => {
          return {};
        }
        );
        vm.updateGeoData();
      }).catch(err => console.error(err));

    vm.updateGeoData = function() {
    // TODO push filter inside geodatamodel
      var data = aggByKeys(ageDimension.top(ndx.size()));
      vm.geoData = new GeoDataModel(data, 'dc');
      $scope.$digest();
    };

    vm.drawAge = function() {
      const elemSelector = "#profile-age";
      let ageChart = dc.barChart(elemSelector);

    // let data = _.map(vm.data, function(v, k, o) {
    //   return {
    //     'Age Group': k,
    //     'Gender': 'M',
    //     // Should use gorup by instead
    //     'Population': v.total
    //   };
    // });

  //   .reduce((p, v) =>
  //   { p.total += v.total;
  //     return p;
  //   },
  //   (p, v) => {
  //     p.total -= v.total;
  //     return p;
  //   },
  // () => {
  //   return {total: 0};
  // });
      const getGroupValueByKey = category => d => d.value[category];

      console.log('chart data');
      console.log(vm.data);
      ageChart
    .turnOnControls(true)
    .width(1000)
    .height(480)
    .elasticY(true)
    .elasticX(true)
    .x(d3.scale.ordinal())
     .xUnits(dc.units.ordinal)
     .legend(dc.legend().x(100).y(10).itemHeight(20).gap(5))
    .dimension(ageDimension)
    .group(ageDimensionGroup, CATEGORIES[0], getGroupValueByKey(CATEGORIES[0]))
    .stack(ageDimensionGroup, CATEGORIES[1], getGroupValueByKey(CATEGORIES[1]))
    .margins({left: 50, top: 20, right: 10, bottom: 20})
  .brushOn(false)
  .clipPadding(20)
  // .ordinalColors(['#0A2463', '#FFFFFF', '#D81C1C', '#3E92CC', '#1E1B18'])
  .ordinalColors(['#99c0db', '#fb8072'])
  .renderLabel(true)
  .on('filtered', function(chart, filterSelected) {
    vm.updateGeoData();
  });
      dc.renderAll();
    };
  }
}

MainCtrl.$inject = toInjects;
