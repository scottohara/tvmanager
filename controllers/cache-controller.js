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

		window.applicationCache.addEventListener('downloading', function() {
			this.callback(true, "Updating application to the latest version...<br/>Please Wait.", NOTICE_ID);
    }.bind(this), false);

		window.applicationCache.addEventListener('progress', function(event) {
			console.log(event)
			this.callback(true, "Updating application to the latest version...<br/>Downloaded " + event.loaded + "/" + event.total, NOTICE_ID);
    }.bind(this), false);

		window.applicationCache.addEventListener('updateready', function() {
			if (this.cacheStatusValues[window.applicationCache.status] != 'idle') {
				window.applicationCache.swapCache();
				this.callback(true, "Application has been updated to the latest version. Please restart the application.", NOTICE_ID);
			}
    }.bind(this), false);

		window.applicationCache.addEventListener('error', function() {
			if (navigator.onLine) {
				var error = "Error reading application cache manifest (status: " + this.cacheStatusValues[window.applicationCache.status] + ")";
				console.log(error);
				this.callback(false, error);
			}
		}.bind(this));

		window.applicationCache.addEventListener('noupdate', function() {
			if (this.callback) {
				this.callback(false, "You are currently running the latest version. No updates are available at this time.");
			}
		}.bind(this));
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