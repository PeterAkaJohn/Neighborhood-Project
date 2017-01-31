var gulp = require('gulp'),
  cleanCSS = require('gulp-clean-css'),
  jshint = require('gulp-jshint'),
  stylish = require('jshint-stylish'),
  usemin = require('gulp-usemin'),
  del = require('del');

  gulp.task('minify-css', function() {
  return gulp.src('./src/css/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist'));
  });

  gulp.task('jshint', function() {
    return gulp.src('./src/js/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
  });

  gulp.task('usemin',['jshint'], function () {
    return gulp.src('./src/*.html')
        .pipe(usemin({
          css:[cleanCSS()],
          js: []
        }))
        .pipe(gulp.dest('dist'));
  });

  gulp.task('copyfonts', ['clean'], function() {
    gulp.src('./node_modules/bootstrap/dist/fonts/**/*.{ttf,woff,eof,svg}*')
      .pipe(gulp.dest('./dist/fonts'));
  });

  // Clean
  gulp.task('clean', function() {
    return del(['dist']);
  });

  // Default task
  gulp.task('default', ['clean'], function() {
    gulp.start('usemin', 'copyfonts');
  });
