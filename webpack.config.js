const path = require("path"),
			webpack = require("webpack"),
			CleanWebpackPlugin = require("clean-webpack-plugin"),
			CopyWebpackPlugin = require("copy-webpack-plugin"),
			ExtractTextPlugin = require("extract-text-webpack-plugin"),
			HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	entry: {
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
	output: {
		filename: "[name]-[chunkhash:6].js",
		path: "./public"
	},
	resolve: {
		modules: [
			path.resolve("./src"),
			path.resolve("./node_modules")
		]
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				exclude: /node_modules/,
				loader: ExtractTextPlugin.extract({
					loader: "css-loader?sourceMap"
				})
			},
			{
				test: /tv-icon-.*\.png$/,
				exclude: /node_modules/,
				loader: "url-loader?limit=1&name=[name]-[hash:6].[ext]"
			},
			{
				test: /(\.gif|startup-.*\.png)$/,
				exclude: /node_modules/,
				loader: "url-loader?limit=1&name=images/[name]-[hash:6].[ext]"
			},
			{
				test: /\.html$/,
				exclude: /node_modules/,
				loader: "html-loader?interpolate"
			}
		]
	},
	devtool: "source-map",
	plugins: [
		// Cleans the build directory
		new CleanWebpackPlugin(["./public"]),

		// Exposes a global jQuery object (for jQuery UI, Touch Punch etc. that expect this global to exist)
		new webpack.ProvidePlugin({
			jQuery: "jquery"
		}),

		// Ensures all vendor dependencies are bundled separately to app code, and that the webpack manifest is kept
		// separate so that changes to app code don't change the hash of the vendor chunk (or vice versa)
		new webpack.optimize.CommonsChunkPlugin({
			names: [
				"cubiq",
				"vendor",
				"manifest"
			],
			minChunks: Infinity
		}),

		// Creates an external *.css file from any imported CSS (e.g. import "./my-styles.css";)
		new ExtractTextPlugin({
			filename: "app-[contenthash:6].css",
			disable: false,
			allChunks: true
		}),

		// Creates index.html with the bundled resources
		new HtmlWebpackPlugin({
			template: "./src/index.html"
		}),

		// Copies views to the build directory
		new CopyWebpackPlugin([
			{from: "./src/views", to: "views", ignore: ["*~"]}
		])
	]
};