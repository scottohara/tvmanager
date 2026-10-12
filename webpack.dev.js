const { merge } = require("webpack-merge"),
	{ defineConfig } = require("webpack"),
	{
		cssRule,
		iconRule,
		imageRule,
		htmlRule,
		webmanifestRule,
		createIndexHtml,
		extractCss,
		config,
	} = require("./webpack.common");

module.exports = merge(
	config,
	defineConfig({
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

		plugins: [extractCss, createIndexHtml],
	}),
);
