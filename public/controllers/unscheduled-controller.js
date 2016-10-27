/**
 * @file (Controllers) UnscheduledController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"components/list",
		"models/episode-model",
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports controllers/unscheduled-controller
	 */
	(List, Episode, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class UnscheduledController
		 * @classdesc Controller for the unscheduled view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} unscheduledList - the list of episodes to display
		 * @property {HeaderFooter} footer - the view footer bar
		 */
		class UnscheduledController {
			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method setup
			 * @desc Initialises the controller
			 */
			setup() {
				// Setup the header
				this.header = {
					label: "Unscheduled",
					leftButton: {
						eventHandler: this.goBack,
						style: "backButton",
						label: "Schedule"
					}
				};

				// Instantiate a List object
				this.unscheduledList = new List("list", "views/unscheduledListTemplate.html", null, [], this.viewItem.bind(this));

				// Activate the controller
				this.activate();
			}

			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method activate
			 * @desc Activates the controller
			 */
			activate() {
				// Get the list of unscheduled episodes
				Episode.listByUnscheduled(this.listRetrieved.bind(this));
			}

			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method listRetrieved
			 * @desc Callback function after the list of episodes is retrieved
			 * @param {Array<Episode>} unscheduledList - array of episode objects
			 */
			listRetrieved(unscheduledList) {
				// Set the list items
				this.unscheduledList.items = unscheduledList;

				// Refresh the list
				this.unscheduledList.refresh();

				// Set to view mode
				this.viewItems();
			}

			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method goBack
			 * @desc Pop the view off the stack
			 */
			goBack() {
				appController.popView();
			}

			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method viewItem
			 * @desc Displays the Episode view for editing an episode
			 * @param {Number} itemIndex - the list index of the episode to edit
			 */
			viewItem(itemIndex) {
				appController.pushView("episode", {listIndex: itemIndex, episode: this.unscheduledList.items[itemIndex]});
			}

			/**
			 * @memberof UnscheduledController
			 * @this UnscheduledController
			 * @instance
			 * @method viewItems
			 * @desc Sets the list to view mode
			 */
			viewItems() {
				// Set the list to view mode
				this.unscheduledList.setAction("view");

				// Clear the view footer
				appController.clearFooter();

				// Show the view icons next to each list item
				$("#list").removeClass();

				// Setup the footer
				this.footer = {
					label: `v${appController.db.version}`
				};

				// Set the view footer
				appController.setFooter();
			}
		}

		return UnscheduledController;
	}
);
