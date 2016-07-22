import GeoMappings from './geoMappings.srvc.js';
import chai from 'chai';
import _ from 'lodash';
const expect = chai.expect;
describe('#getGCfromDC', () => {
  var geoMappings = new GeoMappings();
  it('should get correct GC  ', () => {
    expect(geoMappings.getGCFromDC('a')).to.equal('lc1');
    expect(geoMappings.getGCFromDC('e')).to.equal('lc2');
  });
  it('should get correct GC by lower case DC', () => {
    expect(geoMappings.getGCFromDC('A')).to.equal('lc1');
    expect(geoMappings.getGCFromDC('E')).to.equal('lc2');
  });
  it('should return undefined for invalid DC  ', () => {
    expect(geoMappings.getGCFromDC('z')).to.equal.undefined;
  });
});
