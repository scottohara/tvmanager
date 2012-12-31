/**
 * @file (Controllers) AboutController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class AboutController
 * @classdesc Controller for the about view
 * @property {HeaderFooter} header - the view header bar
 * @property {Number} episodeTotalCount - the total number of episodes
 * @property {Boolean} updating - indicates whether an application cache update is currently running
 * @this AboutController
 * @constructor
 */
var AboutController = function () {
	"use strict";
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
AboutController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "About",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Settings"
		}
	};

	// Get the total number of programs
	Program.count(this.programCount);

	// Get the total number of series
	Series.count(this.seriesCount);

	// Get the total number of episodes
	Episode.totalCount($.proxy(this.episodeCount, this));

	// Set the version information
	$("#databaseVersion").val("v" + appController.db.version);
	$("#appVersion").val("v" + appController.appVersion);

	// Bind an event to the check for updates button
	$("#update").bind('click', $.proxy(this.checkForUpdate, this));

	// Set the scroll position
	appController.setScrollPosition();
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method goBack
 * @desc Pop the view off the stack
 */
AboutController.prototype.goBack = function() {
	"use strict";

	appController.popView();
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method programCount
 * @desc Displays the total number of programs
 * @param {Number} count - the total number of programs
 */
AboutController.prototype.programCount = function(count) {
	"use strict";

	$("#totalPrograms").val(count);
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method seriesCount
 * @desc Displays the total number of series
 * @param {Number} count - the total number of series
 */
AboutController.prototype.seriesCount = function(count) {
	"use strict";

	$("#totalSeries").val(count);
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method episodeCount
 * @desc Sets the total number episodes, and gets the total number of watched episdes
 * @param {Number} count - the total number of episodes
 */
AboutController.prototype.episodeCount = function(count) {
	"use strict";

	// Save the total for later
	this.episodeTotalCount = count;

	// Get the total number of watched episodes
	Episode.countByStatus("Watched", $.proxy(this.watchedCount, this));
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method watchedCount
 * @desc Calculates the percentage of watched episodes, and displays the total number of episodes and percent watched
 * @param {Number} count - the total number of watched episodes
 */
AboutController.prototype.watchedCount = function(count) {
	"use strict";

	// Calculate the percentage of watched episodes
	var watchedPercent = this.episodeTotalCount > 0 ? Math.round(count / this.episodeTotalCount * 100, 2) : 0;

	// Display the total number of episodes and percent watched
	$("#totalEpisodes").val(this.episodeTotalCount + " (" + watchedPercent + "% watched)");
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method checkForUpdate
 * @desc Updates the application cache
 */
AboutController.prototype.checkForUpdate = function() {
	"use strict";

	// Check that an update is not currently in progress
	if (!this.updating) {
		// Set the updating flag
		this.updating = true;

		// Update the application cache
		appController.cache.update(this.updateChecked);

		// Clear the updating flag
		this.updating = false;
	}
};

/**
 * @memberof AboutController
 * @this AboutController
 * @instance
 * @method updateChecked
 * @desc Displays a notice from the application cache update
 * @param {Boolean} updated - whether or not the cache was updated
 * @param {String} message - a success/failure message from the cache controller
 */
AboutController.prototype.updateChecked = function(updated, message) {
	"use strict";

	// Show the notice
	appController.showNotice({
		label: message,
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	});
};
