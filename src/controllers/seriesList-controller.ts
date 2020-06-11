/**
 * @file (Controllers) SeriesListController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/seriesList-controller
 * @requires jquery
 * @requires components/list
 * @requires models/series-model
 * @requires controllers/view-controller
 */
import {
	NavButtonEventHandler,
	ProgramListItem,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import { PublicInterface } from "global";
import Series from "models/series-model";
import SeriesListTemplate from "views/seriesListTemplate.html";
import SeriesListView from "views/seriesList-view.html";
import ViewController from "controllers/view-controller";
import window from "components/window";

/**
 * @class SeriesListController
 * @classdesc Controller for the series list view
 * @extends ViewController
 * @this SeriesListController
 * @property {ProgramListItem} listItem - a list item from the Programs view
 * @property {HeaderFooter} header - the view header bar
 * @property {List} seriesList - the list of series to display
 * @property {String} origSeriesName - the series name before editing
 * @property {Number} origEpisodeCount - the total number of episodes in a series before viewing/editing
 * @property {Number} origWatchedCount - the number of watched episodes in a series before viewing/editing
 * @property {Number} origRecordedCount - the number of recorded episodes in a series before viewing/editing
 * @property {Number} origExpectedCount - the number of expected episodes in a series before viewing/editing
 * @property {HeaderFooter} footer - the view footer bar
 * @param {ProgramListItem} listItem - a list item from the Programs view
 */
export default class SeriesListController extends ViewController {
	private seriesList!: PublicInterface<List>;

	private origSeriesName: string | null = null;

	private origEpisodeCount = 0;

	private origWatchedCount = 0;

	private origRecordedCount = 0;

	private origExpectedCount = 0;

	public constructor(private readonly listItem: ProgramListItem) {
		super();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return SeriesListView;
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: String(this.listItem.program.programName),
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Programs"
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+"
			}
		};

		// Instantiate a List object
		this.seriesList = new List("list", SeriesListTemplate, null, [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));

		// Get the list of series for the specified program
		return this.listRetrieved(await Series.listByProgram(String(this.listItem.program.id)));
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 * @param {SeriesListItem} [listItem] - a list item that was just view in the Episodes view, or added/edited in the Series view
	 */
	public async activate(listItem?: SeriesListItem): Promise<void> {
		let listResort = false;

		// When returning from the Episodes or Series view, we need to update the list with the new values
		if (undefined !== listItem) {
			// If an existing series was viewed/edited, check if the series was moved or increment/decrement the status counts for the series
			if (Number(listItem.listIndex) >= 0) {
				// If the series has not moved to a different program, increment/decrement the status counts for the program
				if (listItem.series.programId === this.listItem.program.id) {
					// If the series name has changed, we will need to resort the list and scroll to the new position
					if (listItem.series.seriesName !== this.origSeriesName) {
						listResort = true;
					}

					this.seriesList.items[Number(listItem.listIndex)] = listItem.series;
					this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount + (listItem.series.episodeCount - this.origEpisodeCount));
					this.listItem.program.setWatchedCount(this.listItem.program.watchedCount + (listItem.series.watchedCount - this.origWatchedCount));
					this.listItem.program.setRecordedCount(this.listItem.program.recordedCount + (listItem.series.recordedCount - this.origRecordedCount));
					this.listItem.program.setExpectedCount(this.listItem.program.expectedCount + (listItem.series.expectedCount - this.origExpectedCount));
				} else {
					// Otherwise, remove the item from the list
					await this.deleteItem(Number(listItem.listIndex), true);
				}
			} else {
				// Otherwise, add the new series and increment the series count for the program
				this.seriesList.items.push(listItem.series);
				this.listItem.program.seriesCount++;
				listResort = true;
			}

			// If necessary, resort the list
			if (listResort) {
				this.seriesList.items = this.seriesList.items.sort((a: Series, b: Series): number => String(a.seriesName).localeCompare(String(b.seriesName)));
			}
		}

		// Refresh the list
		this.seriesList.refresh();

		// If necessary, scroll the list item into view
		if (undefined !== listItem && listResort) {
			const DELAY_MS = 300;

			window.setTimeout((): void => this.seriesList.scrollTo(String(listItem.series.id)), DELAY_MS);
		}

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method listRetrieved
	 * @desc Called after the list of series is retrieved
	 * @param {Array<Series>} seriesList - array of series objects
	 */
	private async listRetrieved(seriesList: PublicInterface<Series>[]): Promise<void> {
		// Set the list items
		this.seriesList.items = seriesList;

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	private async goBack(): Promise<void> {
		return this.appController.popView(this.listItem);
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episodes view for a series
	 * @param {Number} listIndex - the list index of the series to view
	 */
	private async viewItem(listIndex: number): Promise<void> {
		const series = this.seriesList.items[listIndex] as Series;

		// Save the current series details
		this.origSeriesName = series.seriesName;
		this.origEpisodeCount = series.episodeCount;
		this.origWatchedCount = series.watchedCount;
		this.origRecordedCount = series.recordedCount;
		this.origExpectedCount = series.expectedCount;

		// Display the Episodes view
		return this.appController.pushView("episodes", { listIndex, series });
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method addItem
	 * @desc Displays the Series view for adding a series
	 */
	private async addItem(): Promise<void> {
		return this.appController.pushView("series", { program: this.listItem.program });
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method editItem
	 * @desc Displays the Series view for editing a series
	 * @param {Number} listIndex - the list index of the series to edit
	 */
	private async editItem(listIndex: number): Promise<void> {
		const series = this.seriesList.items[listIndex] as Series;

		// Save the current series details
		this.origSeriesName = series.seriesName;
		this.origEpisodeCount = series.episodeCount;
		this.origWatchedCount = series.watchedCount;
		this.origRecordedCount = series.recordedCount;
		this.origExpectedCount = series.expectedCount;

		// Display the Series view
		return this.appController.pushView("series", { listIndex, series });
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method deleteItem
	 * @desc Deletes a series from the list
	 * @param {Number} listIndex - the list index of the series to delete
	 * @param {Boolean} [dontRemove] - if true, remove the item from the list, but not from the database (eg. when moving a series to a different program)
	 */
	private async deleteItem(listIndex: number, dontRemove = false): Promise<void> {
		const series = this.seriesList.items[listIndex] as Series;

		// Decrement the status counts for the program
		this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount - series.episodeCount);
		this.listItem.program.setWatchedCount(this.listItem.program.watchedCount - series.watchedCount);
		this.listItem.program.setRecordedCount(this.listItem.program.recordedCount - series.recordedCount);
		this.listItem.program.setExpectedCount(this.listItem.program.expectedCount - series.expectedCount);
		this.listItem.program.seriesCount--;

		// Unless instructed otherwise, remove the item from the database
		if (!dontRemove) {
			await series.remove();
		}

		// Remove the item from the list
		this.seriesList.items.splice(listIndex, 1);

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
	private async deleteItems(): Promise<void> {
		// Set the list to delete mode
		this.seriesList.setAction("delete");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		$("#list")
			.removeClass()
			.addClass("delete");

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`,
			rightButton: {
				eventHandler: this.viewItems.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method editItems
	 * @desc Sets the list to edit mode
	 */
	private async editItems(): Promise<void> {
		// Set the list to edit mode
		this.seriesList.setAction("edit");

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
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.seriesList.setAction("view");

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
				eventHandler: this.deleteItems.bind(this) as NavButtonEventHandler,
				style: "cautionButton",
				label: "Delete"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}