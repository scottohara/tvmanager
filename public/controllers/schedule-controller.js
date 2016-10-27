/**
 * @file (Controllers) ScheduleController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"components/list",
		"models/series-model",
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports controllers/schedule-controller
	 */
	(List, Series, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class ScheduleController
		 * @classdesc Controller for the schedule view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} scheduleList - the list of series to display
		 * @property {String} origProgramId - the program id of a series before editing
		 * @property {Number} origNowShowing - the now showing status of a series before editing
		 * @property {HeaderFooter} footer - the view footer bar
		 */
		class ScheduleController {
			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method setup
			 * @desc Initialises the controller
			 */
			setup() {
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
				this.scheduleList = new List("list", "views/scheduleListTemplate.html", "nowShowingDisplay", [], this.viewItem.bind(this), this.editItem.bind(this));

				// Activate the controller
				this.activate();
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method activate
			 * @desc Activates the controller
			 * @param {SeriesListItem} [listItem] - a list item that was just view/added/edited
			 */
			activate(listItem) {
				// When returning from the Episodes view, we need to update the list with the new values
				if (listItem) {
					// If the series is now not showing or has no recorded/expected episodes, remove the item from the list
					if (!listItem.series.nowShowing && 0 === listItem.series.recordedCount && 0 === listItem.series.expectedCount) {
						this.scheduleList.items.splice(listItem.listIndex, 1);
					} else {
						// Update the item in the list
						this.scheduleList.items[listItem.listIndex] = listItem.series;

						// If the program or now showing was edited, resort the list
						if (listItem.series.programId !== this.origProgramId || listItem.series.nowShowing !== this.origNowShowing) {
							this.scheduleList.items = this.scheduleList.items.sort((a, b) => {
								const x = `${a.nowShowing || "Z"}-${a.programName}`,
											y = `${b.nowShowing || "Z"}-${b.programName}`;

								return x < y ? -1 : x > y ? 1 : 0;
							});
						}
					}

					// Refresh the list
					this.scheduleList.refresh();

					// Set to view mode
					this.viewItems();
				} else {
					// Otherwise, get the list of scheduled series
					Series.listByNowShowing(this.listRetrieved.bind(this));
				}
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method listRetrieved
			 * @desc Callback function after the list of series is retrieved
			 * @param {Array<Series>} scheduleList - array of series objects
			 */
			listRetrieved(scheduleList) {
				// Set the list items
				this.scheduleList.items = scheduleList;

				// Refresh the list
				this.scheduleList.refresh();

				// Set to view mode
				this.viewItems();
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method viewItem
			 * @desc Displays the Episodes view for a series
			 * @param {Number} itemIndex - the list index of the series to view
			 */
			viewItem(itemIndex) {
				appController.pushView("episodes", {source: "Schedule", listIndex: itemIndex, series: this.scheduleList.items[itemIndex]});
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method viewUnscheduled
			 * @desc Displays the Unscheduled view
			 */
			viewUnscheduled() {
				appController.pushView("unscheduled");
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method viewPrograms
			 * @desc Displays the Programs view
			 */
			viewPrograms() {
				appController.pushView("programs");
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method viewSettings
			 * @desc Displays the Settings view
			 */
			viewSettings() {
				appController.pushView("settings");
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method editItem
			 * @desc Displays the Series view for editing a series
			 * @param {Number} itemIndex - the list index of the series to edit
			 */
			editItem(itemIndex) {
				// Save the current series details
				this.origProgramId = this.scheduleList.items[itemIndex].programId;
				this.origNowShowing = this.scheduleList.items[itemIndex].nowShowing;

				// Display the Series view
				appController.pushView("series", {listIndex: itemIndex, series: this.scheduleList.items[itemIndex]});
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method editItems
			 * @desc Sets the list to edit mode
			 */
			editItems() {
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
					label: `v${appController.db.version}`,
					leftButton: {
						eventHandler: this.viewItems.bind(this),
						style: "confirmButton",
						label: "Done"
					}
				};

				// Set the view footer
				appController.setFooter();
			}

			/**
			 * @memberof ScheduleController
			 * @this ScheduleController
			 * @instance
			 * @method viewItems
			 * @desc Sets the list to view mode
			 */
			viewItems() {
				// Set the list to view mode
				this.scheduleList.setAction("view");

				// Clear the view footer
				appController.clearFooter();

				// Show the view icons next to each list item
				$("#list").removeClass();

				// Setup the footer
				this.footer = {
					label: `v${appController.db.version}`,
					leftButton: {
						eventHandler: this.editItems.bind(this),
						label: "Edit"
					},
					rightButton: {
						eventHandler: this.viewSettings,
						label: "Settings"
					}
				};

				// Set the view footer
				appController.setFooter();
			}
		}

		return ScheduleController;
	}
);