/**
 * @file (Controllers) CacheController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/cache-controller
 * @requires components/window
 */
import window from "components/window";

/**
 * @class CacheController
 * @classdesc Manages the HTML5 application cache
 * @this CacheController
 * @property {Function} callback - a function to call after updating the cache
 * @property {Boolean} notifyOnError - whether to show a notice for any errors/warnings
 * @param {Function} callback - a function to call during/after the cache has been updated
 */
export default class CacheController {
	constructor(callback) {
		this.callback = callback;

		// Only proceed if the browser supports the HTML5 application cache
		if (window.applicationCache) {
			// Bind event handlers for the appCache events
			window.applicationCache.addEventListener("downloading", this.downloading.bind(this), false);
			window.applicationCache.addEventListener("progress", this.progress.bind(this), false);
			window.applicationCache.addEventListener("cached", this.cached.bind(this), false);
			window.applicationCache.addEventListener("updateready", this.updateReady.bind(this), false);
			window.applicationCache.addEventListener("error", this.error.bind(this));
			window.applicationCache.addEventListener("noupdate", this.noUpdate.bind(this));
		}
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @property {String} NOTICE_ID - the notice id
	 * @desc All cache update notices will use the same ID
	 */
	get NOTICE_ID() {
		return "appCacheUpdateNotice";
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @property {Array<String>} cacheStatusValues - array of status values
	 * @desc The list of status' for the application cache
	 */
	get cacheStatusValues() {
		return [
			"uncached",
			"idle",
			"checking",
			"downloading",
			"updateready",
			"obsolete"
		];
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method downloading
	 * @desc Downloading event handler
	 */
	downloading() {
		// Display a notice indicating that the cache is being updated
		this.callback(true, "Updating application to the latest version...<br/>Please wait.", this.NOTICE_ID);
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method progress
	 * @desc Progress event handler
	 * @param {Event} event - the progress event
	 */
	progress(event) {
		// Display a notice indicating how many files have been downloaded, and how many in total
		this.callback(true, `Updating application to the latest version...<br/>Downloaded ${event.loaded}/${event.total}`, this.NOTICE_ID);
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method cached
	 * @desc Cache ready event handler
	 */
	cached() {
		// Display a notice indicating that the cache update has completed
		this.callback(true, "Application has been updated to the latest version. Please restart the application.", this.NOTICE_ID);
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method updateReady
	 * @desc Update ready event handler
	 */
	updateReady() {
		// Only proceed if the status is not idle
		if ("idle" !== this.cacheStatusValues[window.applicationCache.status]) {
			// Swap to the updated cache
			window.applicationCache.swapCache();

			// Display a notice indicating that the cache update has completed
			this.callback(true, "Application has been updated to the latest version. Please restart the application.", this.NOTICE_ID);
		}
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method error
	 * @desc Error event handler
	 */
	error() {
		// It's only an error if we're online
		if (window.navigator.onLine) {
			// Display a notice indicating the error
			this.callback(this.notifyOnError, `Error reading application cache manifest (status: ${this.cacheStatusValues[window.applicationCache.status]})`);
		}
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method noUpdate
	 * @desc No update event handler
	 */
	noUpdate() {
		// Display a notice indicating that no update was available
		this.callback(this.notifyOnError, "You are currently running the latest version. No updates are available at this time.");
	}

	/**
	 * @memberof CacheController
	 * @this CacheController
	 * @instance
	 * @method update
	 * @desc Updates the application cache
	 * @param {Boolean} notifyOnError - whether to show a notice when an error occurs
	 */
	update(notifyOnError) {
		this.notifyOnError = notifyOnError;

		// Check that the browser supports the HTML5 application cache and the status is idle
		if (window.applicationCache) {
			if ("idle" === this.cacheStatusValues[window.applicationCache.status]) {
				// Update the cache
				window.applicationCache.update();
			}
		} else {
			// Call the callback function indicating that the application cache is not supported
			this.callback(this.notifyOnError, "This browser does not support application caching.");
		}
	}
}