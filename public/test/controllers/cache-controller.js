define(
	[
		'controllers/cache-controller',
		'test/framework/qunit',
		'test/mocks/window-mock'
	],

	function(CacheController, QUnit, window) {
		"use strict";
	
		QUnit.module("cache-controller", {
			setup: function() {
				window.applicationCache.assertions = false;
				this.cacheController = new CacheController();
			}
		});

		QUnit.test("constructor", function() {
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
			QUnit.expect((testParams.length - 1) * 4 + 2);
			window.applicationCache.assertions = true;
			this.cacheController = new CacheController();
			QUnit.ok(this.cacheController, "Instantiate CacheController object");

			var i;

			this.cacheController.callback = function(updated, message, noticeId) {
				QUnit.equal(updated, testParams[i].updated, testParams[i].eventType + " - updated");
				QUnit.equal(message, testParams[i].message, testParams[i].eventType + " - message");
				QUnit.equal(noticeId, testParams[i].noticeId, testParams[i].eventType + " - noticeId");
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

		QUnit.test("update - with application cache", 2, function() {
			var callback = {};
			this.cacheController.update(callback);
			QUnit.deepEqual(this.cacheController.callback, callback, "Callback");
		});

		QUnit.test("update - without application cache", 2, function() {
			var originalApplicationCache = window.applicationCache;
			window.applicationCache = null;
			this.cacheController.update(function(updated, message) {
				QUnit.equal(updated, false, "Updated");
				QUnit.equal(message, "This browser does not support application caching.", "Message");
			});
			window.applicationCache = originalApplicationCache;
		});
	}
);
