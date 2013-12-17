/**
 * @file (Controllers) EpisodeController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"models/episode-model",
		"controllers/application-controller",
		"components/toucheventproxy",
		"framework/sw/spinningwheel",
		"framework/jquery"
	],

	/**
	 * @exports controllers/episode-controller
	 */
	function(Episode, ApplicationController, TouchEventProxy, SpinningWheel, $) {
		"use strict";
	
		/**
		 * @class EpisodeListItem
		 * @classdesc Anonymous object containing the properties of an episode list item
		 * @private
		 * @property {Number} [listIndex] - the list index of an episode being edited
		 * @property {Episode} [episode] - an episode being edited
		 * @property {Number} [sequence] - the initial sequence to use for a new episode being added
		 * @property {Series} [series] - the series that a new episode being added belongs to
		 */

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class EpisodeController
		 * @classdesc Controller for the episode view
		 * @property {EpisodeListItem} listItem - a list item from the Episodes or Unscheduled view
		 * @property {String} originalStatus - the status of the episode when the view is first loaded
		 * @property {String} originalStatusDate - the status date of the episode when the view is first loaded
		 * @property {HeaderFooter} header - the view header bar
		 * @property {Boolean} settingStatus - indicates that the status is currently being set
		 * @property {TouchEventProxy} swtoucheventproxy - remaps touch events for the SpinningWheel
		 * @this EpisodeController
		 * @constructor EpisodeController
		 * @param {EpisodeListItem} listItem - a list item from the Episodes or Unscheduled view
		 */
		var EpisodeController = function (listItem) {
			// If the passed item has an index, we're editing an existing episode
			if (listItem.listIndex >= 0) {
				this.listItem = listItem;
				this.originalStatus = this.listItem.episode.status;
				this.originalStatusDate = this.listItem.episode.statusDate;
			} else {
				// Otherwise, we're adding a new episode
				this.listItem = { episode: new Episode(null, "", "", "", false, false, listItem.sequence, listItem.series.id) };
			}
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method setup
		 * @desc Initialises the controller
		 */
		EpisodeController.prototype.setup = function() {
			// Setup the header
			this.header = {
				label: "Add/Edit Episode",
				leftButton: {
					eventHandler: $.proxy(this.cancel, this),
					label: "Cancel"
				},
				rightButton: {
					eventHandler: $.proxy(this.save, this),
					style: "confirmButton",
					label: "Save"
				}
			};
				
			// Set the episode details
			$("#episodeName").val(this.listItem.episode.episodeName);
			$("#unverified").prop("checked", this.listItem.episode.unverified);
			$("#unscheduled").prop("checked", this.listItem.episode.unscheduled);

			// Bind events for all of the buttons/controls
			$("#watched").bind("click", $.proxy(function() { this.setStatus("Watched"); }, this));
			$("#recorded").bind("click", $.proxy(function() { this.setStatus("Recorded"); }, this));
			$("#expected").bind("click", $.proxy(function() { this.setStatus("Expected"); }, this));
			$("#missed").bind("click", $.proxy(function() { this.setStatus("Missed"); }, this));
			$("#statusDate").bind("click", $.proxy(this.getStatusDate, this));
			$("#unscheduled").bind("click", $.proxy(this.toggleStatusDateRow, this));

			// Toggle the current status
			var status = this.listItem.episode.status;
			this.listItem.episode.setStatus("");
			this.setStatus(status);

			// Set the status date
			$("#statusDate").val(this.listItem.episode.statusDate);
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method save
		 * @desc Saves the episode details to the database and returns to the previous view
		 */
		EpisodeController.prototype.save = function() {
			// Get the episode details
			this.listItem.episode.episodeName = $("#episodeName").val();
			this.listItem.episode.setUnverified($("#unverified").is(":checked"));
			this.listItem.episode.unscheduled = $("#unscheduled").is(":checked");

			// Update the database
			this.listItem.episode.save();

			// If a new episode was added, scroll the Episodes view to the end of the list to reveal the new item
			if (isNaN(this.listItem.listIndex) || this.listItem.listIndex < 0) {
				appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
			}

			// Pop the view off the stack
			appController.popView(this.listItem);
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method cancel
		 * @desc Reverts any changes and returns to the previous view
		 */
		EpisodeController.prototype.cancel = function() {
			// Revert to the original episode details
			this.listItem.episode.status = this.originalStatus;
			this.listItem.episode.statusDate = this.originalStatusDate;

			// Pop the view off the stack
			appController.popView();
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method setStatus
		 * @desc Toggles the episode status
		 * @param {String} status - the episode status
		 */
		EpisodeController.prototype.setStatus = function(status) {
			// Only proceed if the status is not already being set
			if (!this.settingStatus) {
				// Set the setting flag
				this.settingStatus = true;

				// Reset the current view
				$("#watched").removeClass();
				$("#recorded").removeClass();
				$("#expected").removeClass();
				$("#missed").removeClass();
				$("#unverifiedRow").hide();

				// If the current status was passed, toggle (ie. reset) the episode status
				if (this.listItem.episode.status === status) {
					this.listItem.episode.setStatus("");
				} else {
					// Otherwise set the status to the passed value and update the view
					this.listItem.episode.setStatus(status);
					switch (status) {
						case "Watched":
							$("#watched").addClass("status");
							break;

						case "Recorded":
							$("#recorded").addClass("status");
							$("#unverifiedRow").show();
							break;

						case "Expected":
							$("#expected").addClass("status");
							$("#unverifiedRow").show();
							break;

						case "Missed":
							$("#missed").addClass("status");
							$("#unverifiedRow").show();
							break;
					}
				}
				
				// Check if the status date needs to be shown/hidden
				this.toggleStatusDateRow();

				// Clear the setting flag
				this.settingStatus = false;
			}
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method getStatusDate
		 * @desc Displays a SpinningWheel control for capturing the episode status date
		 */
		EpisodeController.prototype.getStatusDate = function() {
			// Setup a dictionary of months
			var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };

			// Split the current status date on the dashe into date and month parts
			var parts = this.listItem.episode.statusDate.split("-");

			// If we don't have enough parts (ie. no date set), default to today's date
			if (parts.length < 2) {
				var today = new Date();
				parts[0] = today.getDate();
				parts[1] = months[today.getMonth()];
			} else {
				// Otherwise cast the date part to a number
				parts[0] = Number(parts[0]);
			}

			// Initialise the SpinningWheel with two slots, for date and month; and show the control
			SpinningWheel.addSlot({1: "01", 2: "02", 3: "03", 4: "04", 5: "05", 6: "06", 7: "07", 8: "08", 9: "09", 10: "10", 11: "11", 12: "12",
				13: "13", 14: "14", 15: "15", 16: "16", 17: "17", 18: "18", 19: "19", 20: "20", 21: "21", 22: "22", 23: "23", 24: "24", 25: "25",
				26: "26", 27: "27", 28: "28", 29: "29", 30: "30", 31: "31" }, "right", parts[0]);
			SpinningWheel.addSlot({"Jan": "Jan", "Feb": "Feb", "Mar": "Mar", "Apr": "Apr", "May": "May", "Jun": "Jun", "Jul": "Jul", "Aug": "Aug", "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dec": "Dec" }, null, parts[1]);
			SpinningWheel.setDoneAction($.proxy(this.setStatusDate, this));
			SpinningWheel.open();

			// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
			this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method setStatusDate
		 * @desc Gets the selected value from the SpinningWheel and updates the model and view
		 */
		EpisodeController.prototype.setStatusDate = function() {
			// Update the model with the selected values in the SpinningWheel
			this.listItem.episode.setStatusDate(SpinningWheel.getSelectedValues().values.join("-"));

			// Update the view
			$("#statusDate").val(this.listItem.episode.statusDate);

			// Remove the touch event proxy
			this.swtoucheventproxy = null;
		};

		/**
		 * @memberof EpisodeController
		 * @this EpisodeController
		 * @instance
		 * @method toggleStatusDateRow
		 * @desc Shows/hides the status date based on the current episode details
		 */
		EpisodeController.prototype.toggleStatusDateRow = function() {
			// Hide the status date
			$("#statusDateRow").hide();

			// Show the status date if certain criteria is met
			if ($("#unscheduled").is(":checked") || "Recorded" === this.listItem.episode.status || "Expected" === this.listItem.episode.status || "Missed" === this.listItem.episode.status) {
				$("#statusDateRow").show();

				// If no date has been specified, prompt the user for a date
				if ("" === this.listItem.episode.statusDate) {
					this.getStatusDate();
				}
			}
		};

		return EpisodeController;
	}
);
