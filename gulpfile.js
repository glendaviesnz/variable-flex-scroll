var gulp = require('gulp');
var ts = require('gulp-typescript');
var less = require('gulp-less');
var tsProject = ts.createProject('tsconfig.json');

gulp.task('default', function () {
    return tsProject.src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest('dist'));
});

gulp.task('less', function () {
  gulp.src('src/_customScroll.less')
    .pipe(less())
    .pipe(gulp.dest('dist'));
});