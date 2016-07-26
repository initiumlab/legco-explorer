// Modified from below, decoupling styling with map details
// Internal state for current choropleth
// decouple geo /data logic with rendering logic
// Provide API for coloring & selection hooks
// cases1: static color, no scale required (original color) case2: scale
// https://github.com/gazetteerhk/census_explorer/blob/master/frontend/app/scripts/directives/hkChoropleth.js
import _ from 'lodash';
import chroma from 'chroma-js';
export default class ChoroplethMapSrvc {
  constructor() {
    // Object.assign(this, {});
    // TODO handle also selected
    // ordinal as default
    this.choroplethState = {
      colorScale: chroma.scale(["#fbb4ae", "#fbb4ae", '#ccebc5', '#decbe4', '#fed9a6']).domain([0, 5])
    };
  }
  updateState(data) {
    console.log('update choropleth state');
    let scaleMax = 1;
    let scaleMin = 0;
    if (!_.isEmpty(data)) {
      let max = _.max(_.values(data));
      let min = _.min(_.values(data));
      // smoothen the diff for close values
      let diff = (max - min) / 2;
      if (max !== min) {
        [scaleMin, scaleMax] = [min - diff, max + diff];
      }
    }
    this._setupScales([scaleMin, scaleMax]);
  }
  setupStyle(defaultStyle) {
    this._defaultStyle = defaultStyle;
  }
  _setupScales(range) {
    // TODO update scale
    // typical scale: 10, lc: 5
    // consistent scale across lc-dc-ca, but lc is based on aggreegation -- so always update with domain max
    this.choroplethState.colorScale = chroma.scale('OrRd').domain(range, 10, 'quantiles');
  }
  // _applyStylesToMap(map) {
  //  // Given a map, loop through the layers in the map and apply the appropriate style given
  //   var layers = _.values(map._layers);
  //   _.forEach(layers, function(layer) {
  //     if (!_.isUndefined(layer.feature) &&
  //      !_.isUndefined(layer.feature.properties)) {
  //       layer.setStyle(this.getStyleByFeature(layer.feature));
  //     }
  //   });
  // }
  _getColor(val, colorMap) {
    if (!_.isEmpty(colorMap)) {
      return this.choroplethState.colorMap[val];
    }
    return this._getColorByScale(val);
  }
  _getColorByScale(val) {
    return this.choroplethState.colorScale(val).hex();
  }
  getStyleByFeature(feature, getDataByFeature) {
    // TODO decouple generic code logic
    // TODO getDataByAreaCode into service
    var style = _.clone(this._defaultStyle);
    if (getDataByFeature) {
      style.fillColor = this._getColor(getDataByFeature(feature));
    }
    // if (!_.isUndefined($scope._mapConfig.style)) {
    //   _.extend(style, $scope._mapConfig.style);
    // }

    return style;
  }

}
