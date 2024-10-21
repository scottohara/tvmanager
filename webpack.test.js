const webpack = require("webpack"),
	{ merge } = require("webpack-merge"),
	path = require("path"),
	{ htmlRule, defineAppConfig, config } = require("./webpack.common");

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
			/^~\/models\/setting-model$/u,
			"~/mocks/setting-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/models\/sync-model$/u,
			"~/mocks/sync-model-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/services\/database-service$/u,
			"~/mocks/database-service-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/db$/u,
			"~/mocks/db-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/episodes$/u,
			"~/mocks/episodes-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/programs$/u,
			"~/mocks/programs-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/series$/u,
			"~/mocks/series-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/settings$/u,
			"~/mocks/settings-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/syncs$/u,
			"~/mocks/syncs-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^~\/stores\/worker$/u,
			"~/mocks/worker-store-mock",
		),
		new webpack.NormalModuleReplacementPlugin(
			/^comlink$/u,
			"~/mocks/comlink-mock",
		),

		defineAppConfig(),
	],
});
