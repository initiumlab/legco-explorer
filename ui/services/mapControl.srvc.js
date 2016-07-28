/*
 * @ngdoc service
 * @name hkMap
 * @description
 * Responsible for leaflet control at interactions / reactions (e.g. redraw on size change)
 */
 const toInjects = ['leafletData', 'mapStyleConfig'];
 export default class MapControlSrvc {
   constructor(...args) {
     Object.assign(this, _.zipObject(toInjects, args));
     this.selectedLayer = '';
   }
   mouseoutHandlerFactory(featureCallback, defaultStyle) {
     let that = this;
     return function(e) {
      // Can't use resetStyle because we don't have access to the GeoJSON object
       var layer = e.target;
       console.log('mouseout');
       if (!that.selectedLayer) {
         layer.setStyle(defaultStyle);
       }
       featureCallback(e.target.feature);

       // var code = _getLayerCode(e);
      // Only reset if the area is not selected
       // if (!vm.selectedAreas.isSelected(code)) {
       //   layer.setStyle(vm._defaultStyle);
       // }
       // vm.hoveredFeature = undefined;
     };
   }
   mouseoverHandlerFactory(featureCallback, hoverStyle) {
     return function(e) {
      // TODO extract selection logic
       var layer = e.target;
       if (this.selectedLayer !== layer) {
         layer.setStyle(hoverStyle);
       }
       if (!L.Browser.ie && !L.Browser.opera) {
         layer.bringToFront();
       }
       featureCallback(e.target.feature);
     };
   }
   _drawSelected() {
     let that = this;
     that.selectedLayer.setStyle(that.mapStyleConfig.selected);
   }
   toggleSelected(layer) {
     if (this.selectedLayer === layer) {
       layer.setStyle(this.mapStyleConfig.default);
       this.selectedLayer = null;
       return false;
     } else {
       this.selectedLayer = layer;
       this._drawSelected(layer);
       return true;
     }
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
   redrawMap(mapId, featureStyler, invalidateSize, targetZoom) {
     console.log('redraw');
     let that = this;
     this.getMap(mapId).then(function(map) {
       if (!_.isNil(targetZoom)) {
         map.zoomIn(targetZoom - map._zoom);
       }
       if (invalidateSize) {
         map.invalidateSize();
       }
       that.updateStyle(map, featureStyler);
       that._drawSelected();
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
