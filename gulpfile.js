const select_fonts = ["Montserrat"]; //Используемые шрифты
const path = {
	src: {
		css: ["src/assets/scss/style.scss"], //Стили
		js: ["src/assets/js/scripts.js"], //Скрипты
		fonts: "src/assets/fonts/", //Путь до шрифтов
		assets_images: "src/assets/images/*",
		images: "src/img/*", //Путь до шрифтов
		html: ["src/**/*.html", "!src/**/_*.html"], //Путь до html файлов
	}, //Пути до исходных файлов
	dist: {
		js: "dist/assets/js",
		css: "dist/assets/css",
		fonts: "dist/assets/fonts",
		assets_images: "dist/assets/images",
		images: "dist/img",
		html: "dist/",
	},
	watch: {
		scss: "src/assets/scss/**/*.scss",
		js: "src/assets/js/**/*.js",
		assets_images: "src/assets/images/**/*",
		images: "src/img/**/*",
		html: "src/**/*.html",
		fonts: "src/assets/fonts/*",
	}, //Пути до отслеживаемых файлов
}; //Словарь с путями

//Плагины
const { src, dest } = require("gulp"); //Методы src() и dest() из плагина gulp
const gulp = require("gulp"); //Плагин gulp

//Плагины для работы с файлами и папками
const fs = require("fs"); //Модуль для работы с файлами
const concat = require("gulp-concat");
const fileinclude = require("gulp-file-include");
const del = require("del");

//Плагины для .css
const scss = require("gulp-sass")(require("sass")); //Плагин для конвертирования scss и sass в css
const autoprefixer = require("gulp-autoprefixer"); //Плагин для автоматического добавления вендерных префиксов
const groupmedia = require("gulp-group-css-media-queries"); //Плагин для сбора всех медиа запросов
const cleancss = require("gulp-clean-css"); //Плагин для чистки и сжатия .css файлов

//Плагины для .js
const uglify = require("gulp-uglify-es").default; //Плагин для сжатия .js файлов

//Сервер
const browsersync = require("browser-sync").create();

//Подключает font-face к файлу стилей
function build_fonts_style() {
	let data = "@mixin font($fontname, $fontsource, $fontweight, $fontstyle) {\n" + "@font-face {\n" + "font-family: $fontname;\n" + "font-style: $fontstyle;\n" + "font-weight: $fontweight;\n" + "src: local($fontname),\n" + "url('../fonts/'+ $fontname + '/' + $fontsource +'.woff2') format('woff2'),\n" + "url('../fonts/'+ $fontname + '/' + $fontsource +'.woff') format('woff'),\n" + "url('../fonts/'+ $fontname + '/' + $fontsource +'.ttf') format('truetype');\n" + "}\n" + "}\n";

	let c_fontsource;
	for (let i = 0; i < select_fonts.length; i++) {
		files = fs.readdirSync(path.src.fonts + select_fonts[i] + "/");

		for (var j = 0; j < files.length; j++) {
			let fontname = files[j].split("-")[0];
			let fontsource = files[j].split(".")[0];
			let fontweight = 400;
			let fontstyle = "normal";

			let lowercase = fontsource.toLowerCase();

			//TODO: Нет цифровых обозначений
			if (lowercase.indexOf("black") != -1) fontweight = 900;
			else if (lowercase.indexOf("extrabold") != -1) fontweight = 800;
			else if (lowercase.indexOf("semibold") != -1) fontweight = 600;
			else if (lowercase.indexOf("bold") != -1) fontweight = 700;
			else if (lowercase.indexOf("medium") != -1) fontweight = 500;
			else if (lowercase.indexOf("extralight") != -1) fontweight = 200;
			else if (lowercase.indexOf("light") != -1) fontweight = 300;
			else if (lowercase.indexOf("thin") != -1) fontweight = 100;

			if (lowercase.indexOf("italic") != -1) fontstyle = "italic";

			if (c_fontsource != fontsource) {
				include_string = `@include font('${fontname}', '${fontsource}', ${fontweight}, ${fontstyle});\n`;
				data += include_string;
			}

			c_fontsource = fontsource;
		}
	}

	fs.writeFileSync("src/assets/scss/_fonts.scss", data);

	return src(path.src.fonts);
}

// = = = = = СКРИПТЫ = = = = = //

//Собрать скрипты
function build_js() {
	return src(path.src.js)
		.pipe(concat("scripts.min.js"))
		.pipe(
			fileinclude({
				prefix: "__",
				basepath: "@file",
			})
		)
		.pipe(uglify())
		.pipe(dest(path.dist.js))
		.pipe(browsersync.stream());
}

// = = = = = СТИЛИ = = = = = //

//Собрать стили
function build_css() {
	return src(path.src.css) //Найти стили
		.pipe(
			scss({
				outputStyle: "expanded",
			})
		) //Формирования развёрнутого .css
		.pipe(concat("style.min.css"))
		.pipe(
			autoprefixer({
				overrideBrowserslist: ["last 5 versions"], //Поддерживаемые браузеры
				cascade: true, //Стиль написания префиксов
			})
		) //Добавляет к стилям префиксы
		.pipe(groupmedia()) //Собрать медиа запросы в конце файла
		.pipe(cleancss()) //Чистка и сжатие файлов
		.pipe(dest(path.dist.css))
		.pipe(browsersync.stream());
}

//Собрать страницы
function build_html() {
	return src(path.src.html) //Найти стили
		.pipe(
			fileinclude({
				prefix: "__",
				basepath: "@file",
			})
		)
		.pipe(dest(path.dist.html))
		.pipe(browsersync.stream());
}

//Собрать шрифты
function build_fonts() {
	return src(path.src.fonts + "*")
		.pipe(dest(path.dist.fonts))
		.pipe(browsersync.stream());
}

//Собрать изображения
function build_images() {
	return src(path.src.images).pipe(dest(path.dist.images));
}

//Собрать изображения стилей
function build_assets_images() {
	return src(path.src.assets_images).pipe(dest(path.dist.assets_images));
}

// Функция для отслеживания файлов
function watch_files() {
	browsersync.init({
		server: {
			baseDir: "./dist/",
		},
	});

	gulp.watch(path.watch.scss, build_css);
	gulp.watch(path.watch.js, build_js);
	gulp.watch(path.watch.fonts, build_fonts);
	gulp.watch(path.watch.html, build_html);
	gulp.watch(path.watch.assets_images, build_assets_images);
	gulp.watch(path.watch.images, build_images);
}

function del_dist() {
	del.sync(["dist/*"]);

	return src(path.src.fonts + "/*");
}

const css = build_css;
const js = build_js;
const html = build_html;
const fonts = gulp.parallel(build_fonts_style, build_fonts);
const images = gulp.parallel(build_images, build_assets_images);
const build = gulp.series(fonts, gulp.parallel(js, css, html, images)); //Собрать стили и скрипты
const watch = watch_files; //Отслеживание файлов
const build_and_watch = gulp.series(del_dist, build, watch); //Паралельное выполнение задач просмотра

//Присвоние переменных для понимания их gulp'ом
exports.css = css; //Собрать все стили
exports.js = js; //Собрать все скрипты
exports.fonts = fonts; //Собрать все скрипты
exports.html = html; //Собрать все скрипты
exports.build = build; //Собрать стили и скрипты
exports.watch = watch; //Начать отслеживание файлов
exports.default = build_and_watch; //Функция выполняемая при запуске gulp
