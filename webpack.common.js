const path = require("path"),
			webpack = require("webpack"),
			MiniCssExtractPlugin = require("mini-css-extract-plugin"),
			CleanWebpackPlugin = require("clean-webpack-plugin"),
			HtmlWebpackPlugin = require("html-webpack-plugin"),
			{ GenerateSW } = require("workbox-webpack-plugin"),
			packageJson = require("./package");

const MAX_DATA_AGE_DAYS = 7,

			// Default entry
			entry = {
				app: "index"
			},

			// Default output
			output = {
				path: path.resolve(__dirname, "public")
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
					{
						loader: "css-loader",
						options: {
							// Generate sourcemaps
							sourceMap: true
						}
					}
				]
			},

			// Rule for icon processing
			iconRule = {
				test: /tv-icon-.*\.png$/u,
				loader: "url-loader",
				options: {
					// Use file-loader for anything bigger than 1 byte
					limit: 1,

					// Include a hash in the file name
					name: "[name]-[hash:6].[ext]"
				}
			},

			// Rule for image processing
			imageRule = {
				test: /(?:\.gif|startup-.*\.png)$/u,
				loader: "url-loader",
				options: {
					// Use file-loader for anything bigger than 1 byte
					limit: 1,

					// Include a hash in the file name
					name: "images/[name]-[hash:6].[ext]"
				}
			},

			// Rule for *.html processing
			htmlRule = {
				test: /\.html$/u,
				include: /views/u,
				loader: "html-loader",
				options: {
					minimize: true
				}
			},

			// Cleans the build directory
			cleanBuildDirectory = new CleanWebpackPlugin(["./public"]),

			// Exposes a global jQuery object (for jQuery UI, Touch Punch etc. that expect this global to exist)
			providejQuery = new webpack.ProvidePlugin({
				jQuery: "jquery"
			}),

			// Creates index.html with the bundled resources
			createIndexHtml = new HtmlWebpackPlugin({ template: "./src/index.html" }),

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
						".js"
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
							app: {
								name: "app",
								priority: 10
							},
							cubiq: {
								name: "cubiq",
								test: /[\\/]src[\\/]framework[\\/]/u,
								priority: 20
							},
							vendor: {
								name: "vendor",
								test: /[\\/]node_modules[\\/]/u,
								priority: 30
							}
						}
					},
					runtimeChunk: "single"
				},

				// Abort on first error
				bail: true
			};

function extractCss(hashFilename) {
	return new MiniCssExtractPlugin({ filename: hashFilename ? "[name]-[chunkhash:6].css" : "[name].css" });
}

function defineAppConfig({ maxDataAgeDays } = { maxDataAgeDays: MAX_DATA_AGE_DAYS }) {
	return new webpack.DefinePlugin({ MAX_DATA_AGE_DAYS: maxDataAgeDays });
}

module.exports = {
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
};