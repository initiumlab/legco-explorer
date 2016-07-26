var webpack = require('webpack');
var ghPages = require('gulp-gh-pages');
var gulp = require('gulp');
var changed = require('gulp-changed');
var webpackConfig = require('./webpack.config.js');
var file = require('gulp-file');
var DIST = 'dist';
var concat = require('gulp-concat');
var merge = require('merge-stream');
process.env.NODE_ENV = 'prd';
gulp.task('webpack', function(callback) {
    // run webpack
  webpack(webpackConfig, function(err, stats) {
    if (err) throw new gutil.PluginError("webpack", err);
    callback();
  });
});

gulp.task('copy', function() {
  return merge(gulp.src('./ui/images/**')
    .pipe(changed(DIST + '/images'))
    .pipe(gulp.dest(DIST + '/images')),
  gulp.src('./data/**')
      .pipe(changed(DIST + '/data'))
      .pipe(gulp.dest(DIST + '/data')));
});

gulp.task('build', ['copy', 'webpack']);

gulp.task('deploy', ['build'], function() {
  return gulp.src(DIST + '/**/*')
    .pipe(file('CNAME', 'legco-explorer.initiumlab.com'))
   .pipe(ghPages({
   }));
});
