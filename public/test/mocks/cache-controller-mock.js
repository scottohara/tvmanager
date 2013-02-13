define(
	function() {
		"use strict";

		var CacheControllerMock = function() {
			this.noticeId = "appCacheUpdateNotice";
		};

		CacheControllerMock.prototype.update = function(callback) {
			callback(this.updated, "Updated", this.noticeId);
		};

		CacheControllerMock.prototype.updated = false;

		return CacheControllerMock;
	}
);
