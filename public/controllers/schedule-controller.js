/**
 * @file (Controllers) ScheduleController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		'components/list',
		'models/series-model',
		'controllers/application-controller',
		'framework/jquery'
	],

	/**
	 * @exports controllers/schedule-controller
	 */
	function(List, Series, ApplicationController, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class ScheduleController
		 * @classdesc Controller for the schedule view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} scheduleList - the list of series to display
		 * @property {String} origSeriesName - the name of a series before editing
		 * @property {Number} origNowShowing - the now showing status of a series before editing
		 * @property {HeaderFooter} footer - the view footer bar
		 * @this ScheduleController
		 * @constructor ScheduleController
		 */
		var ScheduleController = function () {
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method setup
		 * @desc Initialises the controller
		 */
		ScheduleController.prototype.setup = function() {
			// Setup the header
			this.header = {
				label: "Schedule",
				leftButton: {
					eventHandler: this.viewUnscheduled,
					label: "Unscheduled"
				},
				rightButton: {
					eventHandler: this.viewPrograms,
					label: "Programs"
				}
			};

			// Instantiate a List object
			this.scheduleList = new List("list", "views/scheduleListTemplate.html", "nowShowingDisplay", [], $.proxy(this.viewItem, this), $.proxy(this.editItem, this));

			// Activate the controller
			this.activate();
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method activate
		 * @desc Activates the controller
		 * @param {SeriesListItem} [listItem] - a list item that was just view/added/edited
		 */
		ScheduleController.prototype.activate = function(listItem) {
			// When returning from the Episodes view, we need to update the list with the new values
			if (listItem) {
				// If the series is now not showing or has no recorded/expected episodes, remove the item from the list
				if ((!listItem.series.nowShowing) && 0 === listItem.series.recordedCount && 0 === listItem.series.expectedCount) {
					this.scheduleList.items.splice(listItem.listIndex,1);
				} else {
					// Update the item in the list
					this.scheduleList.items[listItem.listIndex] = listItem.series;

					// If the series name or now showing was edited, resort the list
					if (listItem.series.seriesName !== this.origSeriesName || listItem.series.nowShowing !== this.origNowShowing) {
						this.scheduleList.items = this.scheduleList.items.sort(function(a, b) {
							var x = (a.nowShowing || "Z") + "-" + a.programName;
							var y = (b.nowShowing || "Z") + "-" + b.programName;
							return ((x < y) ? -1 : ((x > y) ? 1 : 0));
						});
					}
				}

				// Refresh the list
				this.scheduleList.refresh();

				// Set to view mode
				this.viewItems();
			} else {
				// Otherwise, get the list of scheduled series
				Series.listByNowShowing($.proxy(this.listRetrieved, this));
			}
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method listRetrieved
		 * @desc Callback function after the list of series is retrieved
		 * @param {Array<Series>} scheduleList - array of series objects
		 */
		ScheduleController.prototype.listRetrieved = function(scheduleList) {
			// Set the list items
			this.scheduleList.items = scheduleList;

			// Refresh the list
			this.scheduleList.refresh();

			// Set to view mode
			this.viewItems();
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method viewItem
		 * @desc Displays the Episodes view for a series
		 * @param {Number} itemIndex - the list index of the series to view
		 */
		ScheduleController.prototype.viewItem = function(itemIndex) {
			appController.pushView("episodes", { source: "Schedule", listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method viewUnscheduled
		 * @desc Displays the Unscheduled view
		 */
		ScheduleController.prototype.viewUnscheduled = function() {
			appController.pushView("unscheduled");
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method viewPrograms
		 * @desc Displays the Programs view
		 */
		ScheduleController.prototype.viewPrograms = function() {
			appController.pushView("programs");
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method viewSettings
		 * @desc Displays the Settings view
		 */
		ScheduleController.prototype.viewSettings = function() {
			appController.pushView("settings");
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method editItem
		 * @desc Displays the Series view for editing a series
		 * @param {Number} itemIndex - the list index of the series to edit
		 */
		ScheduleController.prototype.editItem = function(itemIndex) {
			// Save the current series details
			this.origSeriesName = this.scheduleList.items[itemIndex].seriesName;
			this.origNowShowing = this.scheduleList.items[itemIndex].nowShowing;

			// Display the Series view
			appController.pushView("series", { listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method editItems
		 * @desc Sets the list to edit mode
		 */
		ScheduleController.prototype.editItems = function() {
			// Set the list to edit mode
			this.scheduleList.setAction("edit");

			// Clear the view footer
			appController.clearFooter();

			// Show the edit icons next to each list item
			$("#list")
				.removeClass()
				.addClass("edit");

			// Setup the footer
			this.footer = {
				label: "v" + appController.db.version,
				leftButton: {
					eventHandler: $.proxy(this.viewItems, this),
					style: "confirmButton",
					label: "Done"
				}
			};

			// Set the view footer
			appController.setFooter();
		};

		/**
		 * @memberof ScheduleController
		 * @this ScheduleController
		 * @instance
		 * @method viewItems
		 * @desc Sets the list to view mode
		 */
		ScheduleController.prototype.viewItems = function() {
			// Set the list to view mode
			this.scheduleList.setAction("view");

			// Clear the view footer
			appController.clearFooter();

			// Show the view icons next to each list item
			$("#list").removeClass();

			// Setup the footer
			this.footer = {
				label: "v" + appController.db.version,
				leftButton: {
					eventHandler: $.proxy(this.editItems, this),
					label: "Edit"
				},
				rightButton: {
					eventHandler: this.viewSettings,
					label: "Settings"
				}
			};

			// Set the view footer
			appController.setFooter();
		};
	
		return ScheduleController;
	}
);
