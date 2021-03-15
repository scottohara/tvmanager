const { merge } = require("webpack-merge"),
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
				workers,
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
			cssRule,
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

	devServer: {
		disableHostCheck: true,
		host: "0.0.0.0",
		open: true,
		overlay: true,
		public: "localhost:8080",
		proxy: {
			"/": "http://localhost:3001"
		}
	},

	plugins: [
		providejQuery,
		cleanBuildDirectory,
		extractCss(),
		createIndexHtml,
		defineAppConfig({ maxDataAgeDays: 9999 }),
		generateServiceWorker,
		workers
	]
});