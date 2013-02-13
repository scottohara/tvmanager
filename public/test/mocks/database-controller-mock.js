define(
	[
		'test/mocks/jQuery-mock',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(jQueryMock, $, QUnit) {
		"use strict";

		var DatabaseControllerMock = function(databaseName, callback, errorCallback) {
			var mode = DatabaseControllerMock.mode;
			DatabaseControllerMock.mode = null;

			switch (mode) {
				case "NotModified":
					$.get = jQueryMock.originalGet;
					QUnit.equal(databaseName, "TVManager", "databaseName property");
					QUnit.start();
					break;

				case "Fail":
					errorCallback({message: "Error"});
					return {};

				case "Upgrade":
					callback({initial: "1.0", current: "1.1"});
					return { version: "1.1" };

				default:
					callback({initial: "1.1", current: "1.1"});
					return { version: "1.1" };
			}
		};

		DatabaseControllerMock.mode = null;

		return DatabaseControllerMock;
	}
);
