function CacheController() {
	this.cacheStatusValues = [
		'uncached',
		'idle',
		'checking',
		'downloading',
		'updateready',
		'obsolete'
	];

	if (window.applicationCache) {
		var NOTICE_ID = "appCacheUpdateNotice";

		window.applicationCache.addEventListener('downloading', $.proxy(function() {
			this.callback(true, "Updating application to the latest version...<br/>Please Wait.", NOTICE_ID);
    }, this), false);

		window.applicationCache.addEventListener('progress', $.proxy(function(event) {
			console.log(event)
			this.callback(true, "Updating application to the latest version...<br/>Downloaded " + event.loaded + "/" + event.total, NOTICE_ID);
    }, this), false);

		window.applicationCache.addEventListener('updateready', $.proxy(function() {
			if (this.cacheStatusValues[window.applicationCache.status] != 'idle') {
				window.applicationCache.swapCache();
				this.callback(true, "Application has been updated to the latest version. Please restart the application.", NOTICE_ID);
			}
    }, this), false);

		window.applicationCache.addEventListener('error', $.proxy(function() {
			if (navigator.onLine) {
				var error = "Error reading application cache manifest (status: " + this.cacheStatusValues[window.applicationCache.status] + ")";
				console.log(error);
				this.callback(false, error);
			}
		}, this));

		window.applicationCache.addEventListener('noupdate', $.proxy(function() {
			if (this.callback) {
				this.callback(false, "You are currently running the latest version. No updates are available at this time.");
			}
		}, this));
	}
}

CacheController.prototype.update = function(callback) {
	if (window.applicationCache) {
		this.callback = callback;
		window.applicationCache.update();
	} else {
		callback(false, "This browser does not support application caching.");
	}
}