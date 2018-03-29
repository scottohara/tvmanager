const merge = require("webpack-merge"),
			LiveReloadPlugin = require("webpack-livereload-plugin"),
			OpenBrowserPlugin = require("open-browser-webpack-plugin"),
			{
				entry,
				output,
				cssRule,
				iconRule,
				imageRule,
				cleanBuildDirectory,
				providejQuery,
				extractCss,
				createIndexHtml,
				copyViewTemplates,
				config
			} = require("./webpack.common");

module.exports = merge(config, {
	// Use default entry
	entry,

	// Use default output, with no hash in file names
	output: merge(output, {
		filename: "[name].js"
	}),

	module: {
		rules: [
			cssRule(),
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
		providejQuery,
		cleanBuildDirectory,
		extractCss(),
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