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
var HEADERS={}
HEADERS[FR_DC_AGE_SEX]= ["year","age_group","category","a","b","c","d","hki_total","e","f","g","kle_total","h","j","klw_total","k","l","m","s","t","ntw_total","n","p","q","r","nte_total","total"];


glob(paths+"*.+(xlsx|xls)", function (er, files) {
  console.log(files);
  var allData={};
  allData[FR_DC_AGE_SEX]=[];
  files.forEach(function (f) {
    var fileType = '';
    var year = f.match(/(\d+)/)[0];
    console.log(f);
    console.log('year %s',year);
    //skip 1st line for gc voter turnout
    var workbook = XLSX.readFile(f);
    var postProcessCsvData;
    var headersToAdd;
    var sheetIndex = 0;
    if(f === './source/vt_by_gc_ps_hour/official_xlsx/2012 LCE - GC Voter Turnout% by PS.xlsx'){
      postProcessCsvData = function (csvData) {
        return csvData
          .map(function (record) {
            record.splice(3, 1);
            record.splice(3, 1);
            return record;
          });
      }
    }
    if(f.startsWith('./source/fr_dc_age_sex/')){
      fileType = FR_DC_AGE_SEX;
      sheetIndex = 1;

      if(f.match(/2014/)){
        sheetIndex = 0;
      }
      function take(row, i) {
        return row.map(function (data) {
          return data[i];
        });
      }
      function insert(data, next) {
        [6,10,13,19,24].forEach(function (k) {
          data.splice(k-1,1, next[k]);
        });
        return data;
      }
      headersToAdd = HEADERS[FR_DC_AGE_SEX];
            postProcessCsvData = function (csvData) {
          console.log('post');
        var results = [];
        csvData
          .forEach(function (row, i, rows) {
            console.log(i);
            console.log(row);
          if(row[1]==='F M' || row[1] === 'M F'){
              var split = row.map(function (cell) {
                  return cell.split(/\s{1,2}/)
              }).slice(1);
            if(f.match(/2016/)||f.match(/2015/)){
              results.push([row[0]].concat(take(split, 0)));
              results.push([row[0]].concat(insert(take(split, 1),rows[i+1])));
            } else if (!f.match(/2014/)) {
              results.push([row[0]].concat(take(split, 0)));
              results.push([row[0]].concat(take(split, 1)));
            }
            //2014: whole row separated
            //2015-16: subtotal column separated
            //TODO fix 2016 district total is in another row..

          } else if (row[0].endsWith('Sub-total')){
            var index = row[0].indexOf('Sub-total');
            var tmp = row[0];
            row[0] = tmp.substr(0,index-1);
            row[1] = tmp.substr(index, tmp.length);
            results.push(row);
          } else if (i > 1 && row[0]){
            results.push(row);
          }
        });
        // console.log(results);
        return results;
      }
    }
    var sheetName = workbook.SheetNames[sheetIndex];
    var worksheet = workbook.Sheets[sheetName];
    var csvData = parse(XLSX.utils.sheet_to_csv(worksheet));
    if(postProcessCsvData){
      csvData = postProcessCsvData(csvData);
    }

    if(allData[fileType]){
      allData[fileType] = allData[fileType].concat(
        csvData.map(
          function (d) {
        return [year].concat(d);
      }));
    }
    if(headersToAdd){
      csvData.unshift(headersToAdd);
    }
    mkdirp.sync(path.dirname(f).replace(xlsx_folder,'csv'));
    var targetPath = f.replace(/\.(xlsx|xls)$/,'.csv').replace(xlsx_folder,'csv');
    console.log(targetPath);
    fs.writeFileSync(targetPath,stringify(csvData));
  })
    allData[FR_DC_AGE_SEX].unshift(HEADERS[FR_DC_AGE_SEX]);
    allData[FR_DC_AGE_SEX] =allData[FR_DC_AGE_SEX].filter(function (r) {
      return r[2]!=='Sub-total';
    })
    fs.writeFileSync('./derived/'+FR_DC_AGE_SEX.toLowerCase()+'.csv',stringify(allData[FR_DC_AGE_SEX]));
  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.
})
