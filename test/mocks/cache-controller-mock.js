CacheControllerMock = function() {
		this.noticeId = "appCacheUpdateNotice";
}

CacheControllerMock.prototype.update = function(callback) {
	callback(this.updated, "Updated", this.noticeId);
}

CacheControllerMock.prototype.updated = false;