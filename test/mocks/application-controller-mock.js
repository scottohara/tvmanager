ApplicationControllerMock = function() {
	this.db = new DatabaseMock();
	this.cache = new CacheControllerMock();
	this.scroller = {
		destroy: function() {}
	};
	this.notice = [];
	this.appVersion = "1.0";
};

ApplicationControllerMock.prototype.refreshScroller = function() {
	ok(true, "Refresh scroller");
};

ApplicationControllerMock.prototype.pushView = function(view, args) {
	this.viewArgs = args;
	ok(true, "Push " + view + " view");
};

ApplicationControllerMock.prototype.popView = function() {
	ok(true, "Pop view");
};

ApplicationControllerMock.prototype.showNotice = function(notice) {
	this.notice.push(notice);
};

ApplicationControllerMock.prototype.checkNotice = function(notice) {
	same(notice, this.expectedNotice, "Notice");
	start();
};

ApplicationControllerMock.prototype.contentShown = function(e) {
	ok(true, "Bind " + e.type + " event listener");
};

ApplicationControllerMock.prototype.noticesMoved = function(e) {
	ok(true, "Slide notices");
	start();
};

ApplicationControllerMock.prototype.clearFooter = function() {

};

ApplicationControllerMock.prototype.setFooter = function() {

};

ApplicationControllerMock.prototype.showScrollHelper = function() {

};

ApplicationControllerMock.prototype.hideScrollHelper = function() {

};

ApplicationControllerMock.prototype.initScroller = function() {

};