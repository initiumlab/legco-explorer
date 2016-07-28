var fs = require('fs');
var _ = require('lodash');
import numeral from 'numeral';
var parseIntFromData = function(numberString) {
  // return parseInt(numberString.replace(/,/g, ''), 10);
  return numeral(numberString).value();
};

var parseIntIfNumber = function(string) {
  if (_.isNumber(string)) {
    return string;
  }
  console.log(string.trim());
  if (string.trim().match(/^(\d+,)*[\d]+$/)) {
    return parseIntFromData(string);
  }
  return string;
};
var parseIntOrZero = function(string) {
  if (_.isUndefined(string)) {
    return 0;
  }
  var v = parseIntIfNumber(string);
  if (!_.isNumber(v)) {
    return 0;
  }
  return v;
};

var writeJSONFileSync = function(path, data) {
  return fs.writeFileSync(path, JSON.stringify(data, null, 4));
};
module.exports = {
  parseIntFromData: parseIntFromData,
  parseIntIfNumber: parseIntIfNumber,
  parseIntOrZero: parseIntOrZero,
  writeJSONFileSync: writeJSONFileSync
};
