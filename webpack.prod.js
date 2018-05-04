const webpack = require("webpack"),
			merge = require("webpack-merge"),
			{
				entry,
				output,
				cssRule,
				iconRule,
				imageRule,
				htmlRule,
				cleanBuildDirectory,
				providejQuery,
				extractCss,
				createIndexHtml,
				defineAppConfig,
				generateServiceWorker,
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
			cssRule({minimize: true}),
			iconRule,
			imageRule,
			htmlRule
		]
	},

	// Extract full, separate source maps
	devtool: "source-map",

	plugins: [
		/*
		 * Ensure that bundles only change when necessary by using a hash of the content for the module id
		 * instead of a numbers derived from the order of dependencies in the graph
		 */
		new webpack.HashedModuleIdsPlugin(),

		providejQuery,
		cleanBuildDirectory,
		extractCss(true),
		createIndexHtml,
		defineAppConfig(),
		generateServiceWorker
	],

	// Fail if any chunks exceed performance budget
	performance: {
		hints: "error"
	}
});