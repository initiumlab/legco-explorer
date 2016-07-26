'use strict';
var XLSX = require('xlsx');
var glob = require("glob");
var path = require('path');
// var path = './source/vt_by_gc_ps_hour/official_xlsx/';
var paths = './source/**/*xlsx/**/';
var fs = require('fs');
var xlsx_folder = /official_xlsx|xlsx/;
var mkdirp = require('mkdirp');
var parse = require('csv-parse/lib/sync');
var stringify = require('csv-stringify/lib/sync');

var FR_DC_AGE_SEX = 'fr_dc_age_sex';
var VT_BY_GC_PS_HOUR = 'vt_by_gc_ps_hour';
var toAgg = [FR_DC_AGE_SEX, VT_BY_GC_PS_HOUR];
var HEADERS = {};
HEADERS[FR_DC_AGE_SEX] = ["age_group", "category", "a", "b", "c", "d", "hki_total", "e", "f", "g", "kle_total", "h", "j", "klw_total", "k", "l", "m", "s", "t", "ntw_total", "n", "p", "q", "r", "nte_total", "total"];
HEADERS[VT_BY_GC_PS_HOUR] = ['dc', 'ps', 'gc', 'electors', '0830', '0930', '1030', '1130', '1230', '1330', '1430', '1530', '1630', '1730', '1830', '1930', '2030', '2130', '2230'];

glob(paths + "*.+(xlsx|xls)", function(er, files) {
  console.log(files);
  var allData = {};
  toAgg.forEach( function(key) {
    allData[key] = [];
  });

  files.forEach(function(f) {
    var fileType = '';
    var year = f.match(/(\d+)/)[0];
    console.log(f);
    console.log('year %s', year);
    // skip 1st line for gc voter turnout
    var workbook = XLSX.readFile(f);
    var postProcessCsvData;
    var headersToAdd;
    var sheetIndex = 0;
    if (f.startsWith('./source/vt_by_gc_ps_hour/')) {
      headersToAdd=  HEADERS[VT_BY_GC_PS_HOUR];
      if(f.match(/\%/)){
        fileType = VT_BY_GC_PS_HOUR+'_percent';
      }else{
        fileType = VT_BY_GC_PS_HOUR;

      }
      console.log(fileType);
        postProcessCsvData = function(csvData) {
          console.log('splice');
          var removed =csvData.splice(0,2);
//remove the is small poll station columns

var FILES_WITH_SMALL_PS_COLUMNS = [
  '2011 DCE - Voter Turnout by PS.xlsx',
  '2011 DCE - Voter Turnout% by PS.xlsx',
  '2015 DCE - Voter Turnout by PS.xlsx',
  '2015 DCE - Voter Turnout% by PS.xlsx'
];

var FILES_WITH_PS_NAMES = [
    '2012 LCE - GC Voter Turnout% by PS.xlsx'
]
var fileName = f.substr(f.lastIndexOf('/')+1);
          if (FILES_WITH_PS_NAMES.includes(fileName))
         {
          console.log('removed');
          console.log(f);
            csvData= csvData
                    .map(function(record) {
                      record.splice(3, 1);
                      record.splice(3, 1);
                      return record;
                    });
          }
          if(FILES_WITH_SMALL_PS_COLUMNS.includes(fileName)){
            csvData= csvData
                    .map(function(record) {
                      record.splice(4, 1);
                      record.splice(4, 1);
                      return record;
                    });
          }
          return csvData.filter(function (r) {
            //filter remarks
            return !!r[0].match(/^[a-zA-Z]/);
          });
        };

    }

    if (f.startsWith('./source/fr_dc_age_sex/')) {
      fileType = FR_DC_AGE_SEX;
      sheetIndex = 1;
      headersToAdd = HEADERS[FR_DC_AGE_SEX];

      if (f.match(/2014/)) {
        sheetIndex = 0;
      }
      function take(row, i) {
        return row.map(function(data) {
          return data[i];
        });
      }
      function insert(data, next) {
        [6, 10, 13, 19, 24].forEach(function(k) {
          data.splice(k - 1, 1, next[k]);
        });
        return data;
      }

      postProcessCsvData = function(csvData) {
        console.log('post');
        var results = [];
        csvData
          .forEach(function(row, i, rows) {
            console.log(i);
            console.log(row);
            if (row[1] === 'F M' || row[1] === 'M F') {
              var split = row.map(function(cell) {
                return cell.split(/\s{1,2}/);
              }).slice(1);
              if (f.match(/2016/) || f.match(/2015/)) {
                results.push([row[0]].concat(take(split, 0)));
                results.push([row[0]].concat(insert(take(split, 1), rows[i + 1])));
              } else if (!f.match(/2014/)) {
                results.push([row[0]].concat(take(split, 0)));
                results.push([row[0]].concat(take(split, 1)));
              }
            // 2014: whole row separated
            // 2015-16: subtotal column separated
            // TODO fix 2016 district total is in another row..
            } else if (row[0].endsWith('Sub-total')) {
              var index = row[0].indexOf('Sub-total');
              var tmp = row[0];
              row[0] = tmp.substr(0, index - 1);
              row[1] = tmp.substr(index, tmp.length);
              results.push(row);
            } else if (i > 1 && row[0]) {
              results.push(row);
            }
          });
        // console.log(results);
        return results;
      };
    }
    var sheetName = workbook.SheetNames[sheetIndex];
    var worksheet = workbook.Sheets[sheetName];
    var csvData = parse(XLSX.utils.sheet_to_csv(worksheet));
    if (postProcessCsvData) {
      csvData = postProcessCsvData(csvData);
    }
    if (allData[fileType]) {
      allData[fileType] = allData[fileType].concat(
        csvData.map(
          function(d) {
            return [year].concat(d);
          }));
    }
    if (headersToAdd) {
      csvData.unshift(headersToAdd);
    }
    csvData.forEach(function (r, i) {
      if(r.length!==csvData[0].length){
        //TODO header logic
        throw new Error(`${f} L${i+2} fields count not match expect: ${csvData[0].length} acutal: ${r.length}`)
      }
    })
    mkdirp.sync(path.dirname(f).replace(xlsx_folder, 'csv'));
    var targetPath = f.replace(/\.(xlsx|xls)$/, '.csv').replace(xlsx_folder, 'csv');
    console.log(targetPath);
    fs.writeFileSync(targetPath, stringify(csvData));
  });
  allData[FR_DC_AGE_SEX] = allData[FR_DC_AGE_SEX].filter(function(r) {
    return r[2] !== 'Sub-total';
  });

  console.log('test');

  toAgg.forEach(function(key) {
    console.log(`writing aggregated file ${key}`);
    allData[key].unshift(['year'].concat(HEADERS[key]));
    fs.writeFileSync('./derived/' + key.toLowerCase() + '.csv', stringify(allData[key]));
  });
  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.
});
