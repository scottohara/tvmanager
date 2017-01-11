/**
 * @file (Controllers) AboutController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/about-controller
 * @requires jquery
 * @requires models/episode-model
 * @requires models/program-model
 * @requires models/series-model
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Episode from "models/episode-model";
import Program from "models/program-model";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

/**
 * @class AboutController
 * @classdesc Controller for the about view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {Number} episodeTotalCount - the total number of episodes
 * @property {Boolean} updating - indicates whether an application cache update is currently running
 */
export default class AboutController extends ViewController {
	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	setup() {
		// Setup the header
		this.header = {
			label: "About",
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: "Settings"
			}
		};

		// Get the total number of programs
		Program.count(this.programCount);

		// Get the total number of series
		Series.count(this.seriesCount);

		// Get the total number of episodes
		Episode.totalCount(this.episodeCount.bind(this));

		// Set the version information
		$("#databaseVersion").val(`v${this.appController.db.version}`);
		$("#appVersion").val(this.appController.appVersion);

		// Bind an event to the check for updates button
		$("#update").on("click", this.checkForUpdate.bind(this));

		// Set the scroll position
		this.appController.setScrollPosition();
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method goBack
	 * @desc Pop the view off the stack
	 */
	goBack() {
		this.appController.popView();
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method programCount
	 * @desc Displays the total number of programs
	 * @param {Number} count - the total number of programs
	 */
	programCount(count) {
		$("#totalPrograms").val(count);
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method seriesCount
	 * @desc Displays the total number of series
	 * @param {Number} count - the total number of series
	 */
	seriesCount(count) {
		$("#totalSeries").val(count);
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method episodeCount
	 * @desc Sets the total number episodes, and gets the total number of watched episdes
	 * @param {Number} count - the total number of episodes
	 */
	episodeCount(count) {
		// Save the total for later
		this.episodeTotalCount = count;

		// Get the total number of watched episodes
		Episode.countByStatus("Watched", this.watchedCount.bind(this));
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method watchedCount
	 * @desc Calculates the percentage of watched episodes, and displays the total number of episodes and percent watched
	 * @param {Number} count - the total number of watched episodes
	 */
	watchedCount(count) {
		// Calculate the percentage of watched episodes
		const DECIMAL_PLACES = 2,
					PERCENT = 100,
					watchedPercent = this.episodeTotalCount > 0 ? Math.round(count / this.episodeTotalCount * PERCENT, DECIMAL_PLACES) : 0;

		// Display the total number of episodes and percent watched
		$("#totalEpisodes").val(`${this.episodeTotalCount} (${watchedPercent}% watched)`);
	}

	/**
	 * @memberof AboutController
	 * @this AboutController
	 * @instance
	 * @method checkForUpdate
	 * @desc Updates the application cache
	 */
	checkForUpdate() {
		// Check that an update is not currently in progress
		if (!this.updating) {
			// Set the updating flag
			this.updating = true;

			// Update the application cache (and show a notice for any errors/warnings)
			this.appController.cache.update(true);

			// Clear the updating flag
			this.updating = false;
		}
	}
}