const { merge } = require("webpack-merge"),
	{
		cssRule,
		iconRule,
		imageRule,
		htmlRule,
		webmanifestRule,
		extractCss,
		createIndexHtml,
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
		open: true,
		proxy: [
			{
				context: ["/"],
				target: "http://localhost:3000",
			},
		],
	},

	plugins: [extractCss(), createIndexHtml],
});
