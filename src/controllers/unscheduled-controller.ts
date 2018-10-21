/**
 * @file (Controllers) UnscheduledController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/unscheduled-controller
 * @requires jquery
 * @requires models/episode-model
 * @requires components/list
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Episode from "models/episode-model";
import List from "components/list";
import {PublicInterface} from "global";
import UnscheduledListTemplate from "views/unscheduledListTemplate.html";
import UnscheduledView from "views/unscheduled-view.html";
import ViewController from "controllers/view-controller";

/**
 * @class UnscheduledController
 * @classdesc Controller for the unscheduled view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {List} unscheduledList - the list of episodes to display
 * @property {HeaderFooter} footer - the view footer bar
 */
export default class UnscheduledController extends ViewController {
	private unscheduledList!: PublicInterface<List>;

	/**
	 * @memberof UnscheduledController
	 * @this UnscheduledController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return UnscheduledView;
	}

	/**
	 * @memberof UnscheduledController
	 * @this UnscheduledController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public setup(): void {
		// Setup the header
		this.header = {
			label: "Unscheduled",
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: "Schedule"
			}
		};

		// Instantiate a List object
		this.unscheduledList = new List("list", UnscheduledListTemplate, null, [], this.viewItem.bind(this));

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
	public activate(): void {
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
	private listRetrieved(unscheduledList: PublicInterface<Episode>[]): void {
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
	private goBack(): void {
		this.appController.popView();
	}

	/**
	 * @memberof UnscheduledController
	 * @this UnscheduledController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episode view for editing an episode
	 * @param {Number} listIndex - the list index of the episode to edit
	 */
	private viewItem(listIndex: number): void {
		this.appController.pushView("episode", {listIndex, episode: this.unscheduledList.items[listIndex]});
	}

	/**
	 * @memberof UnscheduledController
	 * @this UnscheduledController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private viewItems(): void {
		// Set the list to view mode
		this.unscheduledList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		$("#list").removeClass();

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`
		};

		// Set the view footer
		this.appController.setFooter();
	}
}