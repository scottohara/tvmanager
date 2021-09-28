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
import type {
	NavButtonEventHandler,
	ProgramListItem
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import type { PublicInterface } from "global";
import Series from "models/series-model";
import SeriesListTemplate from "views/seriesListTemplate.html";
import SeriesListView from "views/seriesList-view.html";
import ViewController from "controllers/view-controller";

/**
 * @class SeriesListController
 * @classdesc Controller for the series list view
 * @extends ViewController
 * @this SeriesListController
 * @property {ProgramListItem} listItem - a list item from the Programs view
 * @property {HeaderFooter} header - the view header bar
 * @property {List} seriesList - the list of series to display
 * @property {Series} activeListItem - active list item being added or edited
 * @property {HeaderFooter} footer - the view footer bar
 * @param {ProgramListItem} listItem - a list item from the Programs view
 */
export default class SeriesListController extends ViewController {
	private seriesList!: PublicInterface<List>;

	private activeListItem: PublicInterface<Series> | null = null;

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

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 */
	public override async activate(): Promise<void> {
		// Get the list of series for the specified program
		this.seriesList.items = await Series.listByProgram(String(this.listItem.program.id));

		// Refresh the list
		this.seriesList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method contentShown
	 * @desc Called after the controller content is visible
	 */
	public override contentShown(): void {
		// If there is an active list item, scroll it into view
		if (null !== this.activeListItem && $(`#${this.activeListItem.id}`).length) {
			this.seriesList.scrollTo(String(this.activeListItem.id));
		}
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
		this.activeListItem = this.seriesList.items[listIndex] as Series;

		// Display the Episodes view
		return this.appController.pushView("episodes", { listIndex, series: this.activeListItem });
	}

	/**
	 * @memberof SeriesListController
	 * @this SeriesListController
	 * @instance
	 * @method addItem
	 * @desc Displays the Series view for adding a series
	 */
	private async addItem(): Promise<void> {
		return this.appController.pushView("series", { program: this.listItem.program, sequence: this.seriesList.items.length });
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
		this.activeListItem = this.seriesList.items[listIndex] as Series;

		// Display the Series view
		return this.appController.pushView("series", { listIndex, series: this.activeListItem });
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