const os = require("os"),
	path = require("path"),
	ENTROPY_SIZE = 1000000,
	outputPath = `${path.join(os.tmpdir(), "_karma_webpack_")}${Math.floor(
		Math.random() * ENTROPY_SIZE,
	)}`;

module.exports = {
	// Base path that will be used to resolve all patterns (eg. files, exclude)
	basePath: "",

	/*
	 * Frameworks to use
	 * available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	 */
	frameworks: ["mocha", "chai-sinon", "webpack"],

	// List of files / patterns to load in the browser
	files: [
		"src/**/*.test.ts",
		{
			pattern: `${outputPath}/**/*`,
			watched: false,
			included: false,
		},
	],

	mochaReporter: {
		showDiff: true,
	},

	// Web server port
	port: 9876,

	// Enable / disable colors in the output (reporters and logs)
	colors: true,

	/*
	 * Level of logging
	 * possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
	 */
	logLevel: "INFO",

	/*
	 * Webpack configuration
	 * Needs output, see https://github.com/ryanclark/karma-webpack/issues/498
	 */
	webpack: {
		output: {
			path: outputPath,
		},
	},
};
