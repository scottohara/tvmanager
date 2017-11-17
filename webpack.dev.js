const webpack = require("webpack"),
			merge = require("webpack-merge"),
			LiveReloadPlugin = require("webpack-livereload-plugin"),
			OpenBrowserPlugin = require("open-browser-webpack-plugin"),
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
			appCss = extractAppCss(),
			cubiqCss = extractCubiqCss();

module.exports = merge(config, {
	// Use default entry
	entry,

	// Use default output, with no hash in file names
	output: merge(output, {
		filename: "[name].js",

		// Include detailed path info to assist with debugging
		pathinfo: true
	}),

	module: {
		rules: [
			cssRule(appCss, {include: /stylesheets/}),
			cssRule(cubiqCss, {include: /framework/}),
			merge(iconRule, {
				options: {
					// No hash in file names
					name: "[name].[ext]"
				}
			}),
			merge(imageRule, {
				options: {
					// No hash in file names
					name: "images/[name].[ext]"
				}
			})
		]
	},

	// Eval source maps
	devtool: "eval-source-map",

	plugins: [
		// Use module names instead of numbers to assist with debugging
		new webpack.NamedModulesPlugin(),

		defineEnvironment("development"),
		providejQuery,
		cleanBuildDirectory,
		separateBundles,
		cubiqCss,
		appCss,
		createIndexHtml,
		copyViewTemplates,

		// Live reload when in watch mode
		new LiveReloadPlugin({
			appendScriptTag: true
		}),

		// Open a browser automatically
		new OpenBrowserPlugin({url: "http://localhost:9393/index.html"})
	]
});