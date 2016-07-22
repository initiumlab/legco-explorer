console.log("entry");
require('shared/semantic/dist/semantic.css');
require("leaflet_css");
require("leaflet_marker");
require("leaflet_marker_2x");
require("leaflet_marker_shadow");
require('./index.css');
import dc from 'dc';
require('dc/dc.css');
import d3 from 'd3';
import crossfilter from 'crossfilter';

require('angularjs-slider/dist/rzslider');
require('angularjs-slider/dist/rzslider.css');

require('angular-semantic-ui');

var $ = require('jquery');
require('shared/semantic/dist/semantic.js');
import GeoShapeSrvc from './services/geoshape.srvc.js';
import DataSrvc from './services/data.srvc.js';
import AreaSelectionSrvc from './services/areaSelection.srvc.js';
import GeoMappingsSrvc from './services/geoMappings.srvc.js';
import ChoroplethMapSrvc from './services/choroplethMap.srvc.js';
import MapControlSrvc from './services/mapControl.srvc.js';
var Promise = require("bluebird");
import hkMap from './components/hkMap';
import {agg, aggByKeys, GeoDataModel} from './services/dataMapper.js';
import mapStyleConfig from './config/mapStyleConfig.json';

angular.module('app', ['leaflet-directive', 'rzModule', 'angularSemanticUi', require('angular-bluebird-promises')])
.component('hkMap', hkMap)
.service('geoShapeSrvc', GeoShapeSrvc)
.service('DataSrvc', DataSrvc)
// .service('AreaSelection', AreaSelectionSrvc)
.service('geoMappingsSrvc', GeoMappingsSrvc)
.service('mapControlSrvc', MapControlSrvc)
.service('choroplethMapSrvc', ChoroplethMapSrvc)
.value('mapStyleConfig', mapStyleConfig)
.controller('MainCtrl', function($scope, $timeout, geoShapeSrvc, DataSrvc) {
  let vm = this;
  vm.text = 'Hello world!';

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

  geoShapeSrvc.getDC()
  .then(function(data) {
    vm.geoShapes.districts = data;
  });
  geoShapeSrvc.getCA()
  .then(function(data) {
    vm.geoShapes.areas = data;
  });
  geoShapeSrvc.getGC()
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
    $timeout(function() {
      $scope.$broadcast('redrawMap', true);
    });
  };
  vm.dataTypes = [
    {
      key: 'fr_dc_age_sex',
      legend: '登記選民的年齡組別及性別分佈'
    }];

  vm.selectDataType = function(key) {
    vm.selectedDataType = _.find(vm.dataTypes, {key});
    // load data
  };
  vm.selectDataType('fr_dc_age_sex');
// TODO service
  var ndx, all, ageDimension, ageDimensionGroup;
  const CATEGORIES = ['M', 'F'];
  var data = DataSrvc.getData('fr_dc_age_sex')
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
    }, () => { return {}; }
    );
    vm.updateGeoData();
  });

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
})
.filter('prettyJSON', function() {
  function prettyPrintJson(json) {
    return JSON ? JSON.stringify(json, null, '    ') : 'your browser doesnt support JSON so cant pretty print';
  }
  return prettyPrintJson;
})
.filter('yearFilter', () => {
  // TODO decouple year & election
  return year => {
    if (_.includes([2008, 2012, 2016], year)) {
      return year + ' - 立法會選舉';
    }
    return year;
  };
});
