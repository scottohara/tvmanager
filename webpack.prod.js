const { merge } = require("webpack-merge"),
			{
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
				config
			} = require("./webpack.common");

module.exports = merge(config, {
	mode: "production",

	// Use default output with chunk hash in file names
	output: merge(output, {
		hashDigestLength: 6,
		filename: "[name]-[chunkhash].js",
		assetModuleFilename: "[name]-[contenthash][ext]"
	}),

	module: {
		rules: [
			cssRule,
			iconRule,
			merge(imageRule, {
				generator: {
					// Include hash in file names
					filename: "images/[name]-[contenthash][ext]"
				}
			}),
			htmlRule
		]
	},

	// Extract full, separate source maps
	devtool: "source-map",

	plugins: [
		providejQuery,
		extractCss({ filename: "[name]-[chunkhash].css" }),
		createIndexHtml,
		defineAppConfig(),
		generateServiceWorker
	],

	// Fail if any chunks exceed performance budget
	performance: {
		hints: "error"
	}
});