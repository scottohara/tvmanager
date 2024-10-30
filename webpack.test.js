const webpack = require("webpack"),
	{ merge } = require("webpack-merge"),
	path = require("path"),
	{ htmlRule, config } = require("./webpack.common");

module.exports = merge(config, {
	module: {
		rules: [
			{
				test: /\.css$/u,
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
			/^~\/components\/list$/u,
			"~/mocks/list-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/components\/progressbar$/u,
			"~/mocks/progressbar-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/components\/window$/u,
			"~/mocks/window-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/~\/controllers\/application-controller/u,
			"~/mocks/application-controller-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/episode-model$/u,
			"~/mocks/episode-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/program-model$/u,
			"~/mocks/program-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/series-model$/u,
			"~/mocks/series-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/services\/api-service$/u,
			"~/mocks/api-service-mock",
		),
	],
});
