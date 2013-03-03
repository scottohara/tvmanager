define(
	[
		'test/mocks/database-mock',
		'test/mocks/cache-controller-mock',
		'models/setting-model',
		'test/framework/qunit'
	],

	function(DatabaseMock, CacheControllerMock, Setting, QUnit) {
		"use strict";

		var ApplicationControllerMock = function() {
			// App controller is a singleton, so if an instance already exists, return it
			if (ApplicationControllerMock.prototype.singletonInstance) {
				return ApplicationControllerMock.prototype.singletonInstance;
			}

			// No existing instance, so make this instance the singleton
			ApplicationControllerMock.prototype.singletonInstance = this;

			this.db = new DatabaseMock();
			this.cache = new CacheControllerMock();
			this.notice = [];
			this.appVersion = "v1.0";
		};

		ApplicationControllerMock.prototype.loadDependencies = function(dependencies, callback) {
			callback(Setting);
		};

		ApplicationControllerMock.prototype.getScrollPosition = function() {
		};

		ApplicationControllerMock.prototype.setScrollPosition = function() {
			QUnit.ok(true, "Set scroll position");
		};

		ApplicationControllerMock.prototype.pushView = function(view, args) {
			this.viewArgs = args;
			QUnit.ok(true, "Push " + view + " view");
		};

		ApplicationControllerMock.prototype.popView = function() {
			QUnit.ok(true, "Pop view");
		};

		ApplicationControllerMock.prototype.showNotice = function(notice) {
			this.notice.push(notice);
		};

		ApplicationControllerMock.prototype.checkNotice = function(notice) {
			QUnit.deepEqual(notice, this.expectedNotice, "Notice");
			QUnit.start();
		};

		ApplicationControllerMock.prototype.contentShown = function(e) {
			QUnit.ok(true, "Bind " + e.type + " event listener");
		};

		ApplicationControllerMock.prototype.noticesMoved = function(e) {
			QUnit.ok(true, "Slide notices");
			QUnit.start();
		};

		ApplicationControllerMock.prototype.clearFooter = function() {
		};

		ApplicationControllerMock.prototype.setFooter = function() {
		};

		ApplicationControllerMock.prototype.showScrollHelper = function() {
		};

		ApplicationControllerMock.prototype.hideScrollHelper = function() {
		};

		return ApplicationControllerMock;
	}
);
