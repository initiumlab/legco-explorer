// calculated no. of electors by LC, DC based on turnout data by PS
var fs = require('fs');
var csv = require('csv');
var parse = require('csv-parse/lib/sync');
var _ = require('lodash');
var utils = require('./utils');
var glob = require('glob');

var FILE_META = {
  'vt_by_gc_ps_hour_lce':{
    'headers': ['dc','ps','gc','count',  '830', '930','1030','1130', '1230', '1330',
    '1430', '1530','1630', '1730', '1830', '1930', '2030', '2130', '2230' ],
    'start_line': 2
  },
  'vt_by_gc_ps_hour_dce':{
    'headers': ['dc','ca','ps','count', 'is_main','is_small', '830', '930','1030','1130', '1230', '1330',
    '1430', '1530','1630', '1730', '1830', '1930', '2030', '2130', '2230' ],
   'start_line': 2
  }
}
// fs.createReadStream(file)
// .pipe(csv.parse())
//   .pipe(csv.stringify ())
//   .pipe(process.stdout);
// console.log(csvData);
glob('./source/vt_by_gc_ps_hour/csv/*LCE*.csv', function (er, files) {
  console.log(files);
  _.forEach(files,function (file) {
    var targetPath = './derived/' + file.match(/[\d]+/) + '_electors_count_summary.json';
    console.log('processing file',file);
var csvData = fs.readFileSync(file);
var records = parse(csvData, {columns:
  FILE_META['vt_by_gc_ps_hour_lce']['headers']
  ,trim: true });
var result = {
  'ps':{},
  'gc':{},
  'dc':{}
}
_.forEach(records, function(v,i) {
  if (i <2){
    return;
  }
  var dc = v['dc'];
  var ps = v['ps'];
  var gc = v['gc'];
  var count =  utils.parseIntFromData(v['count']);
  result['dc'][dc] = _.add(result['dc'][dc], count);
  result['gc'][gc] = _.add(result['gc'][gc], count);
  result['ps'][ps] = count;
});
console.log(targetPath);
utils.writeJSONFileSync(targetPath, result);

  })

});
