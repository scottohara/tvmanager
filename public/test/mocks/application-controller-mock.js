ApplicationControllerMock = function() {
	"use strict";

	this.db = new DatabaseMock();
	this.cache = new CacheControllerMock();
	this.notice = [];
	this.appVersion = "1.0";
};

ApplicationControllerMock.prototype.getScrollPosition = function() {
	"use strict";
};

ApplicationControllerMock.prototype.setScrollPosition = function() {
	"use strict";

	ok(true, "Set scroll position");
};

ApplicationControllerMock.prototype.pushView = function(view, args) {
	"use strict";

	this.viewArgs = args;
	ok(true, "Push " + view + " view");
};

ApplicationControllerMock.prototype.popView = function() {
	"use strict";

	ok(true, "Pop view");
};

ApplicationControllerMock.prototype.showNotice = function(notice) {
	"use strict";

	this.notice.push(notice);
};

ApplicationControllerMock.prototype.checkNotice = function(notice) {
	"use strict";

	same(notice, this.expectedNotice, "Notice");
	start();
};

ApplicationControllerMock.prototype.contentShown = function(e) {
	"use strict";

	ok(true, "Bind " + e.type + " event listener");
};

ApplicationControllerMock.prototype.noticesMoved = function(e) {
	"use strict";

	ok(true, "Slide notices");
	start();
};

ApplicationControllerMock.prototype.clearFooter = function() {
	"use strict";
};

ApplicationControllerMock.prototype.setFooter = function() {
	"use strict";
};

ApplicationControllerMock.prototype.showScrollHelper = function() {
	"use strict";
};

ApplicationControllerMock.prototype.hideScrollHelper = function() {
	"use strict";
};
