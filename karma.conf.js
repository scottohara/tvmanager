const path = require("path"),
			webpack = require("webpack");

module.exports = config => {
	config.set({
		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: "",

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ["mocha", "chai-sinon"],

		// list of files / patterns to load in the browser
		files: [
			"spec/public/**/*_spec.js",
			"spec/public/views/*"
		],

		proxies: {
			"/views/": "/base/spec/public/views/"
		},

		// list of files to exclude
		exclude: [
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			"spec/public/**/*_spec.js": ["webpack", "sourcemap"]
		},

		webpackMiddleware: {
			stats: "none"
		},

		webpack: {
			performance: {
				hints: false
			},
			module: {
				rules: [
					{
						test: /\.css$/,
						loader: "ignore-loader"
					},
					{
						test: /\.js$/,
						exclude: [
							/node_modules/,
							/src\/framework/
						],
						enforce: "post",
						loader: "istanbul-instrumenter-loader?esModules"
					}
				]
			},
			resolve: {
				// For testing, remap all modules to their mock versions by default
				alias: {
					"components/list": "mocks/list-mock",
					"components/progressbar": "mocks/progressbar-mock",
					"components/window": "mocks/window-mock",
					"controllers/application-controller": "mocks/application-controller-mock",
					"controllers/cache-controller": "mocks/cache-controller-mock",
					"controllers/database-controller": "mocks/database-controller-mock",
					"models/episode-model": "mocks/episode-model-mock",
					"models/program-model": "mocks/program-model-mock",
					"models/series-model": "mocks/series-model-mock",
					"models/setting-model": "mocks/setting-model-mock",
					"models/sync-model": "mocks/sync-model-mock",
					"framework/sw/spinningwheel": "mocks/sw-mock",
					md5: "mocks/md5-mock",
					"uuid/v4": "mocks/uuid-mock"
				},
				modules: [
					path.resolve("./src"),
					path.resolve("./spec/public"),
					path.resolve("./node_modules")
				]
			},
			devtool: "inline-source-map",
			plugins: [
				// Exposes a global jQuery object (for jQuery UI, Touch Punch etc. that expect this global to exist)
				new webpack.ProvidePlugin({
					jQuery: "jquery"
				})
			]
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ["mocha", "coverage"],

		mochaReporter: {
			showDiff: true
		},

		coverageReporter: {
			reporters: [
				{type: "html", dir: "../coverage"},
				{type: "text"},
				{type: "text-summary"},
				{type: "lcovonly", dir: "../coverage"}
			],
			subdir(browser) {
				// Normalise browser names
				return browser.toLowerCase().split(/[ /-]/)[0];
			}
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: "INFO",

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ["ChromeHeadless", "MobileSafari"],

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	});
};
