var expect = require('chai').expect;
var fs = require('fs');
var glob = require('glob');
var utils = require('../utils');
var _ = require('lodash');
var geoMapping = require('../source/geocode/lc_mapping.json');

//TODO Make more sense to use rule-base test
var parse = require('csv-parse/lib/sync');
describe('Final Register by District age and sex profile',function () {
  it('should add up to intermediate sum and grand total',function (done) {
    glob('./source/fr_dc_age_sex/csv/*.csv', function (er, files) {
      files.forEach(function (file) {
        console.log(file);
        var csvData = fs.readFileSync(file);
        try{
        var records = parse(csvData, {columns:true ,trim: true });
        records.forEach(function (record, i) {
          if(i===0){
            describe(`${file} headers`,function () {
              it('should match',function () {
                var headers = ['year',"age_group","category","a","b","c","d","hki_total","e","f","g","klw_total","h","j","kle_total","k","l","m","s","t","ntw_total","n","p","q","r","nte_total","total"]
                expect(_.keys(record)).to.eql(headers);
              })
            })
          }
          //TODO validate cat values
        describe(`${file} L:${i+1}`,function () {
          it('should add up total by district and total',function () {
            record= _.mapValues(record, utils.parseIntIfNumber);
            // TODO gen from mapping
            // geoMapping
            var expected={};
            var actual={};
            _.forEach(_.values(geoMapping),function (gc) {
              var sum = _(record).pick(gc.districts).values().sum();
              var key = gc.alias+'_total';
              var total = record[key];
              expected[key] = total;
              actual[key] = sum;
              console.log('key %s, sum: %s, total: %s',key, sum, total);
            })
            expected['total'] = _(expected).values().sum();
            actual['total'] = record['total'];
            expect(actual).to.eql(expected);


          });
        });
        });

//TODO check also sub-total
        describe(`${file} Grand Total`,function () {
          var agg = _.reduce(records,function (r,v,i) {
            var category = v['category'];
            if(i>=records.length-3){
              return r;
            }
            //TODO extract remove keys
            _(v).keys().without('category','age_group').forEach(function (k) {
              if(!_.isEmpty(category)){
                console.log('add');
                console.log(utils.parseIntOrZero(v[k]));
                console.log(utils.parseIntOrZero(r[category][k]));
                r[category][k] = utils.parseIntOrZero(v[k]) + utils.parseIntOrZero(r[category][k]);
              }
            })
            return r;
          },{'M':{},'F':{},'Sub-total':{}})
          function getExpected(age_group, category) {
            var row = _.find(records, {'age_group':age_group, 'category':category});
            return _(row).omit('category','age_group').mapValues(utils.parseIntOrZero).value();
          }
          it('should match M total',function () {
            expect(agg['M']).to.eql(getExpected('Total','M'));
          })
          it('should match F total',function () {
            expect(agg['F']).to.eql(getExpected('Total','F'));
          })
          it('should have Sub-total add up as total',function () {
            expect(agg['Sub-total']).to.eql(getExpected('Grand Total',''));
          })
        })

      }catch(e){
        console.error('error in file');
        console.error(file);
        console.error(e);
      }
      });
      done();
    });

  })
})
