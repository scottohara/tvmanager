const config = require("./webpack.test");

// Add instrumentation to *.js files
config.module.rules.push({
	test: /\.(t|j)s$/,
	loader: "istanbul-instrumenter-loader",
	options: {
		esModules: true
	},
	exclude: [
		/node_modules/,
		/src\/framework/
	],
	enforce: "post"
});

module.exports = config;