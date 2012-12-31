/**
 * @file (Controllers) CacheController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class CacheController
 * @classdesc Manages the HTML5 application cache
 * @property {Array<String>} cacheStatusValues - array of cache status'
 * @property {Function} callback - a function to call after updating the cache
 * @this CacheController
 * @constructor
 */
var CacheController = function () {
	"use strict";

	// Define the list of status' for the application cache
	this.cacheStatusValues = [
		'uncached',
		'idle',
		'checking',
		'downloading',
		'updateready',
		'obsolete'
	];

	// Only proceed if the browser supports the HTML5 application cache
	if (window.applicationCache) {
		// All cache update notices will use the same ID
		var NOTICE_ID = "appCacheUpdateNotice";

		// Bind an event handler for the downloading event
		window.applicationCache.addEventListener('downloading', $.proxy(function() {
			// Display a notice indicating that the cache is being updated
			this.callback(true, "Updating application to the latest version...<br/>Please Wait.", NOTICE_ID);
    }, this), false);

		// Bind an event handler for the progress event
		window.applicationCache.addEventListener('progress', $.proxy(function(event) {
			// Display a notice indicating how many files have been downloaded, and how many in total
			this.callback(true, "Updating application to the latest version...<br/>Downloaded " + event.loaded + "/" + event.total, NOTICE_ID);
    }, this), false);

		// Bind an event handler for the updateready event
		window.applicationCache.addEventListener('updateready', $.proxy(function() {
			// Only proceed if the status is not idle
			if ("idle" !== this.cacheStatusValues[window.applicationCache.status]) {
				// Swap to the updated cache
				window.applicationCache.swapCache();
				
				// Display a notice indicating that the cache update has completed
				this.callback(true, "Application has been updated to the latest version. Please restart the application.", NOTICE_ID);
			}
    }, this), false);

		// Bind an event listener for the error event
		window.applicationCache.addEventListener('error', $.proxy(function() {
			// It's only an error if we're online
			if (navigator.onLine) {
				// Display a notice indicating the error
				var error = "Error reading application cache manifest (status: " + this.cacheStatusValues[window.applicationCache.status] + ")";
				console.log(error);
				this.callback(false, error);
			}
		}, this));

		// Bind an event listener for the noupdate event
		window.applicationCache.addEventListener('noupdate', $.proxy(function() {
			// If a callback function was provided, display a notice indicating that no update was available
			if (this.callback) {
				this.callback(false, "You are currently running the latest version. No updates are available at this time.");
			}
		}, this));
	}
};

/**
 * @memberof CacheController
 * @this CacheController
 * @instance
 * @method update
 * @desc Updates the application cache
 * @param {Function} callback - a function to call during/after the cache has been updated
 */
CacheController.prototype.update = function(callback) {
	"use strict";

	// Check that the browser supports the HTML5 application cache
	if (window.applicationCache) {
		this.callback = callback;

		// Update the cache
		window.applicationCache.update();
	} else {
		// Call the callback function indicating that the application cache is not supported
		callback(false, "This browser does not support application caching.");
	}
};
