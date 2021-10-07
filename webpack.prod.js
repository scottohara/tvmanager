const { CleanWebpackPlugin } = require("clean-webpack-plugin"),
			{ merge } = require("webpack-merge"),
			{
				entry,
				output,
				cssRule,
				iconRule,
				imageRule,
				htmlRule,
				providejQuery,
				extractCss,
				createIndexHtml,
				defineAppConfig,
				generateServiceWorker,
				workers,
				config
			} = require("./webpack.common");

module.exports = merge(config, {
	mode: "production",

	// Use default entry
	entry,

	// Use default output with chunk hash in file names
	output: merge(output, {
		filename: "[name]-[chunkhash:6].js"
	}),

	module: {
		rules: [
			cssRule,
			iconRule,
			imageRule,
			htmlRule
		]
	},

	// Extract full, separate source maps
	devtool: "source-map",

	plugins: [
		providejQuery,

		// Cleans the build directory
		new CleanWebpackPlugin(),

		extractCss(true),
		createIndexHtml,
		defineAppConfig(),
		generateServiceWorker,
		workers
	],

	// Fail if any chunks exceed performance budget
	performance: {
		hints: "error"
	}
});