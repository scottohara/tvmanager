define(
	[
		'test/mocks/test-controller',
		'controllers/cache-controller',
		'controllers/database-controller',
		'models/setting-model',
		'controllers/application-controller',
		'test/mocks/application-controller-mock',
		'test/mocks/jQuery-mock',
		'framework/sw/spinningwheel-min',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(TestController, CacheController, DatabaseController, Setting, ApplicationController, ApplicationControllerMock, jQueryMock, SpinningWheel, $, QUnit) {
		"use strict";

		QUnit.module("application-controller", {
			setup: function() {
				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);

				var contentWrapper = $("<div>")
					.attr("id", "contentWrapper")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "content")
					.appendTo(contentWrapper);

				$("<ul>")
					.attr("id", "abc")
					.hide()
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "notices")
					.css("position", "absolute")
					.appendTo(this.sandbox);

				var header = $("<div>")
					.attr("id", "header")
					.appendTo(this.sandbox);

				$("<a>")
					.attr("id", "headerLeftButton")
					.hide()
					.appendTo(header);

				$("<h1>")
					.attr("id", "headerLabel")
					.hide()
					.appendTo(header);

				$("<a>")
					.attr("id", "headerRightButton")
					.hide()
					.appendTo(header);

				var footer = $("<div>")
					.attr("id", "footer")
					.appendTo(this.sandbox);

				$("<a>")
					.attr("id", "footerLeftButton")
					.hide()
					.appendTo(footer);

				$("<footer>")
					.attr("id", "footerLabel")
					.hide()
					.appendTo(footer);

				$("<a>")
					.attr("id", "footerRightButton")
					.hide()
					.appendTo(footer);

				this.appCacheUpdateNoticeId = "appCacheUpdateNotice";
				this.notice = [];
				this.testView = {
					name: "test",
					controller: new TestController({}),
					scrollPos: 1
				};

				this.originalLoadDependencies = ApplicationController.prototype.loadDependencies;
				this.originalShowNotice = ApplicationController.prototype.showNotice;
				this.originalContentShown = ApplicationController.prototype.contentShown;
				this.originalPushView = ApplicationController.prototype.pushView;
				this.originalNoticesMoved = ApplicationController.prototype.noticesMoved;

				var singletonInstance = ApplicationController.prototype.singletonInstance;
				ApplicationController.prototype.singletonInstance = null;
				ApplicationController.prototype.contentShown = ApplicationControllerMock.prototype.contentShown;
				jQueryMock.setDefaultContext(this.sandbox);
				this.appController = new ApplicationController();
				jQueryMock.clearDefaultContext();
				this.appController.loadDependencies = ApplicationControllerMock.prototype.loadDependencies;
				this.appController.showNotice = $.proxy(ApplicationControllerMock.prototype.showNotice, this);
				this.appController.pushView = ApplicationControllerMock.prototype.pushView;
				this.appController.noticesMoved = ApplicationControllerMock.prototype.noticesMoved;
				ApplicationController.prototype.contentShown = this.originalContentShown;
				ApplicationController.prototype.singletonInstance = singletonInstance;

				this.appController.viewStack.push(this.testView);
				this.appController.viewControllers = {
					TestController: TestController
				};
			},
			teardown: function() {
				this.sandbox.remove();
				$.fn.load = jQueryMock.originalLoad;
				$.fn.scrollTop = jQueryMock.originalScrollTop;
				$.fn.position = jQueryMock.originalPosition;
			}
		});

		QUnit.test("constructor", 8, function() {
			QUnit.ok(this.appController, "Instantiate ApplicationController object");
			QUnit.deepEqual(this.appController.viewStack, [this.testView], "viewStack property");
			QUnit.deepEqual(this.appController.noticeStack, {
				height: 0,
				notice: []
			}, "noticeStack property");

			jQueryMock.setDefaultContext(this.sandbox);
			$("#contentWrapper").trigger("webkitTransitionEnd");
			QUnit.equal(SpinningWheel.cellHeight, 45, "SpinningWheel.cellHeight property");
			QUnit.deepEqual(this.appController.abc.element, $("#abc").get(0), "abc.element property");
			QUnit.deepEqual(this.appController.abc.scrollElement, $("#content"), "abc.scrollElement property");
			QUnit.deepEqual(this.appController.abctoucheventproxy.element, this.appController.abc.element, "abctoucheventproxy.element property");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("constructor - cache update", 1, function() {
			CacheController.prototype.updated = true;
			var singletonInstance = ApplicationController.prototype.singletonInstance;
			ApplicationController.prototype.singletonInstance = null;
			ApplicationController.prototype.showNotice = $.proxy(ApplicationControllerMock.prototype.showNotice, this);
			this.appController = new ApplicationController();
			ApplicationController.prototype.showNotice = this.originalShowNotice;
			ApplicationController.prototype.singletonInstance = singletonInstance;
			QUnit.deepEqual(this.notice.pop(), {
				id: this.appCacheUpdateNoticeId,
				label: "Updated",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			}, "Notice");
			CacheController.prototype.updated = false;
		});

		QUnit.test("constructor - cache update progress", 1, function() {
			CacheController.prototype.updated = true;
			$("#" + this.appCacheUpdateNoticeId).remove();
			$("<p>")
				.attr("id", this.appCacheUpdateNoticeId)
				.hide()
				.appendTo(this.sandbox);
			jQueryMock.setDefaultContext(this.sandbox);
			var singletonInstance = ApplicationController.prototype.singletonInstance;
			ApplicationController.prototype.singletonInstance = null;
			this.appController = new ApplicationController();
			this.appController.showNotice = $.proxy(ApplicationControllerMock.prototype.showNotice, this);
			ApplicationController.prototype.singletonInstance = singletonInstance;
			QUnit.equal($("#" + this.appCacheUpdateNoticeId).html(), "Updated", "Notice");
			jQueryMock.clearDefaultContext();
			CacheController.prototype.updated = false;
		});

		QUnit.test("constructor - no singleton", 1, function() {
			var singletonInstance = ApplicationController.prototype.singletonInstance;
			ApplicationController.prototype.singletonInstance = null;
			this.appController = new ApplicationController();
			QUnit.ok(!this.appController.test, "test property");
			ApplicationController.prototype.singletonInstance = singletonInstance;
		});

		QUnit.test("constructor - singleton", 1, function() {
			var singletonInstance = ApplicationController.prototype.singletonInstance;
			var testProperty = "test";
			this.appController = new ApplicationController();
			this.appController.test = testProperty;
			this.appController = new ApplicationController();
			QUnit.equal(this.appController.test, testProperty, "test property");
			ApplicationController.prototype.singletonInstance = singletonInstance;
		});

		QUnit.asyncTest("start - dbConfig 304 Not Modified", 1, function() {
			$.get = jQueryMock.get;
			DatabaseController.mode = "NotModified";
			this.appController.start();
		});

		QUnit.asyncTest("start - fail", 1, function() {
			DatabaseController.mode = "Fail";
			this.expectedNotice = {
				label: "Error",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			};
			this.appController.showNotice = $.proxy(ApplicationControllerMock.prototype.checkNotice, this);
			this.appController.start();
		});

		QUnit.asyncTest("start - database upgrade", 1, function() {
			DatabaseController.mode = "Upgrade";
			this.expectedNotice = {
				label: "Database has been successfully upgraded from version 1.0 to version 1.1. Please restart the application.",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			};
			this.appController.showNotice = $.proxy(ApplicationControllerMock.prototype.checkNotice, this);
			Setting.setting.LastSyncTime = new Date();
			this.appController.start();
		});

		QUnit.asyncTest("start - sync warning", 2, function() {
			this.expectedNotice = {
				label: "The last data sync was over 7 days ago",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			};
			this.appController.showNotice = $.proxy(ApplicationControllerMock.prototype.checkNotice, this);
			Setting.setting.LastSyncTime = new Date(1900, 0, 1);
			this.appController.start();
		});

		QUnit.asyncTest("loadDependencies", 1, function() {
			this.appController.loadDependencies = this.originalLoadDependencies;
			var callback = function() {
				QUnit.ok(true, "Dependencies loaded");
				QUnit.start();
			};
			this.appController.loadDependencies([], callback);
		});

		QUnit.test("gotAppConfig - 304 Not Modified", 1, function() {
			var appVersion = "1.0";
			this.appController.gotAppConfig(undefined, "notmodified", { responseText: JSON.stringify({ "appVersion": appVersion }) });
			QUnit.equal(this.appController.appVersion, appVersion, "appVersion property");
		});

		QUnit.asyncTest("pushView", 3, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			TestController.sandbox = this.sandbox;
			$("#content").children(":first").scrollTop(1);
			this.appController.pushView = this.originalPushView;
			this.appController.contentShown = this.originalContentShown;
			this.appController.pushView("test", {});
			QUnit.equal(this.appController.viewStack[0].scrollPos, $("#content").children(":first").scrollTop(), "Previous scroll position");
			this.testView.scrollPos = 0;
			QUnit.deepEqual(this.appController.viewStack[1], this.testView, "viewStack property");
			jQueryMock.clearDefaultContext();
		});

		QUnit.asyncTest("pushView - 304 Not Modified", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			TestController.sandbox = this.sandbox;
			$.fn.load = jQueryMock.load;
			this.appController.pushView = this.originalPushView;
			this.appController.contentShown = this.originalContentShown;
			this.appController.pushView("test", {});
			jQueryMock.clearDefaultContext();
		});

		QUnit.asyncTest("popView", 3, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			TestController.sandbox = this.sandbox;
			this.appController.viewStack.push(this.testView);
			this.appController.contentShown = this.originalContentShown;
			this.appController.popView("Activated");
			QUnit.deepEqual(this.appController.viewStack, [this.testView], "viewStack property");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("setScrollPosition", function() {
			$.fn.scrollTop = jQueryMock.scrollTop;
			$.fn.position = jQueryMock.position;

			var testParams = [
				{
					description: "scroll to position",
					scrollPos: 1,
					expectedPos: 1
				},
				{
					description: "scroll to end",
					scrollPos: -1,
					expectedPos: jQueryMock.position().top
				}
			];

			var i;
			
			QUnit.expect(testParams.length);
			jQueryMock.setDefaultContext(this.sandbox);
			for (i = 0; i < testParams.length; i++) {
				this.appController.viewStack[0].scrollPos = testParams[i].scrollPos;
				this.appController.setScrollPosition();
				QUnit.equal($("#content").children(":first").scrollTop(), testParams[i].expectedPos, testParams[i].description);
			}
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("contentShown - loading", 3, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			$("#contentWrapper").addClass("loading");
			this.appController.contentShown = this.originalContentShown;
			this.appController.contentShown();
			QUnit.ok(!$("#contentWrapper").hasClass("loading"), "Unmark contentWrapper as loading");
			QUnit.ok($("#contentWrapper").hasClass("loaded"), "Mark contentWrapper as loaded");
			QUnit.ok(!$("#nowLoading").hasClass("loading"), "Hide Now Loading... message");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("contentShown - loaded", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			$("#contentWrapper").addClass("loaded");
			this.appController.contentShown = this.originalContentShown;
			this.appController.contentShown();
			QUnit.ok(!$("#contentWrapper").hasClass("loaded"), "Unmark contentWrapper as loaded");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("setHeader", 10, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.setHeader();
			$("#headerLeftButton").trigger("click", "left");
			QUnit.ok($("#headerLeftButton").hasClass(this.testView.controller.header.leftButton.style), "Set left button style");
			QUnit.equal($("#headerLeftButton").text(), this.testView.controller.header.leftButton.label, "Left button label");
			QUnit.notEqual($("#headerLeftButton").css("display"), "none", "Show left button");
			QUnit.equal($("#headerLabel").text(), this.testView.controller.header.label, "Header label");
			QUnit.notEqual($("#headerLabel").css("display"), "none", "Show header label");
			$("#headerRightButton").trigger("click", "right");
			QUnit.ok($("#headerRightButton").hasClass(this.testView.controller.header.rightButton.style), "Set right button style");
			QUnit.equal($("#headerRightButton").text(), this.testView.controller.header.rightButton.label, "Right button label");
			QUnit.notEqual($("#headerRightButton").css("display"), "none", "Show right button");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("clearHeader", 3, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.clearHeader();
			$("#headerLeftButton").trigger("click", "left");
			$("#headerRightButton").trigger("click", "right");
			QUnit.equal($("#headerLeftButton").css("display"), "none", "Hide left button");
			QUnit.equal($("#headerLabel").css("display"), "none", "Hide header label");
			QUnit.equal($("#headerRightButton").css("display"), "none", "Hide right button");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("setFooter", 10, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.setFooter();
			$("#footerLeftButton").trigger("click", "left");
			QUnit.ok($("#footerLeftButton").hasClass(this.testView.controller.footer.leftButton.style), "Set left button style");
			QUnit.equal($("#footerLeftButton").text(), this.testView.controller.footer.leftButton.label, "Left button label");
			QUnit.notEqual($("#footerLeftButton").css("display"), "none", "Show left button");
			QUnit.equal($("#footerLabel").text(), this.testView.controller.footer.label, "Footer label");
			QUnit.notEqual($("#footerLabel").css("display"), "none", "Show footer label");
			$("#footerRightButton").trigger("click", "right");
			QUnit.ok($("#footerRightButton").hasClass(this.testView.controller.footer.rightButton.style), "Set right button style");
			QUnit.equal($("#footerRightButton").text(), this.testView.controller.footer.rightButton.label, "Right button label");
			QUnit.notEqual($("#footerRightButton").css("display"), "none", "Show right button");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("clearFooter", 4, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.clearFooter();
			$("#footerLeftButton").trigger("click", "left");
			$("#footerRightButton").trigger("click", "right");
			QUnit.equal($("#footerLeftButton").css("display"), "none", "Hide left button");
			QUnit.equal($("#footerLabel").val(), "", "Footer label");
			QUnit.equal($("#footerLabel").css("display"), "none", "Hide footer label");
			QUnit.equal($("#footerRightButton").css("display"), "none", "Hide right button");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("setContentHeight", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			$("<ul>").appendTo($("#content"));
			$("#header").outerHeight(1);
			$("#footer").outerHeight(1);
			window.innerHeight = 3;
			this.appController.setContentHeight();
			QUnit.equal($("#content").children(":first").height(), 1, "Content height");
			jQueryMock.clearDefaultContext();
		});

		QUnit.asyncTest("showNotice", 14, function() {
			var buttonClicked = function(e, button) {
				QUnit.ok(true, "Bind " + button + " button " + e.type + " event listener");
			};

			var notice = {
				id: "test-notice",
				label: "<b>test-notice</b>",
				leftButton: {
					eventHandler: buttonClicked,
					style: "left-button-style",
					label: "left-button"
				},
				rightButton: {
					eventHandler: buttonClicked,
					style: "right-button-style",
					label: "right-button"
				}
			};

			this.appController.showNotice = this.originalShowNotice;
			this.appController.hideNotice = function(noticeContainer) {
				QUnit.ok(noticeContainer.hasClass("notice"), "Bind hideNotice event listener");
			};
			window.innerHeight = 1;

			var originalAnimate = $.fn.animate;
			$.fn.animate = $.proxy(function(args, callback) {
				$.fn.animate = originalAnimate;

				var leftButton = $("#notices div a." + notice.leftButton.style);
				QUnit.ok(leftButton.hasClass(notice.leftButton.style), "Set left button style");
				QUnit.equal(leftButton.text(), notice.leftButton.label, "Left button label");

				QUnit.equal($("#test-notice").html(), notice.label, "Notice label");

				var rightButton = $("#notices div a." + notice.rightButton.style);
				QUnit.ok(rightButton.hasClass(notice.rightButton.style), "Set right button style");
				QUnit.equal(rightButton.text(), notice.rightButton.label, "Right button label");

				QUnit.equal($("#notices").css("visibility"), "visible", "Notices visibility");
				QUnit.equal($("#notices").css("top"), 1 + window.pageYOffset + "px", "Notices position");

				var noticeContainer = $("#notices div");
				QUnit.equal(this.appController.noticeStack.height, -noticeContainer.height(), "noticeStack height");
				QUnit.equal(this.appController.noticeStack.notice[0].html(), noticeContainer.html(), "Notice");

				$("#notices div a." + notice.rightButton.style).trigger("click", "right");
				$("#notices div a." + notice.leftButton.style).trigger("click", "left");
				
				QUnit.deepEqual(args, { top: $(window).height() + this.appController.noticeStack.height }, "Animate arguments");
				callback();
				jQueryMock.clearDefaultContext();
			}, this);

			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.showNotice(notice);
		});

		QUnit.asyncTest("hideNotice", 5, function() {
			var notice = {
				height: function() {
					return 1;
				},
				data: function(key, value) {
					QUnit.equal(key, "acknowledged", "Notice data key");
					QUnit.equal(value, true, "Notice data value");
				},
				animate: function(args, callback) {
					QUnit.deepEqual(args, { height: 0 }, "Animate arguments");
					callback();
				}
			};

			this.appController.noticeHidden = $.proxy(function() {
				QUnit.equal(this.appController.noticeStack.height, 1, "noticeStack height");
				QUnit.ok(true, "Shrink notice");
				QUnit.start();
			}, this);

			this.appController.hideNotice(notice);
		});

		QUnit.asyncTest("noticeHidden", 2, function() {
			var originalAnimate = $.fn.animate;
			$.fn.animate = $.proxy(function(args, callback) {
				$.fn.animate = originalAnimate;
				QUnit.deepEqual(args, { top: "-=" + this.appController.noticeStack.height }, "Animate arguments");
				callback();
			}, this);
			
			this.appController.noticeHidden();
		});

		QUnit.test("noticesMoved", 4, function() {
			var notice1 = $("<div>")
				.attr("id", "test-notice-1")
				.data("acknowledged", true)
				.appendTo(this.sandbox);

			var notice2 = $("<div>")
				.attr("id", "test-notice-2")
				.data("acknowleged", false)
				.appendTo(this.sandbox);

			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.noticeStack.notice.push(notice1);
			this.appController.noticeStack.notice.push(notice2);
			this.appController.noticesMoved = this.originalNoticesMoved;
			this.appController.noticesMoved();
			QUnit.equal(this.appController.noticeStack.notice[0].attr("id"), notice2.attr("id"), "Notice ID");
			QUnit.equal($("#notices").css("visibility"), "visible", "Notices visibility");
			this.appController.noticeStack.notice[0].data("acknowledged", true);
			this.appController.noticesMoved();
			QUnit.equal(this.appController.noticeStack.notice.length, 0, "noticeStack.notice length");
			QUnit.equal($("#notices").css("visibility"), "hidden", "Notices visibility");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("showScrollHelper", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.showScrollHelper();
			QUnit.notEqual($("#abc").css("display"), "none", "Show scroll helper");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("hideScrollHelper", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.appController.hideScrollHelper();
			QUnit.equal($("#abc").css("display"), "none", "Hide scroll helper");
			jQueryMock.clearDefaultContext();
		});
	}
);
