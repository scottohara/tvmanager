CacheControllerMock = function() {
	"use strict";

	this.noticeId = "appCacheUpdateNotice";
};

CacheControllerMock.prototype.update = function(callback) {
	"use strict";

	callback(this.updated, "Updated", this.noticeId);
};

CacheControllerMock.prototype.updated = false;
