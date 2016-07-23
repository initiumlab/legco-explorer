// extract as csv query module
import _ from 'lodash';

// keys are columns, return aggregated values by keys
// groupBy is to groupBy values.
// groupBy first then keys first TODO if keys are same as groupBy, should aggregate rest columns
// TODO support multiple columns for groupBy, deps on data
// TODO check w/ d3-collection
export function agg(data, filters, keys, groupByKey) {
  const headers = data[0];
  if (!keys) {
    keys = headers;
  }
  data = data.slice(1, data.length);
  var filterByIndex = _.mapKeys(filters, (v, k) => headers.indexOf(k));
  var records = data.filter(r => {
    return _.every(filterByIndex, (v, k, o) => r[k] === v);
  });
  if (groupByKey) {
    let grouped = _.groupBy(records, r => r[headers.indexOf(groupByKey)]);
    let v = _.mapValues(grouped, rows => {
      return aggFields(keys, headers, rows);
    });
    return v;
  }
  return aggFields(keys, headers, records);
}
// TODO consider http://numeraljs.com/ unformat
// keep if not number
export function asNumber(v) {
  if (_.isString(v) && v.match(/^(\d+,)*[\d]+$/)) {
    return parseInt(v.replace(/,/g, ''), 10);
  }
  return v;
}
function asNumberOrZero(n) {
  if (_.isUndefined(n) || n === '') {
    return 0;
  }
  return asNumber(n, 10);
}
// Force to numbers when sum
function aggFields(keys, headers, records) {
  var result = {};
  keys.forEach(k => {
    var idx = headers.indexOf(k);
    result[k] = _.sumBy(records, r => asNumberOrZero(r[idx]));
  });
  return result;
}

export function aggByKeys(records) {
  return _.reduce(records, (r, v, i) => {
    _.keys(v).forEach(k => {
      r[k] = (r[k] || 0) + asNumberOrZero(v[k]);
    });
    return r;
  }, {});
}

// TODO extract
import GeoMappingsSrvc from './geoMappings.srvc.js';
export class GeoDataModel {
  constructor(data, rawBoundary, nestedLevel) {
    Object.assign(this, {data, rawBoundary, nestedLevel});
    this.geoMappings = new GeoMappingsSrvc();
    // TODO extract const
    this.boundaryIndexMap = {
      'gc': 4,
      'dc': 3,
      'ca': 2,
      'ps': 1
    };
  }
// array to flip

  _isUnavailableBoundaryData(byBoundary) {
    return this.boundaryIndexMap[byBoundary] < this.boundaryIndexMap[this.rawBoundary];
  }

  _getFiltersAndAggFx(data, currentBoundaryIndex) {
    let filters = [];
    let getAggCode;
    if (currentBoundaryIndex === this.boundaryIndexMap.gc) {
      filters = this.geoMappings.getAllGCs();
    } else if (currentBoundaryIndex === this.boundaryIndexMap.dc) {
      filters = this.geoMappings.getAllDistricts();
      getAggCode = this.geoMappings.getGCFromDC.bind(this.geoMappings);
    } else if (currentBoundaryIndex === this.boundaryIndexMap.ca) {
      filters = this.geoMappings.getAllAreas();
      getAggCode = this.geoMappings.getDistrictFromArea.bind(this.geoMappings);
    } else if (currentBoundaryIndex === this.boundaryIndexMap.ps) {
      // TODO
    }
    return [filters, getAggCode];
  }

  _doGroupByBoundary(data, byBoundaryIndex) {
    // recursive but not so smart
    // TODO refactor:
    // always filter at all level, even no grouping is done.
    let currentBoundaryIndex = this.boundaryIndexMap[this.rawBoundary];

    let [filters, getAggCode] = this._getFiltersAndAggFx(data, currentBoundaryIndex);
    console.log('data');
    console.log(data);
    while (byBoundaryIndex > currentBoundaryIndex) {
      // TODO use aggByKeys
      data = _.reduce(_.pick(data, filters), (r, v, k) => {
        let code = getAggCode(k);
        r[code] = v + asNumberOrZero(r[code]);
        return r;
      }, {});
      currentBoundaryIndex++;
      [filters, getAggCode] = this._getFiltersAndAggFx(data, currentBoundaryIndex);
    }
    console.log(filters);
    return _.pick(data, filters);
  }
  groupByBoundary(byBoundary, level) {
    if (this._isUnavailableBoundaryData(byBoundary)) {
      return {};
    }
    if (level === 1) {
      return _.mapValues(this.data, v => {
        return this._doGroupByBoundary(v, this.boundaryIndexMap[byBoundary]);
      });
    }
    return this._doGroupByBoundary(this.data, this.boundaryIndexMap[byBoundary]);
  }
  isEmpty() {
    return _.isEmpty(this.data);
  }

}
