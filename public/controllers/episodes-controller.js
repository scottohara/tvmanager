/**
 * @file (Controllers) EpisodesController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		'components/list',
		'models/episode-model',
		'controllers/application-controller',
		'framework/jquery',
		'framework/jquery-ui'
	],

	/**
	 * @exports controllers/episodes-controller
	 */
	function(List, Episode, ApplicationController, $) {
		"use strict";
	
		/**
		 * @class SeriesListItem
		 * @classdesc Anonymous object containing the properties of a series list item
		 * @private
		 * @property {Number} [listIndex] - the list index of a series being edited
		 * @property {Series} [series] - a series being edited
		 * @property {String} [source] - the name of the view that we came from
		 */

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class EpisodesController
		 * @classdesc Controller for the episodes view
		 * @property {SeriesListItem} listItem - a list item from the SeriesList, Schedule or Report view
		 * @property {Boolean} scrollToFirstUnwatched - indicates whether to automatically scroll the list to reveal the first unwatched episode
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} episodeList - the list of episodes to display
		 * @property {Number} origWatchedCount - the watched status of an episode before editing
		 * @property {Number} origRecordedCount - the recorded status of an episode before editing
		 * @property {Number} origExpectedCount - the expected status of an episode before editing
		 * @property {Number} origStatusWarningCount - the warning status of and episode before editing
		 * @property {HeaderFooter} footer - the view footer bar
		 * @this EpisodesController
		 * @constructor EpisodesController
		 * @param {SeriesListItem} listItem - a list item from the Series, Schedule or Report view
		 */
		var EpisodesController = function (listItem) {
			this.listItem = listItem;
			this.scrollToFirstUnwatched = true;
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method setup
		 * @desc Initialises the controller
		 */
		EpisodesController.prototype.setup = function() {
			// Setup the header
			this.header = {
				label: this.listItem.series.programName + " : " + this.listItem.series.seriesName,
				leftButton: {
					eventHandler: $.proxy(this.goBack, this),
					style: "backButton",
					label: this.listItem.source || "Series"
				},
				rightButton: {
					eventHandler: $.proxy(this.addItem, this),
					style: "toolButton",
					label: "+"
				}
			};

			// Instantiate a List object
			this.episodeList = new List("list", "views/episodeListTemplate.html", null, [], $.proxy(this.viewItem, this), null, $.proxy(this.deleteItem, this), $.proxy(this.onPopulateListItem, this));

			// Get the list of episodes for the specified series
			Episode.listBySeries(this.listItem.series.id, $.proxy(this.listRetrieved, this));
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method activate
		 * @desc Activates the controller
		 * @param {EpisodeListItem} [listItem] - a list item that was just added/edited in the Episode view
		 */
		EpisodesController.prototype.activate = function(listItem) {
			// When returning from the Episode view, we need to update the list with the new values
			if (listItem) {
				// Get the details of the added/edited episode
				var newWatchedCount = ("Watched" === listItem.episode.status ? 1 : 0);
				var newRecordedCount = ("Recorded" === listItem.episode.status ? 1 : 0);
				var newExpectedCount = ("Expected" === listItem.episode.status ? 1 : 0);
				var newStatusWarningCount = ("warning" === listItem.episode.statusWarning ? 1 : 0);

				// If an existing episode was edited, increment/decrement the status counts for the series
				if (listItem.listIndex >= 0) {
					this.episodeList.items[listItem.listIndex] = listItem.episode;
					this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + (newWatchedCount - this.origWatchedCount));
					this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + (newRecordedCount - this.origRecordedCount));
					this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + (newExpectedCount - this.origExpectedCount));
					this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + (newStatusWarningCount - this.origStatusWarningCount));
				} else {
					// Otherwise add the new episode to the list and increment the status counts for the series
					this.episodeList.items.push(listItem.episode);
					this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount + 1);
					this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + newWatchedCount);
					this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + newRecordedCount);
					this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + newExpectedCount);
					this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + newStatusWarningCount);
				}
			}

			// Refresh the list
			this.episodeList.refresh();

			// Set to view mode
			this.viewItems();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method onPopulateListItem
		 * @desc Callback function after each episode is added to the list
		 * @param {Episode} episode - the episode added to the list
		 */
		EpisodesController.prototype.onPopulateListItem = function(episode) {
			// Only proceed if we need to scroll to the first unwatched episode
			if (this.scrollToFirstUnwatched) {
				// If the status of the episode is Watched, update the scroll position to the top of this episode
				if ("Watched" === episode.status) {
					appController.viewStack[appController.viewStack.length - 1].scrollPos += $("#" + String(episode.id)).parent().outerHeight();
				} else {
					// We have reached the first unwatched episode, so no further scrolling is required
					this.scrollToFirstUnwatched = false;
				}
			}
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method listRetrieved
		 * @desc Callback function after the list of episodes is retrieved
		 * @param {Array<Episode>} episodeList - array of episode objects
		 */
		EpisodesController.prototype.listRetrieved = function(episodeList) {
			// Set the list items
			this.episodeList.items = episodeList;

			// Activate the controller
			this.activate();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method goBack
		 * @desc Pops the view off the stack
		 */
		EpisodesController.prototype.goBack = function() {
			appController.popView(this.listItem);
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method viewItem
		 * @desc Displays the Episode view for editing an episode
		 * @param {Number} itemIndex - the list index of the episode to edit
		 */
		EpisodesController.prototype.viewItem = function(itemIndex) {
			// Save the current episode details
			this.origWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
			this.origRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
			this.origExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
			this.origStatusWarningCount = (this.episodeList.items[itemIndex].statusWarning ? 1 : 0);

			// Display the Episode view
			appController.pushView("episode", { listIndex: itemIndex, episode: this.episodeList.items[itemIndex] });
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method addItem
		 * @desc Displays the Episode view for adding an episode
		 */
		EpisodesController.prototype.addItem = function() {
			appController.pushView("episode", { series: this.listItem.series, sequence: this.episodeList.items.length });
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method deleteItem
		 * @desc Deletes an episode from the list
		 * @param {Number} itemIndex - the list index of the episode to delete
		 */
		EpisodesController.prototype.deleteItem = function(itemIndex) {
			// Get the details of the deleted episode
			var newWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
			var newRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
			var newExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
			var newStatusWarningCount = ("warning" === this.episodeList.items[itemIndex].statusWarning ? 1 : 0);

			// Decrement the status counts for the series
			this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount - 1);
			this.listItem.series.setWatchedCount(this.listItem.series.watchedCount - newWatchedCount);
			this.listItem.series.setRecordedCount(this.listItem.series.recordedCount - newRecordedCount);
			this.listItem.series.setExpectedCount(this.listItem.series.expectedCount - newExpectedCount);
			this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount - newStatusWarningCount);

			// Remove the item from the DOM
			$("#list li a#" + this.episodeList.items[itemIndex].id).remove();

			// Remove the item from the database
			this.episodeList.items[itemIndex].remove();

			// Remove the item from the list
			this.episodeList.items.splice(itemIndex,1);

			// Resequence the remaining items
			this.resequenceItems();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method deleteItems
		 * @desc Sets the list to delete mode
		 */
		EpisodesController.prototype.deleteItems = function() {
			// Set the list to delete mode
			this.episodeList.setAction("delete");

			// Clear the view footer
			appController.clearFooter();

			// Show the delete icons next to each list item
			$("#list")
				.removeClass()
				.addClass("delete");

			// Setup the footer
			this.footer = {
				label: "v" + appController.db.version,
				rightButton: {
					eventHandler: $.proxy(this.viewItems, this),
					style: "blueButton",
					label: "Done"
				}
			};

			// Set the view footer
			appController.setFooter();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method resequenceItems
		 * @desc Updates the sequence number of list items based on their current position in the list
		 */
		EpisodesController.prototype.resequenceItems = function() {
			var that = this;

			// Iterate over the HTML DOM elements in the list
			$("#list li a").each(function(index) {
				// Only update items that have changed position
				if ($(this).attr("id") !== that.episodeList.items[index].id) {
					// Iterate over the list items array
					for (var i = 0; i < that.episodeList.items.length; i++) {
						// If the array item at this position is not the same as the HTML DOM element at the same position, update the item's sequence in the database
						if (that.episodeList.items[i].id === $(this).attr("id")) {
							that.episodeList.items[i].sequence = index;
							that.episodeList.items[i].save();

							// Stop after the first update
							break;
						}
					}
				}
			});

			// Resort the list items based on the update sequences
			this.episodeList.items = this.episodeList.items.sort(function(a, b) {
				var x = a.sequence;
				var y = b.sequence;
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			});

			// Refresh the list
			this.episodeList.refresh();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method editItems
		 * @desc Sets the list to edit mode
		 */
		EpisodesController.prototype.editItems = function() {
			// Set the list to edit mode
			this.episodeList.setAction("edit");

			// Clear the view footer
			appController.clearFooter();

			// Show the edit icons next to each list item, and make the list sortable
			$("#list")
				.removeClass()
				.addClass("edit")
				.sortable({
					axis: "y",
					sort: this.sortItems
				})
				.addTouch();

			// Setup the footer
			this.footer = {
				label: "v" + appController.db.version,
				leftButton: {
					eventHandler: $.proxy(function() {
						this.resequenceItems();
						this.viewItems();
					}, this),
					style: "blueButton",
					label: "Done"
				}
			};

			// Set the view footer
			appController.setFooter();
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method sortItems
		 * @desc Repositions the sort helper when sorting the list items
		 */
		EpisodesController.prototype.sortItems = function(e, ui) {
			$(ui.helper).offset({top: e.clientY - 20});
		};

		/**
		 * @memberof EpisodesController
		 * @this EpisodesController
		 * @instance
		 * @method viewItems
		 * @desc Sets the list to view mode
		 */
		EpisodesController.prototype.viewItems = function() {
			// Set the list to view mode
			this.episodeList.setAction("view");

			// Clear the view footer
			appController.clearFooter();

			// Make the list unsortable
			$("#list.ui-sortable")
				.removeClass()
				.sortable("destroy")
				.removeTouch();

			// Setup the footer
			this.footer = {
				label: "v" + appController.db.version,
				leftButton: {
					eventHandler: $.proxy(this.editItems, this),
					style: "toolButton",
					label: "Sort"
				},
				rightButton: {
					eventHandler: $.proxy(this.deleteItems, this),
					style: "redButton",
					label: "Delete"
				}
			};

			// Set the view footer
			appController.setFooter();
		};

		return EpisodesController;
	}
);
