const path = require("path"),
			webpack = require("webpack"),
			MiniCssExtractPlugin = require("mini-css-extract-plugin"),
			CleanWebpackPlugin = require("clean-webpack-plugin"),
			HtmlWebpackPlugin = require("html-webpack-plugin"),
			CopyWebpackPlugin = require("copy-webpack-plugin"),

			// Default entry
			entry = {
				app: "index",
				cubiq: [
					"framework/abc/abc",
					"framework/sw/spinningwheel"
				],
				vendor: [
					"jquery",
					"jquery-ui/ui/widgets/sortable",
					"jquery-ui-touch-punch",
					"md5",
					"uuid"
				]
			},

			// Default output
			output = {
				path: path.resolve(__dirname, "public")
			},

			// Rule for icon processing
			iconRule = {
				test: /tv-icon-.*\.png$/,
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
				test: /(\.gif|startup-.*\.png)$/,
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
				test: /\.html$/,
				include: /views/,
				loader: "html-loader"
			},

			// Cleans the build directory
			cleanBuildDirectory = new CleanWebpackPlugin(["./public"]),

			// Exposes a global jQuery object (for jQuery UI, Touch Punch etc. that expect this global to exist)
			providejQuery = new webpack.ProvidePlugin({
				jQuery: "jquery"
			}),

			// Creates index.html with the bundled resources
			createIndexHtml = new HtmlWebpackPlugin({template: "./src/index.html"}),

			// Copies view templates to the build directory
			copyViewTemplates = new CopyWebpackPlugin([
				{from: "./src/views", to: "views", ignore: ["*~"]}
			]),

			// Default config
			config = {
				mode: "development",

				// Ensure that the context is the directory where the webpack.*.js config file is
				context: path.resolve(__dirname),

				// Default rules for all environments
				module: {
					rules: [htmlRule]
				},

				// Default resolve paths
				resolve: {
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
								priority: 10,
								reuseExistingChunk: true
							},
							cubiq: {
								name: "cubiq",
								test: /[\\/]src[\\/]framework[\\/]/,
								priority: 20,
								reuseExistingChunk: true
							},
							vendor: {
								name: "vendor",
								test: /[\\/]node_modules[\\/]/,
								priority: 30,
								reuseExistingChunk: true
							}
						}
					},
					runtimeChunk: "single"
				},

				// Abort on first error
				bail: true
			};

// Rule for *.css processing
function cssRule({minimize} = {}) {
	return {
		test: /\.css$/,
		use: [
			MiniCssExtractPlugin.loader,
			{
				loader: "css-loader",
				options: {
					// Minify using cssnano
					minimize,

					// Generate sourcemaps
					sourceMap: true
				}
			}
		]
	};
}

function extractCss(hashFilename) {
	return new MiniCssExtractPlugin({filename: hashFilename ? "[name]-[chunkhash:6].css" : "[name].css"});
}

module.exports = {
	entry,
	output,
	cssRule,
	iconRule,
	imageRule,
	cleanBuildDirectory,
	providejQuery,
	extractCss,
	createIndexHtml,
	copyViewTemplates,
	config
};