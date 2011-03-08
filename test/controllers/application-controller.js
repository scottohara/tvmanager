module("application-controller", {
	setup: function() {
		this.contentWrapper = $("<div>")
			.attr("id", "contentWrapper")
			.hide()
			.appendTo(document.body);

		this.content = $("<div>")
			.attr("id", "content")
			.hide()
			.appendTo(this.contentWrapper);

		this.abc = $("<ul>")
			.attr("id", "abc")
			.css("visibility", "hidden")
			.appendTo(document.body);

		this.notices = $("<div>")
			.attr("id", "notices")
			.css("position", "absolute")
			.hide()
			.appendTo(document.body);

		this.header = $("<div>")
			.attr("id", "header")
			.css("visibility", "hidden")
			.appendTo(document.body);

		this.headerLeftButton = $("<a>")
			.attr("id", "headerLeftButton")
			.hide()
			.appendTo(this.header);

		this.headerLabel = $("<h1>")
			.attr("id", "headerLabel")
			.hide()
			.appendTo(this.header);

		this.headerRightButton = $("<a>")
			.attr("id", "headerRightButton")
			.hide()
			.appendTo(this.header);

		this.footer = $("<div>")
			.attr("id", "footer")
			.css("visibility", "hidden")
			.appendTo(document.body);

		this.footerLeftButton = $("<a>")
			.attr("id", "footerLeftButton")
			.hide()
			.appendTo(this.footer);

		this.footerLabel = $("<footer>")
			.attr("id", "footerLabel")
			.hide()
			.appendTo(this.footer);

		this.footerRightButton = $("<a>")
			.attr("id", "footerRightButton")
			.hide()
			.appendTo(this.footer);

		this.appCacheUpdateNoticeId = "appCacheUpdateNotice";
		this.notice = [];
		this.testView = {
			name: "test",
			controller: new TestController({}),
			scrollPos: 1
		};

		this.originalCacheController = CacheController;
		CacheController = CacheControllerMock;

		this.originalDatabaseController = DatabaseController;
		DatabaseController = DatabaseControllerMock;

		this.originalSetting = Setting;
		Setting = SettingMock;

		this.originalShowNotice = ApplicationController.prototype.showNotice;
		ApplicationController.prototype.showNotice = $.proxy(ApplicationControllerMock.prototype.showNotice, this);

		this.originalContentShown = ApplicationController.prototype.contentShown;
		ApplicationController.prototype.contentShown = ApplicationControllerMock.prototype.contentShown;

		this.originalPushView = ApplicationController.prototype.pushView;
		ApplicationController.prototype.pushView = ApplicationControllerMock.prototype.pushView;

		this.originalNoticesMoved = ApplicationController.prototype.noticesMoved;
		ApplicationController.prototype.noticesMoved = ApplicationControllerMock.prototype.noticesMoved;

		this.appController = new ApplicationController();
		this.appController.viewStack.push(this.testView);
	},
	teardown: function() {
		this.contentWrapper.remove();
		this.abc.remove();
		this.notices.remove();
		this.header.remove();
		this.footer.remove();
		CacheController = this.originalCacheController;
		DatabaseController = this.originalDatabaseController;
		Setting = this.originalSetting;
		ApplicationController.prototype.showNotice = this.originalShowNotice;
		ApplicationController.prototype.contentShown = this.originalContentShown;
		ApplicationController.prototype.pushView = this.originalPushView;
		ApplicationController.prototype.noticesMoved = this.originalNoticesMoved;
		$.fn.load = jQueryMock.originalLoad;
	}
});

test("constructor", 9, function() {
	ok(this.appController, "Instantiate ApplicationController object");
	same(this.appController.viewStack, [this.testView], "viewStack property");
	same(this.appController.noticeStack, {
		height: 0,
		notice: []
	}, "noticeStack property");

	this.contentWrapper.trigger("webkitTransitionEnd");
	equals(SpinningWheel.cellHeight, 45, "SpinningWheel.cellHeight property");

	$(document).bind("touchmove", function(e) {
		ok(e.isDefaultPrevented(), "Prevent default document touchmove events");
	});
	$(document).trigger($.Event("touchmove"));
	
	same(this.appController.abc.element, this.abc.get(0), "abc.element property");
	same(this.appController.abc.scroller, this.appController.scroller, "abc.scroller property");
	same(this.appController.abctoucheventproxy.element, this.appController.abc.element, "abctoucheventproxy.element property");
});

test("constructor - cache update", 1, function() {
	CacheControllerMock.prototype.updated = true;
	this.appController = new ApplicationController();
	same(this.notice.pop(), {
		id: this.appCacheUpdateNoticeId,
		label: "Updated",
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	}, "Notice");
	CacheControllerMock.prototype.updated = false;
});

test("constructor - cache update progress", 1, function() {
	CacheControllerMock.prototype.updated = true;
	$("#" + this.appCacheUpdateNoticeId).remove();
	var notice = $("<p>")
		.attr("id", this.appCacheUpdateNoticeId)
		.hide()
		.appendTo(document.body);
	this.appController = new ApplicationController();
	equals($("#" + this.appCacheUpdateNoticeId).html(), "Updated", "Notice");
	notice.remove();
	CacheControllerMock.prototype.updated = false;
});

asyncTest("start - dbConfig.json 304 Not Modified", 1, function() {
	$.get = jQueryMock.get;
	DatabaseController = DatabaseControllerMockNotModified;
	this.appController.start();
});

asyncTest("start - fail", 1, function() {
	DatabaseController = DatabaseControllerMockFail;
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

asyncTest("start - database upgrade", 1, function() {
	DatabaseController = DatabaseControllerMockUpgrade;
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

asyncTest("start - sync warning", 2, function() {
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

test("gotAppConfig - 304 Not Modified", 1, function() {
	var appVersion = "1.0";
	this.appController.gotAppConfig(undefined, "notmodified", { responseText: JSON.stringify({ "appVersion": appVersion }) });
	equals(this.appController.appVersion, appVersion, "appVersion property");
});

asyncTest("pushView", 3, function() {
	this.appController.scroller.y = 1;
	this.appController.pushView = this.originalPushView;
	this.appController.contentShown = this.originalContentShown;
	this.appController.pushView("test", {});
	equals(this.appController.viewStack[0].scrollPos, this.appController.scroller.y, "Previous scroll position");
	this.testView.scrollPos = 0;
	same(this.appController.viewStack[1], this.testView, "viewStack property");
});

asyncTest("pushView - 304 Not Modified", 1, function() {
	$.fn.load = jQueryMock.load;
	this.appController.pushView = this.originalPushView;
	this.appController.contentShown = this.originalContentShown;
	this.appController.pushView("test", {});
});

asyncTest("popView", 3, function() {
	this.appController.viewStack.push(this.testView);
	this.appController.contentShown = this.originalContentShown;
	this.appController.popView("Activated");
	same(this.appController.viewStack, [this.testView], "viewStack property");
});

test("refreshScroller", function() {
	var testParams = [
		{
			description: "scroll to position",
			scrollPos: 1,
			expectedPos: 1
		},
		{
			description: "scroll to end",
			scrollPos: -1,
			expectedPos: 0
		}
	];

	var i;
	
	this.appController.scroller.scrollTo = function(x, y, duration) {
		equals(y, testParams[i].expectedPos, testParams[i].description);
	};

	expect(testParams.length);
	for (i = 0; i < testParams.length; i++) {
		this.appController.viewStack[0].scrollPos = testParams[i].scrollPos;
		this.appController.refreshScroller();
	}
});

test("contentShown - loading", 3, function() {
	$("#contentWrapper").addClass("loading");
	this.appController.contentShown = this.originalContentShown;
	this.appController.contentShown();
	ok(!$("#contentWrapper").hasClass("loading"), "Unmark contentWrapper as loading");
	ok($("#contentWrapper").hasClass("loaded"), "Mark contentWrapper as loaded");
	ok(!$("#nowLoading").hasClass("loading"), "Hide Now Loading... message");
});

test("contentShown - loaded", 1, function() {
	$("#contentWrapper").addClass("loaded");
	this.appController.contentShown = this.originalContentShown;
	this.appController.contentShown();
	ok(!$("#contentWrapper").hasClass("loaded"), "Unmark contentWrapper as loaded");
});

test("setHeader", 10, function() {
	this.appController.setHeader();
	$("#headerLeftButton").trigger("click", "left");
	ok($("#headerLeftButton").hasClass(this.testView.controller.header.leftButton.style), "Set left button style");
	equals($("#headerLeftButton").text(), this.testView.controller.header.leftButton.label, "Left button label");
	ok(!$("#headerLeftButton").is(":hidden"), "Show left button");
	equals($("#headerLabel").text(), this.testView.controller.header.label, "Header label");
	ok(!$("#headerLabel").is(":hidden"), "Show header label");
	$("#headerRightButton").trigger("click", "right");
	ok($("#headerRightButton").hasClass(this.testView.controller.header.rightButton.style), "Set right button style");
	equals($("#headerRightButton").text(), this.testView.controller.header.rightButton.label, "Right button label");
	ok(!$("#headerRightButton").is(":hidden"), "Show right button");
});

test("clearHeader", 3, function() {
	this.appController.clearHeader();
	$("#headerLeftButton").trigger("click", "left");
	$("#headerRightButton").trigger("click", "right");
	ok($("#headerLeftButton").is(":hidden"), "Hide left button");
	ok($("#headerLabel").is(":hidden"), "Hide header label");
	ok($("#headerRightButton").is(":hidden"), "Hide right button");
});

test("setFooter", 10, function() {
	this.appController.setFooter();
	$("#footerLeftButton").trigger("click", "left");
	ok($("#footerLeftButton").hasClass(this.testView.controller.footer.leftButton.style), "Set left button style");
	equals($("#footerLeftButton").text(), this.testView.controller.footer.leftButton.label, "Left button label");
	ok(!$("#footerLeftButton").is(":hidden"), "Show left button");
	equals($("#footerLabel").text(), this.testView.controller.footer.label, "Footer label");
	ok(!$("#footerLabel").is(":hidden"), "Show footer label");
	$("#footerRightButton").trigger("click", "right");
	ok($("#footerRightButton").hasClass(this.testView.controller.footer.rightButton.style), "Set right button style");
	equals($("#footerRightButton").text(), this.testView.controller.footer.rightButton.label, "Right button label");
	ok(!$("#footerRightButton").is(":hidden"), "Show right button");
});

test("clearFooter", 4, function() {
	this.appController.clearFooter();
	$("#footerLeftButton").trigger("click", "left");
	$("#footerRightButton").trigger("click", "right");
	ok($("#footerLeftButton").is(":hidden"), "Hide left button");
	equals($("#footerLabel").val(), "", "Footer label");
	ok($("#footerLabel").is(":hidden"), "Hide footer label");
	ok($("#footerRightButton").is(":hidden"), "Hide right button");
});

test("setContentHeight", 1, function() {
	$("#header").outerHeight(1);
	$("#footer").outerHeight(1);
	window.innerHeight = 3;
	this.appController.setContentHeight();
	equals($("#contentWrapper").height(), 1, "Content height");
});

asyncTest("showNotice", 14, function() {
	var buttonClicked = function(e, button) {
		ok(true, "Bind " + button + " button " + e.type + " event listener");
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
		ok(noticeContainer.hasClass("notice"), "Bind hideNotice event listener");
	};
	window.innerHeight = 1;

	var originalAnimate = $.fn.animate;
	$.fn.animate = $.proxy(function(args, callback) {
		$.fn.animate = originalAnimate;

		var leftButton = $("#notices div a." + notice.leftButton.style);
		ok(leftButton.hasClass(notice.leftButton.style), "Set left button style");
		equals(leftButton.text(), notice.leftButton.label, "Left button label");

		equals($("#test-notice").html(), notice.label, "Notice label");

		var rightButton = $("#notices div a." + notice.rightButton.style);
		ok(rightButton.hasClass(notice.rightButton.style), "Set right button style");
		equals(rightButton.text(), notice.rightButton.label, "Right button label");

		equals($("#notices").css("visibility"), "visible", "Notices visibility");
		equals($("#notices").css("top"), 1 + window.pageYOffset + "px", "Notices position");

		var noticeContainer = $("#notices div");
		equals(this.appController.noticeStack.height, -noticeContainer.height(), "noticeStack height");
		equals(this.appController.noticeStack.notice[0].html(), noticeContainer.html(), "Notice");

		$("#notices div a." + notice.rightButton.style).trigger("click", "right");
		$("#notices div a." + notice.leftButton.style).trigger("click", "left");
		
		same(args, { top: $(window).height() + this.appController.noticeStack.height }, "Animate arguments");
		callback();
	}, this);

	this.appController.showNotice(notice);
});

asyncTest("hideNotice", 5, function() {
	var notice = {
		height: function() {
			return 1;
		},
		data: function(key, value) {
			equals(key, "acknowledged", "Notice data key");
			equals(value, true, "Notice data value");
		},
		animate: function(args, callback) {
			same(args, { height: 0 }, "Animate arguments");
			callback();
		}
	};

	this.appController.noticeHidden = $.proxy(function() {
		equals(this.appController.noticeStack.height, 1, "noticeStack height");
		ok(true, "Shrink notice");
		start();
	}, this);

	this.appController.hideNotice(notice);
});

asyncTest("noticeHidden", 2, function() {
	var originalAnimate = $.fn.animate;
	$.fn.animate = $.proxy(function(args, callback) {
		$.fn.animate = originalAnimate;
		same(args, { top: "-=" + this.appController.noticeStack.height }, "Animate arguments");
		callback();
	}, this);
	
	this.appController.noticeHidden();
});

test("noticesMoved", 4, function() {
	var notice1 = $("<div>")
		.attr("id", "test-notice-1")
		.hide()
		.data("acknowledged", true)
		.appendTo(document.body);

	var notice2 = $("<div>")
		.attr("id", "test-notice-2")
		.hide()
		.data("acknowleged", false)
		.appendTo(document.body);

	this.appController.noticeStack.notice.push(notice1);
	this.appController.noticeStack.notice.push(notice2);
	this.appController.noticesMoved = this.originalNoticesMoved;
	this.appController.noticesMoved();
	equals(this.appController.noticeStack.notice[0].attr("id"), notice2.attr("id"), "Notice ID");
	equals($("#notices").css("visibility"), "visible", "Notices visibility");
	this.appController.noticeStack.notice[0].data("acknowledged", true);
	this.appController.noticesMoved();
	equals(this.appController.noticeStack.notice.length, 0, "noticeStack.notice length");
	equals($("#notices").css("visibility"), "hidden", "Notices visibility");
});

test("showScrollHelper", 1, function() {
	this.appController.showScrollHelper();
	ok(!$("#abc").is(":hidden"), "Show scroll helper");
});

test("hideScrollHelper", 1, function() {
	this.appController.hideScrollHelper();
	ok($("#abc").is(":hidden"), "Hide scroll helper");
});
