var fs = require('fs');
var _ = require('lodash');

var parseIntFromData= function (numberString) {
    return parseInt(numberString.replace(/,/g,''),10);
}

var parseIntOrZero = function (string) {
    if(_.isUndefined(string)){
      return 0;
    }
    var v = parseIntIfNumber(string);
    if(!_.isNumber(v)){
      return 0;
    }
    return v;
}

var parseIntIfNumber= function (string) {
  if(_.isNumber(string)){
    return string;
  }
  if(string.match(/^(\d+,)*[\d]+$/)){
    return parseIntFromData(string);
  }
  return string;
}
var writeJSONFileSync= function (path, data) {
  return fs.writeFileSync(path, JSON.stringify(data, null, 4));
}
module.exports = {
  parseIntFromData:parseIntFromData,
  parseIntIfNumber:parseIntIfNumber,
  parseIntOrZero:parseIntOrZero,
  writeJSONFileSync:writeJSONFileSync
}
