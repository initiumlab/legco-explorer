var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var path = require('path');
var srcExcludeFolders = '';

var config = {
  entry: {
    'app': 'ui/index.js',
    'vendors': [
      'angular', 'angular-route', 'angular-animate', 'lodash', 'leaflet', 'angular-leaflet-directive',
      'babel-polyfill', 'topojson'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[chunkhash].js',
    libraryTarget: 'umd'
  },
  module: {
    preLoaders: [
      {test: /ui\/.*\.js$/, loader: "eslint-loader", exclude: srcExcludeFolders}
    ],
    loaders: [
      {
        test: /ui\/.*\.js$/,
        loader: 'babel-loader',
        query: {
          compact: false,
          cacheDirectory: true
        },
        exclude: srcExcludeFolders
      },
            {test: /\.json$/, loader: "json-loader"},
      {test: /\.css$/, loader: "style-loader!css-loader"},
      {test: /\.png$/, loader: "url-loader?limit=100000"},
      {test: /\.(woff(2)?|eot|svg|ttf)$/, loader: "url-loader?limit=100000"},
      {test: /\.jpg$/, loader: "file-loader"},
      {test: /\.html$/, loader: "html"}
    ]
  },
  externals: {
    // if we do CDN
    // 'angular': 'angular'
  },
  eslint: {
    configFile: '.eslintrc.js',
    failOnError: false,
    failOnWarning: false
  },
  resolve: {
    root: [__dirname],
    extensions: ['', '.js'],
    alias: {
      leaflet_css: __dirname + "/node_modules/leaflet/dist/leaflet.css",
      leaflet_marker: __dirname + "/node_modules/leaflet/dist/images/marker-icon.png",
      leaflet_marker_2x: __dirname + "/node_modules/leaflet/dist/images/marker-icon-2x.png",
      leaflet_marker_shadow: __dirname + "/node_modules/leaflet/dist/images/marker-shadow.png"
    }
  },
  plugins: [new HtmlWebpackPlugin({
    title: '香港選舉數據庫',
    template: 'ui/index.ejs' // Load a custom template
    // inject: 'body' // Inject all scripts into the body
  }), new webpack.ProvidePlugin({
    'window.L': 'leaflet',
    'L': 'leaflet',
    'jQuery': 'jquery',
    '$': 'jquery',
    'window.$': 'jquery'
    // datamap: 'datamaps/dist/datamaps.hkg.min.js'
  }), new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
      drop_console: true
    }
  })]
  // devtool: "eval"
};

if (process.env.NODE_ENV === 'DEV') {
  config.devtool = 'eval';
}

module.exports = config;
