/*
 * @ngdoc service
 * @name hkMap
 * @description
 * Responsible for leaflet control at interactions / reactions (e.g. redraw on size change)
 */
 const toInjects = ['leafletData'];
 export default class MapControlSrvc {
   constructor(...args) {
     Object.assign(this, _.zipObject(toInjects, args));
   }
   mouseoutHandlerFactory(defaultStyle) {
     return function(e) {
      // Can't use resetStyle because we don't have access to the GeoJSON object
       var layer = e.target;
       layer.setStyle(defaultStyle);
       // var code = _getLayerCode(e);
      // Only reset if the area is not selected
       // if (!vm.selectedAreas.isSelected(code)) {
       //   layer.setStyle(vm._defaultStyle);
       // }
       // vm.hoveredFeature = undefined;
     };
   }
   mouseoverHandlerFactory(featureCallback) {
     var that = this;
     return function(e) {
      // TODO extract selection logic
       var layer = e.target;
       layer.setStyle({
         weight: 4,
         color: 'white',
        // color: '#2c7fb8',
         dashArray: ''
       });
       if (!L.Browser.ie && !L.Browser.opera) {
         layer.bringToFront();
       }
       featureCallback(e.target.feature);
       console.log(e.target.feature);
     };
   }
  //  selectFeatureFactory(e) {
  //    return function(e) {
  //    // If the object is an area:
  //      var code = _getLayerCode(e);
   //
  //    // If single select is turned on, then clear map state before doing anything else
  //      if (vm._singleSelect === true) {
  //      // We use redraw map instead of directly removing the style on the last selected layer
  //      // Also clearing the state early handles a couple edge cases, mostly involving zooming in to areas from districts
  //      // - select district -> zoom in -> click on already selected area
  //      // - select district -> zoom in -> select area
  //        vm.selectedAreas.clearSelected();
  //        _redrawMap();
  //      }
   //
  //      if (vm.selectedAreas.isSelected(code)) {
  //      // If the object is already selected, unselect it
  //        e.target.setStyle(vm._hoverStyle);
  //        vm.selectedAreas.removeArea(code);
  //      } else {
  //      // If it isn't already selected, select it
  //        e.target.setStyle(vm._selectedStyle);
  //        vm.selectedAreas.addArea(code);
  //      }
  //    };
  //  }
   updateStyle(map, featureStyler) {
       // Given a map, loop through the layers in the map and apply the appropriate style given
       // the current state of selectedAreas
     var layers = _.values(map._layers);
     _.forEach(layers, function(layer) {
       if (!_.isUndefined(layer.feature) &&
           !_.isUndefined(layer.feature.properties)) {
         layer.setStyle(featureStyler(layer.feature));
       }
     });
   }
   redrawMap(mapId, invalidateSize) {
     console.log('redraw');
     this.getMap(mapId).then(function(map) {
       if (invalidateSize) {
         map.invalidateSize();
       }
       this.mapControlSrvc.updateStyle(map);
     });
   }
   // Expose the map object
   // Returns a promise
   getMap(mapId) {
     if (_.isUndefined(mapId)) {
       return this.leafletData.getMap();
     } else {
       return this.leafletData.getMap(mapId);
     }
   }

}
 MapControlSrvc.$inject = toInjects;
// resetStyle = function(e) {
//  // Can't use resetStyle because we don't have access to the GeoJSON object
//     var layer = e.target;
//     console.log(that);
//     // var code = _getLayerCode(e);
//     layer.setStyle({weight: that._defaultStyle.weight});
//
//     // $scope.hoveredFeature = undefined;
//     // $scope.hoveredFeatureCode = undefined;
//   };
// }
