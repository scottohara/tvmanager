module("cache-controller", {
	setup: function() {
		"use strict";

		this.originalAppCache = window.applicationCache;
		window.applicationCache = {
			eventHandler: [],
			assertions: false,
			status: 0,
			swapCache: function() {
				ok(true, "Swap cache");
			},
			addEventListener: function(eventType, handler) {
				this.eventHandler[eventType] = handler;
				if (this.assertions) {
					ok(true, "Add " + eventType + " event listener");
				}
			},
			update: function() {
				ok(true, "Update cache");
			}
		};
		this.cacheController = new CacheController();
	},
	teardown: function() {
		"use strict";

		window.applicationCache = this.originalAppCache;
	}
});

test("constructor", function() {
	"use strict";

	var testParams = [
		{
			eventType: "downloading",
			updated: true,
			message: "Updating application to the latest version...<br/>Please Wait.",
			noticeId: "appCacheUpdateNotice"
		},
		{
			eventType: "progress",
			updated: true,
			message: "Updating application to the latest version...<br/>Downloaded 1/2",
			noticeId: "appCacheUpdateNotice"
		},
		{
			eventType: "updateready",
			updated: true,
			message: "Application has been updated to the latest version. Please restart the application.",
			noticeId: "appCacheUpdateNotice"
		},
		{
			eventType: "updateready",
			status: 1
		},
		{
			eventType: "error",
			updated: false,
			message: "Error reading application cache manifest (status: " + this.cacheController.cacheStatusValues[window.applicationCache.status] + ")",
			noticeId: null
		},
		{
			eventType: "noupdate",
			updated: false,
			message: "You are currently running the latest version. No updates are available at this time.",
			noticeId: null
		}
	];
	expect((testParams.length - 1) * 4 + 2);
	window.applicationCache.assertions = true;
	this.cacheController = new CacheController();
	ok(this.cacheController, "Instantiate CacheController object");

	var i;

	this.cacheController.callback = function(updated, message, noticeId) {
		equals(updated, testParams[i].updated, testParams[i].eventType + " - updated");
		equals(message, testParams[i].message, testParams[i].eventType + " - message");
		equals(noticeId, testParams[i].noticeId, testParams[i].eventType + " - noticeId");
	};

	for (i = 0; i < testParams.length; i++) {
		var originalStatus = window.applicationCache.status;
		if (testParams[i].status) {
			window.applicationCache.status = testParams[i].status;
		}

		window.applicationCache.eventHandler[testParams[i].eventType]({
			loaded: 1,
			total: 2
		});

		window.applicationCache.status = originalStatus;
	}
});

test("update - with application cache", 2, function() {
	"use strict";

	var callback = {};
	this.cacheController.update(callback);
	same(this.cacheController.callback, callback, "Callback");
});

test("update - without application cache", 2, function() {
	"use strict";

	window.applicationCache = null;
	this.cacheController.update(function(updated, message) {
		equals(updated, false, "Updated");
		equals(message, "This browser does not support application caching.", "Message");
	});
});
