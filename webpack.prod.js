const webpack = require("webpack"),
			merge = require("webpack-merge"),
			MinifyPlugin = require("babel-minify-webpack-plugin"),
			{
				entry,
				output,
				cssRule,
				iconRule,
				imageRule,
				defineEnvironment,
				cleanBuildDirectory,
				providejQuery,
				separateBundles,
				extractAppCss,
				extractCubiqCss,
				createIndexHtml,
				copyViewTemplates,
				config
			} = require("./webpack.common"),
			appCss = extractAppCss(true),
			cubiqCss = extractCubiqCss(true);

module.exports = merge(config, {
	// Use default entry
	entry,

	// Use default output with chunk hash in file names
	output: merge(output, {
		filename: "[name]-[chunkhash:6].js"
	}),

	module: {
		rules: [
			cssRule(appCss, {minimize: true, include: /stylesheets/}),
			cssRule(cubiqCss, {minimize: true, include: /framework/}),
			iconRule,
			imageRule
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

		defineEnvironment("production"),
		providejQuery,
		cleanBuildDirectory,
		separateBundles,
		cubiqCss,
		appCss,

		// Minify bundles
		new MinifyPlugin(),

		createIndexHtml,
		copyViewTemplates
	],

	// Fail if any chunks exceed performance budget
	performance: {
		hints: "error",

		/*
		 * Needed temporarily because BabelMinifyWebpackPlugin doesn't support dead-code elimination
		 * (remove after switching to UglifyJSWebpackPlugin)
		 */
		maxEntrypointSize: 1000000,
		maxAssetSize: 630000
	}
});