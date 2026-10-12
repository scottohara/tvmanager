const {
		defineConfig,
		NormalModuleReplacementPlugin,
		ProvidePlugin,
	} = require("webpack"),
	{ merge } = require("webpack-merge"),
	{ htmlRule, config } = require("./webpack.common");

module.exports = merge(
	config,
	defineConfig({
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
			tsconfig: true,
			fallback: {
				"process/browser": require.resolve("process/browser.js"),
			},
		},
		devtool: "inline-source-map",
		plugins: [
			new ProvidePlugin({
				process: "process/browser",
			}),

			// For testing, remap all modules to their mock versions by default
			new NormalModuleReplacementPlugin(
				/^~\/components\/list$/v,
				"~/mocks/list-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/components\/progressbar$/v,
				"~/mocks/progressbar-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/components\/window$/v,
				"~/mocks/window-mock",
			),
			new NormalModuleReplacementPlugin(
				/~\/controllers\/application-controller/v,
				"~/mocks/application-controller-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/models\/episode-model$/v,
				"~/mocks/episode-model-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/models\/program-model$/v,
				"~/mocks/program-model-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/models\/series-model$/v,
				"~/mocks/series-model-mock",
			),
			new NormalModuleReplacementPlugin(
				/^~\/services\/api-service$/v,
				"~/mocks/api-service-mock",
			),
		],
	}),
);
