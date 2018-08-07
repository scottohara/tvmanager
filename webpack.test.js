const merge = require("webpack-merge"),
			path = require("path"),
			{
				htmlRule,
				providejQuery,
				defineAppConfig,
				config
			} = require("./webpack.common");

module.exports = merge(config, {
	module: {
		rules: [
			{
				test: /\.css$/,
				loader: "ignore-loader"
			},
			htmlRule
		]
	},
	resolve: {
		// For testing, remap all modules to their mock versions by default
		alias: {
			"components/list": "mocks/list-mock",
			"components/progressbar": "mocks/progressbar-mock",
			"components/window": "mocks/window-mock",
			"controllers/application-controller": "mocks/application-controller-mock",
			"models/episode-model": "mocks/episode-model-mock",
			"models/program-model": "mocks/program-model-mock",
			"models/series-model": "mocks/series-model-mock",
			"models/setting-model": "mocks/setting-model-mock",
			"models/sync-model": "mocks/sync-model-mock",
			"services/database-service": "mocks/database-service-mock",
			"framework/spinningwheel": "mocks/spinningwheel-mock",
			md5: "mocks/md5-mock",
			"uuid/v4": "mocks/uuid-mock"
		},
		modules: [
			path.resolve(__dirname, "src"),
			path.resolve(__dirname, "spec/public"),
			path.resolve(__dirname, "node_modules")
		]
	},

	// Remove this when https://github.com/webpack-contrib/karma-webpack/pull/325 is merged
	optimization: {
		splitChunks: false,
		runtimeChunk: false
	},
	devtool: "inline-source-map",
	plugins: [
		providejQuery,
		defineAppConfig()
	]
});