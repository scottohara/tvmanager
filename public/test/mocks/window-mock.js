define(
	function() {
		"use strict";

		var WindowMock = function() {
			this.navigator = {
				onLine: true
			};

			this.applicationCache = {
				eventHandler: [],
				assertions: false,
				status: 0,
				swapCache: function() {
					QUnit.ok(true, "Swap cache");
				},
				addEventListener: function(eventType, handler) {
					this.eventHandler[eventType] = handler;
					if (this.assertions) {
						QUnit.ok(true, "Add " + eventType + " event listener");
					}
				},
				update: function() {
					QUnit.ok(true, "Update cache");
				}
			};
		};

		return new WindowMock();
	}
);
