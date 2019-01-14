const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const sourcemap = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano'); 
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const del = require('del');
const gulpWebpack = require('gulp-webpack');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const browserSync = require('browser-sync').create();
const cheerio = require('gulp-cheerio');
const svgMin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');
const replace = require('gulp-replace');


const paths = {
    root: './dist',
    templates: {
        pages: './src/views/pages/*.pug',
        src: './src/views/**/*.pug',
        dest: './dist'
    },
    styles: { 
        main: './src/assets/styles/main.scss',
        src: './src/assets/styles/**/*.scss',
        dest: './dist/assets/styles'
    },
    scripts: {
        src: './src/assets/scripts/*.js',
        dest: './dist/assets/scripts/'
    },
    img: {
        src: './src/assets/img/**/*.*',
        dest: './dist/assets/img/'
    },
    fonts: {
      src: './src/assets/fonts/**/*.*',
      dest: './dist/assets/fonts/'
  },
    svg: {
      src: './src/assets/img/**/*.svg',
      dest: './dist/assets/img/'
  }
}

// слежка
function watch() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.scripts.src, scripts);
}

// следим за build и релоадим браузер
function server() {
    browserSync.init({
        server: paths.root
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// img
function img(){
    return gulp.src(paths.img.src)
    .pipe(gulp.dest(paths.img.dest))
}

// fonts
function fonts(){
  return gulp.src(paths.fonts.src)
  .pipe(gulp.dest(paths.fonts.dest))
}

// очистка
function clean() {
    return del(paths.root);
}

// pug
function templates() {
    return gulp.src(paths.templates.pages)
    .pipe(plumber({
      errorHandler: notify.onError(function(err){
        return {
          title: 'PUG',
            message: err.message
        }
      })
    }))
    .pipe(pug({pretty:true}))
    .pipe(gulp.dest(paths.root));
}

// scss
function styles() {
    return gulp.src(paths.styles.main)
    .pipe(plumber({
      errorHandler: notify.onError(function(err){
        return {
          title: 'SASS',
            message: err.message
        }
      })
    }))
    .pipe(sourcemap.init())
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(autoprefixer({
      browsers: ["last 2 version"],
      cascade: false
    }))
    .pipe(cssnano())
    .pipe(rename("main.min.css"))
    .pipe(sourcemap.write())
    .pipe(gulp.dest(paths.styles.dest))
}

// webpack
function scripts() {
    return gulp.src(paths.scripts.src)
        .pipe(gulpWebpack(webpackConfig, webpack))
        .pipe(gulp.dest(paths.scripts.dest));
}

//  SVG. Создаёт SVG спрайт удоляя из него атрибуты: fill, stroke и style. 
gulp.task('svg', () => {
  return gulp.src(paths.svg.src)
    .pipe(svgMin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "sprite.svg"
        }
      }
    }))
    .pipe(gulp.dest(paths.svg.dest));
});

exports.templates = templates;
exports.styles = styles;
exports.scripts = scripts;
exports.clean = clean;
exports.img = img;
exports.fonts = fonts;



gulp.task('default', gulp.series(
    clean,
    gulp.parallel(styles, templates, scripts, img, fonts),
    gulp.parallel(watch, server)
));
