/**
 * @file (Controllers) ScheduleController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/schedule-controller
 * @requires jquery
 * @requires components/list
 * @requires models/series-model
 * @requires controllers/view-controller
 */
import {
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import { PublicInterface } from "global";
import ScheduleListTemplate from "views/scheduleListTemplate.html";
import ScheduleView from "views/schedule-view.html";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

/**
 * @class ScheduleController
 * @classdesc Controller for the schedule view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {List} scheduleList - the list of series to display
 * @property {String} origProgramId - the program id of a series before editing
 * @property {Number} origNowShowing - the now showing status of a series before editing
 * @property {HeaderFooter} footer - the view footer bar
 */
export default class ScheduleController extends ViewController {
	private scheduleList!: PublicInterface<List>;

	private origProgramId: string | null = null;

	private origNowShowing: number | null = null;

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return ScheduleView;
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Schedule",
			leftButton: {
				eventHandler: this.viewUnscheduled.bind(this) as NavButtonEventHandler,
				label: "Unscheduled"
			},
			rightButton: {
				eventHandler: this.viewPrograms.bind(this) as NavButtonEventHandler,
				label: "Programs"
			}
		};

		// Instantiate a List object
		this.scheduleList = new List("list", ScheduleListTemplate, "nowShowingDisplay", [], this.viewItem.bind(this), this.editItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 * @param {SeriesListItem} [listItem] - a list item that was just view/added/edited
	 */
	public async activate(listItem?: SeriesListItem): Promise<void> {
		// When returning from the Episodes view, we need to update the list with the new values
		if (undefined === listItem) {
			// Get the list of scheduled series
			return this.listRetrieved(await Series.listByNowShowing());
		}

		// If the series is now not showing or has no recorded/expected episodes, remove the item from the list
		if (null === listItem.series.nowShowing && !listItem.series.recordedCount && !listItem.series.expectedCount) {
			this.scheduleList.items.splice(Number(listItem.listIndex), 1);
		} else {
			// Update the item in the list
			this.scheduleList.items[Number(listItem.listIndex)] = listItem.series;

			// If the program or now showing was edited, resort the list
			if (listItem.series.programId !== this.origProgramId || listItem.series.nowShowing !== this.origNowShowing) {
				this.scheduleList.items = this.scheduleList.items.sort((a: Series, b: Series): number => {
					const x = `${null === a.nowShowing ? "Z" : a.nowShowing}-${a.programName}`,
								y = `${null === b.nowShowing ? "Z" : b.nowShowing}-${b.programName}`;

					return x.localeCompare(y);
				});
			}
		}

		// Refresh the list
		this.scheduleList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method listRetrieved
	 * @desc Called after the list of series is retrieved
	 * @param {Array<Series>} scheduleList - array of series objects
	 */
	private async listRetrieved(scheduleList: PublicInterface<Series>[]): Promise<void> {
		// Set the list items
		this.scheduleList.items = scheduleList;

		// Refresh the list
		this.scheduleList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episodes view for a series
	 * @param {Number} listIndex - the list index of the series to view
	 */
	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episodes", { source: "Schedule", listIndex, series: this.scheduleList.items[listIndex] as PublicInterface<Series> });
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method viewUnscheduled
	 * @desc Displays the Unscheduled view
	 */
	private async viewUnscheduled(): Promise<void> {
		return this.appController.pushView("unscheduled");
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method viewPrograms
	 * @desc Displays the Programs view
	 */
	private async viewPrograms(): Promise<void> {
		return this.appController.pushView("programs");
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method viewSettings
	 * @desc Displays the Settings view
	 */
	private async viewSettings(): Promise<void> {
		return this.appController.pushView("settings");
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method editItem
	 * @desc Displays the Series view for editing a series
	 * @param {Number} listIndex - the list index of the series to edit
	 */
	private async editItem(listIndex: number): Promise<void> {
		const series = this.scheduleList.items[listIndex] as Series;

		// Save the current series details
		this.origProgramId = series.programId;
		this.origNowShowing = series.nowShowing;

		// Display the Series view
		return this.appController.pushView("series", { listIndex, series });
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method editItems
	 * @desc Sets the list to edit mode
	 */
	private async editItems(): Promise<void> {
		// Set the list to edit mode
		this.scheduleList.setAction("edit");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the edit icons next to each list item
		$("#list")
			.removeClass()
			.addClass("edit");

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`,
			leftButton: {
				eventHandler: this.viewItems.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof ScheduleController
	 * @this ScheduleController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.scheduleList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		$("#list").removeClass();

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`,
			leftButton: {
				eventHandler: this.editItems.bind(this) as NavButtonEventHandler,
				label: "Edit"
			},
			rightButton: {
				eventHandler: this.viewSettings.bind(this) as NavButtonEventHandler,
				label: "Settings"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}