/**
* Return desired data including census / legco mapped by areas
*/
import Papa from 'papaparse';
import {agg, asNumberIfNumber, unpivot} from './dataMapper.js';
import _ from 'lodash';
import d3 from 'd3';
import numeral from 'numeral';

function collectionAsNumbers(data) {
  if (_.isArray(data)) {
    return data.map(o => _.mapValues(o, asNumberIfNumber));
  }
  return _.mapValues(data, asNumberIfNumber);
}
      // _.zipObject to add header back if needed
      // TODO proper mixin if keep this
function parseCsv(data, withHeader) {
  return collectionAsNumbers(Papa.parse(data, {
    skipEmptyLines: true
  }).data);
}
function parseCsvAsNumbers(data) {
  var parsed = Papa.parse(data, {
    header: true,
    skipEmptyLines: true
  });
  if (parsed.errors.length > 0) {
    throw new Error('Error parsing CSV');
  }
  return collectionAsNumbers(_.values(parsed.data));
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
    } else if (dataType === 'vt_by_gc_ps_hour') {
      return this._fetchCsv('/data/derived/vt_by_gc_ps_hour.csv')
      .then(function(data) {
        // knowledge of data
        console.log('test');
        const fields = ['0830', '0930', '1030', '1130', '1230', '1330', '1430', '1530', '1630', '1730', '1830', '1930', '2030', '2130', '2230'];
        return unpivot(data, fields, 'time');
      });
    }

    // TODO handle aggregated case
    // do before agg but again need knowledge of that
  }
}

DataSrvc.$inject = ['$http', 'geoMappingsSrvc'];
