/**
 * @file (Controllers) SeriesListController
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
	 * @exports controllers/seriesList-controller
	 */
	(List, Series, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class SeriesListController
		 * @classdesc Controller for the series list view
		 * @property {ProgramListItem} listItem - a list item from the Programs view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} seriesList - the list of series to display
		 * @property {Number} origEpisodeCount - the total number of episodes in a series before viewing/editing
		 * @property {Number} origWatchedCount - the number of watched episodes in a series before viewing/editing
		 * @property {Number} origRecordedCount - the number of recorded episodes in a series before viewing/editing
		 * @property {Number} origExpectedCount - the number of expected episodes in a series before viewing/editing
		 * @property {HeaderFooter} footer - the view footer bar
		 */
		class SeriesListController {
			/**
			 * @constructor SeriesListController
			 * @this SeriesListController
			 * @param {ProgramListItem} listItem - a list item from the Programs view
			 */
			constructor(listItem) {
				this.listItem = listItem;
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method setup
			 * @desc Initialises the controller
			 */
			setup() {
				// Setup the header
				this.header = {
					label: this.listItem.program.programName,
					leftButton: {
						eventHandler: this.goBack.bind(this),
						style: "backButton",
						label: "Programs"
					},
					rightButton: {
						eventHandler: this.addItem.bind(this),
						label: "+"
					}
				};

				// Instantiate a List object
				this.seriesList = new List("list", "views/seriesListTemplate.html", null, [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));

				// Get the list of series for the specified program
				Series.listByProgram(this.listItem.program.id, this.listRetrieved.bind(this));
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method activate
			 * @desc Activates the controller
			 * @param {SeriesListItem} [listItem] - a list item that was just view in the Episodes view, or added/edited in the Series view
			 */
			activate(listItem) {
				// When returning from the Episodes or Series view, we need to update the list with the new values
				if (listItem) {
					// If an existing series was viewed/edited, check if the series was moved or increment/decrement the status counts for the series
					if (listItem.listIndex >= 0) {
						// If the series has not moved to a different program, increment/decrement the status counts for the program
						if (listItem.series.programId === this.listItem.program.id) {
							this.seriesList.items[listItem.listIndex] = listItem.series;
							this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount + (listItem.series.episodeCount - this.origEpisodeCount));
							this.listItem.program.setWatchedCount(this.listItem.program.watchedCount + (listItem.series.watchedCount - this.origWatchedCount));
							this.listItem.program.setRecordedCount(this.listItem.program.recordedCount + (listItem.series.recordedCount - this.origRecordedCount));
							this.listItem.program.setExpectedCount(this.listItem.program.expectedCount + (listItem.series.expectedCount - this.origExpectedCount));
						} else {
							// Otherwise, remove the item from the list
							this.deleteItem(listItem.listIndex, true);
						}
					} else {
						// Otherwise, add the new series and increment the series count for the program
						this.seriesList.items.push(listItem.series);
						this.listItem.program.seriesCount++;
					}
				}

				// Refresh the list
				this.seriesList.refresh();

				// Set to view mode
				this.viewItems();
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method listRetrieved
			 * @desc Callback function after the list of series is retrieved
			 * @param {Array<Series>} seriesList - array of series objects
			 */
			listRetrieved(seriesList) {
				// Set the list items
				this.seriesList.items = seriesList;

				// Activate the controller
				this.activate();
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method goBack
			 * @desc Pops the view off the stack
			 */
			goBack() {
				appController.popView(this.listItem);
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method viewItem
			 * @desc Displays the Episodes view for a series
			 * @param {Number} itemIndex - the list index of the series to view
			 */
			viewItem(itemIndex) {
				// Save the current series details
				this.origEpisodeCount = this.seriesList.items[itemIndex].episodeCount;
				this.origWatchedCount = this.seriesList.items[itemIndex].watchedCount;
				this.origRecordedCount = this.seriesList.items[itemIndex].recordedCount;
				this.origExpectedCount = this.seriesList.items[itemIndex].expectedCount;

				// Display the Episodes view
				appController.pushView("episodes", {listIndex: itemIndex, series: this.seriesList.items[itemIndex]});
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method addItem
			 * @desc Displays the Series view for adding a series
			 */
			addItem() {
				appController.pushView("series", {program: this.listItem.program});
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method editItem
			 * @desc Displays the Series view for editing a series
			 * @param {Number} itemIndex - the list index of the series to edit
			 */
			editItem(itemIndex) {
				// Save the current series details
				this.origEpisodeCount = this.seriesList.items[itemIndex].episodeCount;
				this.origWatchedCount = this.seriesList.items[itemIndex].watchedCount;
				this.origRecordedCount = this.seriesList.items[itemIndex].recordedCount;
				this.origExpectedCount = this.seriesList.items[itemIndex].expectedCount;

				// Display the Series view
				appController.pushView("series", {listIndex: itemIndex, series: this.seriesList.items[itemIndex]});
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method deleteItem
			 * @desc Deletes a series from the list
			 * @param {Number} itemIndex - the list index of the series to delete
			 * @param {Boolean} [dontRemove] - if true, remove the item from the list, but not from the database (eg. when moving a series to a different program)
			 */
			deleteItem(itemIndex, dontRemove) {
				// Decrement the status counts for the program
				this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount - this.seriesList.items[itemIndex].episodeCount);
				this.listItem.program.setWatchedCount(this.listItem.program.watchedCount - this.seriesList.items[itemIndex].watchedCount);
				this.listItem.program.setRecordedCount(this.listItem.program.recordedCount - this.seriesList.items[itemIndex].recordedCount);
				this.listItem.program.setExpectedCount(this.listItem.program.expectedCount - this.seriesList.items[itemIndex].expectedCount);
				this.listItem.program.seriesCount--;

				// Unless instructed otherwise, remove the item from the database
				if (!dontRemove) {
					this.seriesList.items[itemIndex].remove();
				}

				// Remove the item from the list
				this.seriesList.items.splice(itemIndex, 1);

				// Refresh the list
				this.seriesList.refresh();
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method deleteItems
			 * @desc Sets the list to delete mode
			 */
			deleteItems() {
				// Set the list to delete mode
				this.seriesList.setAction("delete");

				// Clear the view footer
				appController.clearFooter();

				// Show the delete icons next to each list item
				$("#list")
					.removeClass()
					.addClass("delete");

				// Setup the footer
				this.footer = {
					label: `v${appController.db.version}`,
					rightButton: {
						eventHandler: this.viewItems.bind(this),
						style: "confirmButton",
						label: "Done"
					}
				};

				// Set the view footer
				appController.setFooter();
			}

			/**
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method editItems
			 * @desc Sets the list to edit mode
			 */
			editItems() {
				// Set the list to edit mode
				this.seriesList.setAction("edit");

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
			 * @memberof SeriesListController
			 * @this SeriesListController
			 * @instance
			 * @method viewItems
			 * @desc Sets the list to view mode
			 */
			viewItems() {
				// Set the list to view mode
				this.seriesList.setAction("view");

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
						eventHandler: this.deleteItems.bind(this),
						style: "cautionButton",
						label: "Delete"
					}
				};

				// Set the view footer
				appController.setFooter();
			}
		}

		return SeriesListController;
	}
);
