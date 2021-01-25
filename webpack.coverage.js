const config = require("./webpack.test");

// Add instrumentation to *.js files
config.module.rules.push({
	test: /\.(?:t|j)s$/u,
	loader: "istanbul-instrumenter-loader",
	options: {
		esModules: true
	},
	exclude: [
		/node_modules/u
	],
	enforce: "post"
});

module.exports = config;