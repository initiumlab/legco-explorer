// x-check percent
var expect = require('chai').expect;
var fs = require('fs');
var glob = require('glob');
// var utils = require('../utils');
var _ = require('lodash');
var d3 = require('d3-collection');
//TODO extract common
var numeral = require('numeral');
var HEADERS = ['0830', '0930', '1030', '1130', '1230', '1330', '1430', '1530', '1630', '1730', '1830', '1930', '2030', '2130', '2230']
    //TODO Make more sense to use rule-base test
var parse = require('csv-parse/lib/sync');

function parseCsvFile(f) {
    var csvData = fs.readFileSync(f);
    return parse(csvData, {
        columns: true,
        trim: true
    });
}

describe('Voter turn out', function() {
    it('should pass validations', function() {
        glob('./source/vt_by_gc_ps_hour/csv/*.csv', function(er, files) {
            console.log('test');
            console.log(files);
            files.forEach(function(f) {
                describe('Voter turn out csv', function() {
                    var csvRawData = parseCsvFile(f);
                    if (f.match(/Turnout /)) {
                        var csvPercentData = parseCsvFile(f.replace('Turnout', 'Turnout%'));
                        csvRawData.forEach(function(record, i) {
                            it(`${f} should match percent data L${i+2}`, function() {
                                var convertedPercent = Object.keys(record)
                                    .reduce(function(result, k, v) {
                                        if (_.includes(HEADERS, k)) {
                                            // https://github.com/adamwdraper/Numeral-js/pull/117
                                            //workaroun js floating issue by multiple first and take numeraljs's value...
                                            var percent = numeral(record[k]).multiply(100).divide(numeral().unformat(record['electors'])).value();
                                            result[k] = percent.toFixed(2) + '%';
                                        } else {
                                            result[k] = record[k];
                                        }
                                        return result;
                                    }, {});

                                expect(convertedPercent).to.eql(csvPercentData[i]);
                            });


                        });
                    } else {
                        csvRawData.forEach(function(r, i) {
                            it(`${f} should be always < 100% L${i+2}`, function() {
                                HEADERS.forEach(function(h) {
                                    var value = numeral().unformat(r[h]);
                                    expect(value).to.be.at.most(1);
                                });
                            });
                        })
                    }
                    csvRawData.forEach(function(r, i) {
                        it(`${f} should be monotonic increasing L${i+2}`, function() {
                            var last = 0;
                            HEADERS.forEach(function(h) {
                                var value = numeral().unformat(r[h]);
                                expect(value).to.be.at.least(last);
                                last = value;
                            })
                        });
                    });
                    //TODO
                    // csvRawData.forEach(function(r, i) {
                    //     it(`${f} should be valid code L${i+2}`, function() {
                    //         expect(r[0].match(/[a-zA-Z]/)).to.be.true;
                    //         expect(r[1].match(/[a-z]\d+/)).to.be.true;
                    //         expect(r[2].match(/lc\d+/)).to.be.true;
                    //     });
                    // });
                });
            });
        });
    });
})

//TODO cross-check with electors population
