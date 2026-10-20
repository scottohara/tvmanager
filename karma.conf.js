const common = require("./karma.common"),
	mobileSafariLauncher = require("./karma-mobile-safari-launcher"),
	webpack = require("./webpack.coverage");

module.exports = (config) => {
	config.set(
		Object.assign(common, {
			/*
			 * Preprocess matching files before serving them to the browser
			 * available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
			 */
			preprocessors: {
				"src/**/*.test.ts": "webpack",
			},

			/*
			 * Webpack configuration
			 * Needs output, see https://github.com/ryanclark/karma-webpack/issues/498
			 */
			webpack: {
				...common.webpack,
				...webpack,
			},

			/*
			 * Test results reporter to use
			 * possible values: 'dots', 'progress'
			 * available reporters: https://npmjs.org/browse/keyword/karma-reporter
			 */
			reporters: ["mocha", "coverage-istanbul"],

			coverageIstanbulReporter: {
				reports: ["html", "text", "text-summary", "lcovonly"],
				dir: "coverage",
				combineBrowserReports: true,
				fixWebpackSourcePaths: true,
				"report-config": {
					html: { subdir: "frontend" },
					lcovonly: { file: "frontend/lcov.info" },
				},
			},

			// Enable / disable watching file and executing tests whenever any file changes
			autoWatch: false,

			/*
			 * Start these browsers
			 * available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
			 */
			browsers: ["ChromeHeadless", "MobileSafari"],

			// Explicitly listing plugins disables auto-loading, so "karma-*" must be included
			plugins: ["karma-*", mobileSafariLauncher],

			// Simulator used by the MobileSafari launcher
			mobileSafari: {
				deviceType: "com.apple.CoreSimulator.SimDeviceType.iPhone-14-Pro-Max",
				runtime: "com.apple.CoreSimulator.SimRuntime.iOS-26-5",
			},

			// Allow for creating and booting a fresh simulator on slow CI runners
			captureTimeout: 300000,

			/*
			 * Continuous Integration mode
			 * if true, Karma captures browsers, runs the tests and exits
			 */
			singleRun: true,
			failOnSkippedTests: true,
		}),
	);
};
