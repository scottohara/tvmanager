/**
 * @file Index
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

require.config({
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
	}
});

define(
	[
		"controllers/application-controller"
	],
	
	function(ApplicationController) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		// Start the application
		appController.start();
	}
);
