'use strict';
// Modified from below, applied ES6, component style and extracted data handling
// https://github.com/gazetteerhk/census_explorer/blob/master/frontend/app/scripts/directives/hkMap.js

/*
 * @ngdoc directive
 * @name hkMap
 * @description
 * Decoupled the geoShapes which can be change due to internal (e.g. zoom)
 * and external interaction e.g. year change
 * Mediate between Models: Geo-based Data & GeoShape, turn into view (map visualization)
 * Directive for a map of Hong Kong with GeoJSON layers for district councils and constituency areas
 *
 * @param {string} [height="300px"] Height of the map.
 * @param {class} class Use the class declaration to set width in Bootstrap column system.
 * @param {object} selectedAreas Object that stores which elements in the map are selected
 * @params {} singleSelect If this attribute is present, then only a single district or area is allowed to be selected at once
 *
 */
import _ from 'lodash';
const toInjects = ['$scope', '$attrs', '$parse', 'leafletBoundsHelpers',
'choroplethMapSrvc', 'mapControlSrvc', 'geoMappingsSrvc', 'mapStyleConfig'];
class HkMapCtrl {
  constructor(...args) {
    Object.assign(this, _.zipObject(toInjects, args));
    // TODO for events callback, double chk is needed
    let choroplethMapSrvc = this.choroplethMapSrvc;
    let mapControlSrvc = this.mapControlSrvc;
    let mapId = this.$attrs.mapId;
    let vm = this;
   // Default initializations
    vm.defaults = {
      scrollWheelZoom: true,
      maxZoom: 18,
      minZoom: 11
    };

    vm.center = {
      lat: 22.363,
      lng: 114.120,
      zoom: 11
    };

    vm.layers = {
      baselayers: {
        googleRoadMap: {
          name: 'Google Streets',
          layerType: 'ROADMAP',
          type: 'google'
        }
      }
    };

   // The zoom level after which areas are drawn
    var AREATHRESHOLD = 14;

    // If we zoom in further than >= 14, then switch over to the constituency areas layer
    this.$scope.$watch('vm.center.zoom', function(newVal) {
      if (newVal >= AREATHRESHOLD) {
        // TODO refactor pull it down
        // update vm.geoShapes first
        vm.boundary = 'dc';
      } else {
        vm.boundary = 'gc';
      }
    });

   // TODO change per injected theme key
    var tilesDict = {
      'empty': {

      },
      'white': {
        name: 'Positron',
        url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        type: 'xyz'
      },
      'dark': {
        name: 'Dark Matter',
        url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        type: 'xyz'
      }
    };

    vm.tiles = tilesDict['white'];
    var BOUND_RANGE = 0.3;
    vm.maxBounds = this.leafletBoundsHelpers.createBoundsFromArray([
                [vm.center.lat + BOUND_RANGE, vm.center.lng + BOUND_RANGE],
                [vm.center.lat - BOUND_RANGE, vm.center.lng - BOUND_RANGE]
    ]);
    vm._singleSelect = _.has(this.$attrs, 'singleSelect');

    function getDataByFeature(feature) {
      let code = getGeoCodeByFeature(feature);
      if (!vm.groupedData || !vm.groupedData[code]) {
        return 0;
        // No data available at this level
      }
      return vm.groupedData[code];
    }

       // TODO: Add partially selected district styling
    this.choroplethMapSrvc.setupStyle(this.mapStyleConfig.default);
    // expliciy turn on for choroplethMapSrvc
       // Styler that styles a layer based on whether it is selected or not
    var featureStyler = function(feature) {
          // if (vm.selectedAreas.isSelected(code)) {
          //   return vm._selectedStyle;
          // } else {
      return this.choroplethMapSrvc.getStyleByFeature(feature, getDataByFeature);
          // return vm._defaultStyle;
          // }
    };

       // Model for tracking selected areas
        // if (_.isUndefined(this.$attrs.selectedAreas)) {
        //   vm.selectedAreas = AreaSelection.getModel();
        // } else {
        //   vm.selectedAreas = $parse(this.$attrs.selectedAreas)(vm);
        // }
        // TODO optimize this
       // So instead, use a listener.
    this.$scope.$on('redrawMap', function(event, invalidateSize) {
      console.log('redrawing map');
      this.mapControlSrvc.redrawMap(this.$attrs.mapId, invalidateSize);
    });

    function getGeoCodeByFeature(feature) {
      // TODO extract
      let code = '';
      if (vm.boundary === 'gc') {
        // TODO rename as GC_CODE
        code = feature.properties.LC_CODE;
      } else if (vm.boundary === 'dc') {
        code = feature.properties.DC_CODE;
      } else {
        code = feature.properties.CA;
      }
      return code.toLowerCase();
    }

    function _updateGroupedData() {
      // vm.groupedData = geoMappingsSrvc.groupByBoundary(vm.geoData, vm.boundary);
      // model this
      // TODO decouple
      if (vm.geoData) {
        vm.groupedData = vm.geoData.groupByBoundary(vm.boundary);
      }
      choroplethMapSrvc.updateState(vm.groupedData);
      return vm.groupedData;
    }

    this.$scope.$watch('vm.boundary', function() {
      _updateGroupedData();
    });
    this.$scope.$watch('vm.geoData', function() {
      _updateGroupedData();
      mapControlSrvc.redrawMap(mapId);
      // need layer name
      // leafletData.getGeoJSON(this.$attrs.id)
      //     .then(function(leafletGeoJSON) {
      //       // //this is broken on nested needs to traverse or user layerName (nested)
      //       // var lobj = layerName ? leafletGeoJSON[layerName] : leafletGeoJSON;
      //       // lobj.resetStyle(e.target);
      //     });
    });

    var _isArea = function(f) {
      return !_.isUndefined(f.properties.CA);
    };

   // Handlers for interaction
    var mouseoverHandler = function(e) {
      var layer = e.target;
      var code = _getLayerCode(e);
     // only change the style if the area is not already selected
      if (!vm.selectedAreas.isSelected(code)) {
        layer.setStyle(vm._hoverStyle);
        if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
        }
      }

      var prefix = _isArea(e.target.feature) ? "area." : "district.";
      vm.hoveredFeature = prefix + code.toLowerCase();
    };

    var _getLayerCode = function(e) {
      return e.target.feature.properties.CODE;
    };

    vm.geojson = {
      data: null,
      style: featureStyler,
      onEachFeature: function(feature, layer) {
        layer.on({
          mouseover: mapControlSrvc.mouseoverHandlerFactory(function(feature) {
            // TODO work as closure, further encap this
            vm.hoveredFeature = getGeoCodeByFeature(feature);
            vm.hoveredFeatureValue = getDataByFeature(feature);
          }),
          mouseout: this.mapControlSrvc.mouseoutHandlerFactory(vm._defaultStyle),
          click: mapControlSrvc.selectFeatureFactory()
        });
      }
    };
    this.$scope.$watch('vm.geoShapes', function(newVal) {
      if (!_.isEmpty(newVal)) {
        vm.geojson.data = newVal;
        console.log('shape updated');
        // vm.getMap().then(function(map) {
          // console.log(arguments);
          // vm.geojson.data.

          // var polygonCenter = layer.getBounds().getCenter();

// e.g. using Leaflet.label plugin
    //       L.marker(polygonCenter)
    // .bindLabel(feature.properties['NAME'], {noHide: true})
    // .addTo(map);
        // });
      }
    });
  }
}

HkMapCtrl.$inject = toInjects;

export default {
  controller: HkMapCtrl,

  bindings: {
    geoShapes: '=',
    geoData: '=',
    boundary: '='
  },
  controllerAs: 'vm',
  template: function($element, $attrs) {
    // access to $element and this.$attrs
    return require('./hkMap.html');
  }

  // compile: function(elem, attrs) {
  //   var leafletNode = angular.element(elem.children()[0]);
  //   // If height is specified, then move it to the template, otherwise use default
  //   leafletNode.css('height', attrs.height || "300px");
  //
  //   // Need relative positioning for overlay
  //   elem.css('position', 'relative');
  //
  //   // If an id is provided, move the id to the child element;
  //   // This is so that we can get the map object when we have multiple maps on the page
  //   if (!_.isUndefined(attrs.mapId)) {
  //     leafletNode.attr('id', attrs.mapId);
  //   }
  // },
};
