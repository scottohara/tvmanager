/**
 * @file (Controllers) SeriesController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/series-controller
 * @requires jquery
 * @requires models/program-model
 * @requires models/series-model
 * @requires controllers/view-controller
 */
import type {
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import Program from "models/program-model";
import Series from "models/series-model";
import SeriesView from "views/series-view.html";
import ViewController from "controllers/view-controller";

/**
 * @class SeriesController
 * @classdesc Controller for the series view
 * @extends ViewController
 * @this SeriesController
 * @property {SeriesListItem} listItem - a list item from the SeriesList or Schedule view
 * @property {Number} originalNowShowing - the now showing status of the series when the view is first loaded
 * @property {String} originalProgramId - the program id of the series when the view is first loaded
 * @property {HeaderFooter} header - the view header bar
 * @param {SeriesListItem} listItem - a list item from the SeriesList or Schedule view
 */
export default class SeriesController extends ViewController {
	private readonly listItem: SeriesListItem;

	private readonly originalNowShowing: number | null = null;

	private readonly originalProgramId: string | null = null;

	public constructor(listItem: SeriesListItem) {
		super();

		// If the passed item has an index, we're editing an existing series
		if (Number(listItem.listIndex) >= 0) {
			this.listItem = listItem;
			this.originalNowShowing = this.listItem.series.nowShowing;
			this.originalProgramId = this.listItem.series.programId;
		} else {
			// Otherwise, we're adding a new series
			this.listItem = { series: new Series(null, `Series ${Number(listItem.sequence) + 1}`, null, (listItem.program as Program).id, String((listItem.program as Program).programName)) };
		}
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return SeriesView;
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Series",
			leftButton: {
				eventHandler: this.cancel.bind(this) as NavButtonEventHandler,
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Save"
			}
		};

		// Populate the list of programs
		const programs: Program[] = await Program.list(),
					options = programs.map((program: Program): JQuery => $("<option>").val(String(program.id)).text(String(program.programName)));

		$("#moveTo").append(options);

		// Set the series details
		$("#seriesName").val(String(this.listItem.series.seriesName));
		$("#nowShowing").val(this.listItem.series.nowShowing ?? "");
		$("#moveTo").val(String(this.listItem.series.programId));
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method contentShown
	 * @desc Called after the controller content is visible
	 */
	public override contentShown(): void {
		// If we're adding a new series, focus and select the episode name
		if (undefined === this.listItem.listIndex) {
			$("#seriesName").select();
		}
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method save
	 * @desc Saves the series details to the database and returns to the previous view
	 */
	private async save(): Promise<void> {
		// Get the series details
		this.listItem.series.seriesName = String($("#seriesName").val());
		this.listItem.series.nowShowing = Number($("#nowShowing").val()) || null;
		this.listItem.series.programId = String($("#moveTo").val());

		// Update the database and pop the view off the stack
		await this.listItem.series.save();

		return this.appController.popView(this.listItem);
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method cancel
	 * @desc Reverts any changes and returns to the previous view
	 */
	private async cancel(): Promise<void> {
		// Revert to the original series details
		this.listItem.series.nowShowing = this.originalNowShowing;
		this.listItem.series.programId = this.originalProgramId;

		// Pop the view off the stack
		return this.appController.popView();
	}
}