const path = require("path"),
			webpack = require("webpack"),
			ExtractTextPlugin = require("extract-text-webpack-plugin"),
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

			// Ensures all vendor dependencies are bundled separately to app code, and that the webpack manifest is kept
			// separate so that changes to app code don't change the hash of the vendor chunk (or vice versa)
			separateBundles = new webpack.optimize.CommonsChunkPlugin({
				names: [
					"cubiq",
					"vendor",
					"manifest"
				],
				minChunks: Infinity
			}),

			// Creates index.html with the bundled resources
			createIndexHtml = new HtmlWebpackPlugin({template: "./src/index.html"}),

			// Copies view templates to the build directory
			copyViewTemplates = new CopyWebpackPlugin([
				{from: "./src/views", to: "views", ignore: ["*~"]}
			]),

			// Default config
			config = {
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

				// Abort on first error
				bail: true
			};

// Rule for *.css processing
function cssRule(extractor, {minimize, include}) {
	return {
		test: /\.css$/,

		// Include specify paths
		include,

		use: extractor.extract({
			loader: "css-loader",
			options: {
				// Minify using cssnano
				minimize,

				// Generate sourcemaps
				sourceMap: true
			}
		})
	};
}

// Ensure that the environment is set
function defineEnvironment(env) {
	return new webpack.DefinePlugin({"process.env.NODE_ENV": JSON.stringify(`${env}`)});
}

// Creates external *.css files from any imported styles (e.g. import "./my-styles.css";)
// Note: HtmlWebpackPlugin injects <link> tags in the order listed in the plugins array, so vendor must be first
function extractAppCss(hashFilename) {
	return new ExtractTextPlugin({
		filename: hashFilename ? "app-[contenthash:6].css" : "app.css",
		disable: false,
		allChunks: true
	});
}

function extractCubiqCss(hashFilename) {
	return new ExtractTextPlugin({
		filename: hashFilename ? "cubiq-[contenthash:6].css" : "cubiq.css",
		disable: false,
		allChunks: true
	});
}

module.exports = {
	entry,
	output,
	cssRule,
	iconRule,
	imageRule,
	defineEnvironment,
	cleanBuildDirectory,
	providejQuery,
	separateBundles,
	extractAppCss,
	extractCubiqCss,
	createIndexHtml,
	copyViewTemplates,
	config
};