//one of the usages: as intermediate input for geojson join (not friendly with program access)
var mapping = require('./source/geocode/lc_mapping.json');
var fs = require('fs');
var stringify = require('csv-stringify/lib/sync');
var _ = require('lodash');
var resultRecords =[['LC_CODE','DC_CODE']];
var byLcCode = _.mapValues(mapping, function (o) {
  return o.districts;
})

_.forEach(_.keys(byLcCode),function ( lcCode) {
  _.forEach(byLcCode[lcCode],function (dcCode) {
    resultRecords.push([lcCode.toUpperCase(), dcCode.toUpperCase()])
  })
})

var csvData = stringify(resultRecords);
  fs.writeFileSync('./derived/geo/dc_lc_mapping.csv'  ,csvData);
