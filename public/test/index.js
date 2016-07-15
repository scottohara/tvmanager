/*jshint nomen: false */
/*jslint nomen: false */

require.config({
	baseUrl: "/base",
	enforceDefine: true,

	// Setup paths for any shims that have version numbers in their script names,
	// so that any dependency references don't have the version numbers in them.
	// When updating to a later library version, we only need to update one place.
	paths: {
		"framework/jquery": "framework/jquery-3.1.0.min",
		"framework/jquery-ui": "framework/jquery-ui.min",
		"framework/jshash": "framework/jshash-2.2"
	},

	// Setup shims for all of our 3rd-party framework libraries
	shim: {
		"framework/jquery": {
			exports: "$"
		},
		"framework/jquery-ui": {
			deps: [
				"framework/jquery"
			],
			exports: "$.ui"
		},
		"framework/jquery.iphoneui": {
			deps: [
				"framework/jquery"
			],
			exports: "$.iPhone"
		},
		"framework/jshash/md5-min": {
			exports: "hex_md5"
		},
		"framework/sw/spinningwheel": {
			exports: "SpinningWheel"
		},
		"framework/abc/abc": {
			exports: "Abc"
		},
		"framework/uuid": {
			exports: "uuid"
		}
	},

	map: {
		// For testing, remap all modules to their mock versions by default
		"*": {
			"components/list": "test/mocks/list-mock",
			"components/progressBar": "test/mocks/progressBar-mock",
			"components/window": "test/mocks/window-mock",
			"controllers/application-controller": "test/mocks/application-controller-mock",
			"controllers/cache-controller": "test/mocks/cache-controller-mock",
			"controllers/database-controller": "test/mocks/database-controller-mock",
			"models/episode-model": "test/mocks/episode-model-mock",
			"models/program-model": "test/mocks/program-model-mock",
			"models/series-model": "test/mocks/series-model-mock",
			"models/setting-model": "test/mocks/setting-model-mock",
			"models/sync-model": "test/mocks/sync-model-mock",
			"framework/sw/spinningwheel": "test/mocks/sw-mock",
			"framework/jshash/md5-min": "test/mocks/md5-mock"
		},

		// Override the above mappings for the actual modules test suites to use the real objects
		"test/components/list": {
			"components/list": "components/list"
		},
		"test/components/progressBar": {
			"components/progressBar": "components/progressBar"
		},
		"test/controllers/application-controller": {
			"controllers/application-controller": "controllers/application-controller"
		},
		"test/controllers/cache-controller": {
			"controllers/cache-controller": "controllers/cache-controller"
		},
		"test/controllers/database-controller": {
			"controllers/database-controller": "controllers/database-controller"
		},
		"test/models/episode-model": {
			"models/episode-model": "models/episode-model"
		},
		"test/models/program-model": {
			"models/program-model": "models/program-model"
		},
		"test/models/series-model": {
			"models/series-model": "models/series-model"
		},
		"test/models/setting-model": {
			"models/setting-model": "models/setting-model"
		},
		"test/models/sync-model": {
			"models/sync-model": "models/sync-model"
		}
	},

	deps: [
		"test/components/list",
		"test/components/progressBar",
		"test/components/toucheventproxy",
		"test/models/program-model",
		"test/models/series-model",
		"test/models/episode-model",
		"test/models/setting-model",
		"test/models/sync-model",
		"test/controllers/application-controller",
		"test/controllers/cache-controller",
		"test/controllers/database-controller",
		"test/controllers/dataSync-controller",
		"test/controllers/schedule-controller",
		"test/controllers/unscheduled-controller",
		"test/controllers/programs-controller",
		"test/controllers/program-controller",
		"test/controllers/seriesList-controller",
		"test/controllers/series-controller",
		"test/controllers/episodes-controller",
		"test/controllers/episode-controller",
		"test/controllers/settings-controller",
		"test/controllers/about-controller",
		"test/controllers/report-controller",
		"test/controllers/registration-controller"
	],

	callback: window.__karma__.start
});
