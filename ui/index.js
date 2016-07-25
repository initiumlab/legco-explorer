console.log("entry");
require('shared/semantic/dist/semantic.css');
require("leaflet_css");
require("leaflet_marker");
require("leaflet_marker_2x");
require("leaflet_marker_shadow");
require('./index.css');
require('dc/dc.css');

require('angularjs-slider/dist/rzslider');
require('angularjs-slider/dist/rzslider.css');
require('angular-semantic-ui');

require('angular-busy/dist/angular-busy.js');
require('angular-busy/dist/angular-busy.css');

require('shared/semantic/dist/semantic.js');
import MainCtrl from './main.ctrl.js';
import GeoShapeSrvc from './services/geoshape.srvc.js';
import DataSrvc from './services/data.srvc.js';
import AreaSelectionSrvc from './services/areaSelection.srvc.js';
import GeoMappingsSrvc from './services/geoMappings.srvc.js';
import ChoroplethMapSrvc from './services/choroplethMap.srvc.js';
import MapControlSrvc from './services/mapControl.srvc.js';
import hkMap from './components/hkMap';

import mapStyleConfig from './config/mapStyle.json';
import dataTypesConfig from './config/dataTypes.json';

angular.module('app', ['leaflet-directive', 'rzModule', 'angularSemanticUi',
 'ngRoute', 'ngAnimate', require('angular-bluebird-promises'), 'cgBusy'])
.component('hkMap', hkMap)
.service('geoShapeSrvc', GeoShapeSrvc)
.service('dataSrvc', DataSrvc)
// .service('AreaSelection', AreaSelectionSrvc)
.service('geoMappingsSrvc', GeoMappingsSrvc)
.service('mapControlSrvc', MapControlSrvc)
.service('choroplethMapSrvc', ChoroplethMapSrvc)
.value('mapStyleConfig', mapStyleConfig)
.value('dataTypesConfig', dataTypesConfig)
.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/:dataTypeAlias/:boundary/', {
        template: require('./main.html'),
        controller: 'MainCtrl',
        controllerAs: 'vm',
        reloadOnSearch: false
      })
      .otherwise('/population/gc');
    // TODO HTML5 mode on github page?
    $locationProvider.html5Mode(false);
  }])
.controller('MainCtrl', MainCtrl)
.filter('prettyJSON', function() {
  function prettyPrintJson(json) {
    return JSON ? JSON.stringify(json, null, '    ') : 'your browser doesnt support JSON so cant pretty print';
  }
  return prettyPrintJson;
})
.filter('yearElectionFilter', () => {
  // TODO decouple year & election
  return (year, isByE) => {
    if (isByE && year === 2016) {
      return '立法會新界東補選';
    }
    if (_.includes([2008, 2012, 2016], year)) {
      return '立法會選舉';
    }
    return ' ';
  };
})
// for semantic url http://joelsaupe.com/programming/angularjs-change-path-without-reloading/

.run(['$route', '$rootScope', '$location', function($route, $rootScope, $location) {
  var original = $location.path;
  $location.path = function(path, reload) {
    console.log('reload');
    console.log(reload);
    if (reload === false) {
      path = path.replace(/\/?$/, '/');
      // prevent further redirect /population/dc -> /population/dc/
      var lastRoute = $route.current;
      var un = $rootScope.$on('$locationChangeSuccess', function() {
        $route.current = lastRoute;
        un();
      });
    }

    return original.apply($location, [path]);
  };
}]);
