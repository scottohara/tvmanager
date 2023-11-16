const { merge } = require("webpack-merge"),
	{
		cssRule,
		iconRule,
		imageRule,
		htmlRule,
		webmanifestRule,
		extractCss,
		createIndexHtml,
		defineAppConfig,
		config,
	} = require("./webpack.common");

module.exports = merge(config, {
	// No hash in file names
	output: {
		assetModuleFilename: "[name][ext]",
	},

	module: {
		rules: [cssRule, iconRule, imageRule, htmlRule, webmanifestRule],
	},

	// Eval source maps
	devtool: "eval-source-map",

	devServer: {
		allowedHosts: "all",
		open: true,
		proxy: {
			"/": "http://localhost:3001",
		},
	},

	plugins: [
		extractCss(),
		createIndexHtml,
		defineAppConfig({ maxDataAgeDays: 9999 }),
	],
});
