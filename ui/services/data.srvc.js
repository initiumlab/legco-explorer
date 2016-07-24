/**
* Return desired data including census / legco mapped by areas
*/
import Papa from 'papaparse';
import {agg, asNumber} from './dataMapper.js';
import _ from 'lodash';
import d3 from 'd3';

function collectionAsNumbers(data) {
  if (_.isArray(data)) {
    return data.map(v => _.mapValues(v, asNumber));
  }
  return _.mapValues(data, asNumber);
}
      // _.zipObject to add header back if needed
      // TODO proper mixin if keep this
function parseCsv(data, withHeader) {
  return collectionAsNumbers(Papa.parse(data, {
    skipEmptyLines: true
  }).data);
}
function parseCsvAsNumbers(data) {
  var csvData = Papa.parse(data, {
    header: true,
    skipEmptyLines: true
  }).data;
  return collectionAsNumbers(_.values(csvData));
}

export default class DataSrvc {
  constructor($http, geoMappingsSrvc) {
    Object.assign(this, {$http, geoMappingsSrvc});
  }
  _fetchCsv(path) {
    return this.$http.get(path)
    .then(function(res) {
      return parseCsvAsNumbers(res.data);
    })
    .catch(function() {
      console.log(arguments);
    });
  }
  // simple key value aggregated by desired boundary
  // problem: needa change when zoom
  getData(dataType) {
    if (dataType === 'fr_dc_age_sex') {
      return this._fetchCsv('/data/derived/fr_dc_age_sex.csv')
      .then(function(data) {
        // knowledge of data
        let filteredData = data
        .filter(r => !_.includes(['Total', 'Grand Total', 'Grand  Total'], r.age_group));
        return filteredData;
      });
    }

    // TODO handle aggregated case
    // do before agg but again need knowledge of that
  }
}

DataSrvc.$inject = ['$http', 'geoMappingsSrvc'];
