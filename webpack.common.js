const path = require("path"),
	MiniCssExtractPlugin = require("mini-css-extract-plugin"),
	HtmlWebpackPlugin = require("html-webpack-plugin");

// Rule for *.ts processing
const tsRule = {
		test: /\.ts$/v,
		loader: "ts-loader",
	},
	// Rule for *.css processing
	cssRule = {
		test: /\.css$/v,
		use: [MiniCssExtractPlugin.loader, "css-loader"],
	},
	// Rule for icon processing
	iconRule = {
		test: /tv-icon-.*\.png$/v,
		type: "asset/resource",
	},
	// Rule for image processing
	imageRule = {
		test: /(?:\.svg|apple-splash-.*\.png)$/v,
		type: "asset/resource",
		generator: {
			filename: "images/[name][ext]",
		},
	},
	// Rule for *.html processing
	htmlRule = {
		test: /\.html$/v,
		include: /views/v,
		loader: "html-loader",
	},
	// Rule for *.webmanifest processing
	webmanifestRule = {
		test: /\.webmanifest$/v,
		loader: "webpack-webmanifest-loader",
		type: "asset/resource",
	},
	// Creates index.html with the bundled resources
	createIndexHtml = new HtmlWebpackPlugin(),
	// Default config
	config = {
		mode: "development",

		// Ensure that the context is the directory where the webpack.*.js config file is
		context: path.resolve(__dirname),

		// Default rules for all environments
		module: {
			rules: [tsRule],
		},

		// Default resolve paths
		resolve: {
			alias: {
				"~": path.resolve(__dirname, "src"),
			},
			extensions: [".ts", "..."],
		},

		optimization: {
			splitChunks: {
				chunks: "all",
				minSize: 0,
				cacheGroups: {
					defaultVendors: {
						name: "vendor",
						test: /\/node_modules\//v,
					},
				},
			},
			runtimeChunk: "single",
		},

		// Abort on first error
		bail: true,
	};

function extractCss(options = undefined) {
	return new MiniCssExtractPlugin(options);
}

module.exports = {
	cssRule,
	iconRule,
	imageRule,
	htmlRule,
	webmanifestRule,
	extractCss,
	createIndexHtml,
	config,
};
