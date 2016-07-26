var mapshaper = require('mapshaper');
mapshaper.applyCommands(dataset.layers, dataset, opts);
console.log(mapshaper.join);
