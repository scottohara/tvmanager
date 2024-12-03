const webpack = require("webpack"),
	{ merge } = require("webpack-merge"),
	path = require("path"),
	{ htmlRule, config } = require("./webpack.common");

module.exports = merge(config, {
	module: {
		rules: [
			{
				test: /\.css$/v,
				loader: "ignore-loader",
			},
			htmlRule,
		],
	},
	resolve: {
		alias: {
			"~": [path.resolve(__dirname, "src")],
		},
		fallback: {
			"process/browser": require.resolve("process/browser.js"),
		},
	},
	devtool: "inline-source-map",
	plugins: [
		new webpack.ProvidePlugin({
			process: "process/browser",
		}),

		// For testing, remap all modules to their mock versions by default
		new webpack.NormalModuleReplacementPlugin(
			/^~\/components\/list$/v,
			"~/mocks/list-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/components\/progressbar$/v,
			"~/mocks/progressbar-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/components\/window$/v,
			"~/mocks/window-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/~\/controllers\/application-controller/v,
			"~/mocks/application-controller-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/episode-model$/v,
			"~/mocks/episode-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/program-model$/v,
			"~/mocks/program-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/series-model$/v,
			"~/mocks/series-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/services\/api-service$/v,
			"~/mocks/api-service-mock",
		),
	],
});
