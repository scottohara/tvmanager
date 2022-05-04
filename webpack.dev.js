const { merge } = require("webpack-merge"),
			{
				output,
				cssRule,
				iconRule,
				imageRule,
				htmlRule,
				webmanifestRule,
				extractCss,
				createIndexHtml,
				defineAppConfig,
				config
			} = require("./webpack.common");

module.exports = merge(config, {
	// Use default output, with no hash in file names
	output,

	module: {
		rules: [
			cssRule,
			iconRule,
			imageRule,
			htmlRule,
			webmanifestRule
		]
	},

	// Eval source maps
	devtool: "eval-source-map",

	devServer: {
		allowedHosts: "all",
		open: true,
		proxy: {
			"/": "http://localhost:3001"
		}
	},

	plugins: [
		extractCss(),
		createIndexHtml,
		defineAppConfig({ maxDataAgeDays: 9999 })
	]
});