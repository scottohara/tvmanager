const path = require("path"),
	{ merge } = require("webpack-merge"),
	{ GenerateSW } = require("workbox-webpack-plugin"),
	packageJson = require("./package"),
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
	mode: "production",

	// Use default output with chunk hash in file names
	output: {
		path: path.resolve(__dirname, "public"),
		hashDigestLength: 6,
		filename: "[name]-[chunkhash].js",
		assetModuleFilename: "[name]-[contenthash][ext]",
		clean: true,
	},

	module: {
		rules: [
			cssRule,
			iconRule,
			merge(imageRule, {
				generator: {
					// Include hash in file names
					filename: "images/[name]-[contenthash][ext]",
				},
			}),
			htmlRule,
			webmanifestRule,
		],
	},

	// Extract full, separate source maps
	devtool: "source-map",

	plugins: [
		extractCss({ filename: "[name]-[chunkhash].css" }),
		createIndexHtml,
		new GenerateSW({
			cacheId: packageJson.name,
			skipWaiting: true,
			clientsClaim: true,
		}),
	],

	// Fail if any chunks exceed performance budget
	performance: {
		hints: "error",
	},
});
