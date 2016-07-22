// Loading the map layers
const PATH = 'http://gazetteer.hk/scripts/geo/';
const topojson = require('topojson');
export default class GeoShapeSrvc {
  constructor($http) {
    Object.assign(this, {$http});
  }

  _fetchData() {

  }
  getDC() {
    return this.$http.get(PATH + "dc_polygon.topo.json", {cache: true})
    .then(function(data, status) {
      return topojson.feature(data.data, data.data.objects['dc_polygon.geo']);
    });
  }
  getCA() {
    return this.$http.get(PATH + "ca_polygon.topo.json", {cache: true})
    .then(function(data, status) {
      return topojson.feature(data.data, data.data.objects['ca_polygon.geo']);
    });
  }
  // TODO update name of object
  getGC() {
    return this.$http.get("data/geo/lc_polygon.topo.json", {cache: true})
    .then(function(data, status) {
      return topojson.feature(data.data, data.data.objects['dc_polygon.geo']);
    });
  }
}
GeoShapeSrvc.$inject = ['$http'];
