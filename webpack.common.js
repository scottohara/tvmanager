const path = require("path"),
			webpack = require("webpack"),
			MiniCssExtractPlugin = require("mini-css-extract-plugin"),
			HtmlWebpackPlugin = require("html-webpack-plugin"),
			{ GenerateSW } = require("workbox-webpack-plugin"),
			packageJson = require("./package");

const MAX_DATA_AGE_DAYS = 7,

			// Default output
			output = {
				path: path.resolve(__dirname, "public"),
				assetModuleFilename: "[name][ext]",
				clean: true
			},

			// Rule for *.ts processing
			tsRule = {
				test: /\.ts$/u,
				loader: "ts-loader"
			},

			// Rule for *.css processing
			cssRule = {
				test: /\.css$/u,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader"
				]
			},

			// Rule for icon processing
			iconRule = {
				test: /tv-icon-.*\.png$/u,
				type: "asset/resource"
			},

			// Rule for image processing
			imageRule = {
				test: /(?:\.svg|startup-.*\.png)$/u,
				type: "asset/resource",
				generator: {
					filename: "images/[name][ext]"
				}
			},

			// Rule for *.html processing
			htmlRule = {
				test: /\.html$/u,
				include: /views/u,
				loader: "html-loader"
			},

			// Exposes a global jQuery object (for jQuery UI, Touch Punch etc. that expect this global to exist)
			providejQuery = new webpack.ProvidePlugin({
				jQuery: "jquery"
			}),

			// Creates index.html with the bundled resources
			createIndexHtml = new HtmlWebpackPlugin(),

			// Generate a service worker to precache static assets
			generateServiceWorker = new GenerateSW({
				cacheId: packageJson.name,
				skipWaiting: true,
				clientsClaim: true
			}),

			// Default config
			config = {
				mode: "development",

				// Ensure that the context is the directory where the webpack.*.js config file is
				context: path.resolve(__dirname),

				// Default rules for all environments
				module: {
					rules: [
						tsRule
					]
				},

				// Default resolve paths
				resolve: {
					extensions: [
						".ts",
						"..."
					],
					modules: [
						path.resolve(__dirname, "src"),
						path.resolve(__dirname, "node_modules")
					]
				},

				optimization: {
					splitChunks: {
						chunks: "all",
						minSize: 0,
						cacheGroups: {
							defaultVendors: {
								name: "vendor",
								test: /[\\/]node_modules[\\/]/u
							}
						}
					},
					runtimeChunk: "single"
				},

				// Abort on first error
				bail: true
			};

function extractCss(options = undefined) {
	return new MiniCssExtractPlugin(options);
}

function defineAppConfig({ maxDataAgeDays } = { maxDataAgeDays: MAX_DATA_AGE_DAYS }) {
	return new webpack.DefinePlugin({ MAX_DATA_AGE_DAYS: maxDataAgeDays });
}

module.exports = {
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
};