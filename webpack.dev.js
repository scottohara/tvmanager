const merge = require("webpack-merge"),
			LiveReloadPlugin = require("webpack-livereload-plugin"),
			OpenBrowserPlugin = require("open-browser-webpack-plugin"),
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
			}),
			merge(htmlRule, {
				options: {
					// Don't minify
					minimize: false
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
		defineAppConfig({maxDataAgeDays: 9999}),
		generateServiceWorker,

		// Live reload when in watch mode
		new LiveReloadPlugin({
			appendScriptTag: true
		}),

		// Open a browser automatically
		new OpenBrowserPlugin({url: "http://localhost:3001/index.html"})
	]
});