import {agg, GeoDataModel, asNumber} from './dataMapper.js';
import chai from 'chai';
import _ from 'lodash';
const expect = chai.expect;
describe('agg', function() {
  var input = [
    [
      'age_group', 'category', 'a', 'b', 'c'
    ],
    [
      '18-20',
      'M',
      '1,234',
      456,
      789
    ],
    [
      '18-20',
      'F',
      '2,345',
      456,
      111
    ],
    [
      '20-25',
      'M',
      234,
      456,
      222
    ],
    [
      '20-25',
      'F',
      123,
      456,
      333
    ]
  ];

  it('should filter and return by keys', () => {
    // agg if not filtered

    let result = agg(input, {
      'category': 'M'
    }, ['a', 'b']);
    expect(result['a']).to.equal(asNumber(input[1][2]) + asNumber(input[3][2]));
    expect(result['b']).to.equal(asNumber(input[1][3]) + asNumber(input[3][3]));
  });
  it('should support multiple filters', () => {
    let result = agg(input, {
      'age_group': '18-20',
      'category': 'M'
    }, ['a']);
    expect(result['a']).to.equal(1234);
    // expect(result['a']).to.equal(_.sumBy(input.splice(1, input.length), r => r[2]));
  });
  it('should support no filters', () => {
    let result = agg(input, null, ['a']);
    expect(result['a']).to.equal(3936);
    // expect(result['a']).to.equal(_.sumBy(input.splice(1, input.length), r => r[2]));
  });
  it('should return all keys if no select specified', function() {
    // make sense only if 1 record / all fields are numeric
    let result = agg(input, {
      'age_group': '18-20',
      'category': 'M'
    });
    console.log(result);
    expect(_.keys(result)).to.eql(input[0]);
  });
  it('should return by groupByKey', function() {
    // make sense only if 1 record / all fields are numeric
    let result = agg(input, {}, ['a', 'b', 'c'], 'age_group');
    console.log(result);
    expect(result['18-20']['a']).to.eql(asNumber(input[1][2]) + asNumber(input[2][2]));
  });
});
describe('GeoDataModel ', function() {
  describe('with data', function() {
    const byDc = {
      'a': 1,
      'b': 2,
      'c': 3,
      'f': 5,
      'z': 6
    };
    const byCa = {
      'a01': 1,
      'b01': 2,
      'b02': 2,
      'f01': 111
    };
    let modelByDc = new GeoDataModel(byDc, 'dc');
    let modelByCa = new GeoDataModel(byCa, 'ca');
    // it('should filter keys', function() {
    //   expect(_.keys(modelByDc.groupByBoundary('dc'))).to.eql(['a', 'b', 'c', 'f']);
    // });
    // it('should agg after filter keys', function() {
    //   expect(modelByDc.groupByBoundary('gc')).to.eql({'lc1': 6, 'lc2': 5});
    // });
    it('should agg mutliple levels', function() {
      // expect(modelByCa.groupByBoundary('dc')).to.eql({'a': 1, 'b': 4, 'f': 111});
      expect(modelByCa.groupByBoundary('gc')).to.eql({'lc1': 5, 'lc2': 111});
    });
  });
});
