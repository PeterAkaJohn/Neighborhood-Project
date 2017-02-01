var gulp = require('gulp'),
  cleanCSS = require('gulp-clean-css'),
  jshint = require('gulp-jshint'),
  stylish = require('jshint-stylish'),
  usemin = require('gulp-usemin'),
  del = require('del'),
  browserSync = require('browser-sync')

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

  // Watch
  gulp.task('watch', ['browser-sync'], function() {
    // Watch .js files
    gulp.watch('{src/js/*.js,src/css/*.css,src/*.html}', ['usemin']);
  });

  gulp.task('browser-sync', ['default'], function() {
    var files = [
      'src/*.html',
      'src/css/*.css',
      'src/js/*.js',
      'dist/**/*'
    ];

    browserSync.init(files, {
      server: {
        baseDir: "./dist",
        index: "index.html"
      }
    });
    // Watch any files in dist/, reload on change
    gulp.watch(['dist/**']).on('change', browserSync.reload);
  });

  gulp.task('browser-sync-src', function() {
    var files = [
      'src/*.html',
      'src/css/*.css',
      'src/js/*.js',
    ];

    browserSync.init(files, {
      server: {
        baseDir: "./src",
        index: "index.html"
      }
    });
    // Watch any files in src/, reload on change
    gulp.watch(['src/**']).on('change', browserSync.reload);
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
    gulp.start('usemin', 'copyfonts', 'watch');
  });

  gulp.task('serve', function(){
    gulp.start('browser-sync-src');
  });

  gulp.task('serve:dist', function(){
    gulp.start('browser-sync');
  })
