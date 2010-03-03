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
			}
    }, false);

		window.applicationCache.addEventListener('error', function() {
			if (navigator.onLine) {
				console.log("Error reading application cache manifest (status: " + this.cacheStatusValues[window.applicationCache.status] + ")");
			}
		});
	}
}

CacheController.prototype.update = function() {
	var cacheSupported = false;

	if (window.applicationCache) {
		cacheSupported = true;
		window.applicationCache.update();
	}

	return cacheSupported;
}