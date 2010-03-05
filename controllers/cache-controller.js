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
		window.applicationCache.addEventListener('updateready', function() {
			if (this.cacheStatusValues[window.applicationCache.status] != 'idle') {
				window.applicationCache.swapCache();
				this.callback(true, "Application has been updated to the latest version. Please restart the application.");
			}
    }, false);

		window.applicationCache.addEventListener('error', function() {
			if (navigator.onLine) {
				var error = "Error reading application cache manifest (status: " + this.cacheStatusValues[window.applicationCache.status] + ")";
				console.log(error);
				this.callback(false, error);
			}
		});

		window.applicationCache.addEventListener('noupdate', function() {
			this.callback(false, "You are currently running the latest version. No updates are available at this time.");
		});
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