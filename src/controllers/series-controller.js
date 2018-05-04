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
 * @requires framework/sw/spinningwheel
 * @requires components/toucheventproxy
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Program from "models/program-model";
import Series from "models/series-model";
import SeriesView from "views/series-view.html";
import SpinningWheel from "framework/sw/spinningwheel";
import TouchEventProxy from "components/toucheventproxy";
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
 * @property {Boolean} gettingNowShowing - indicates that the now showing status is currently being set
 * @property {TouchEventProxy} swtoucheventproxy - remaps touch events for the SpinningWheel
 * @property {Boolean} gettingProgramId - indicates that the programs list is currently being retrieved
 * @param {SeriesListItem} listItem - a list item from the SeriesList or Schedule view
 */
export default class SeriesController extends ViewController {
	constructor(listItem) {
		super();

		// If the passed item has an index, we're editing an existing series
		if (listItem.listIndex >= 0) {
			this.listItem = listItem;
			this.originalNowShowing = this.listItem.series.nowShowing;
			this.originalProgramId = this.listItem.series.programId;
		} else {
			// Otherwise, we're adding a new series
			this.listItem = {series: new Series(null, "", "", listItem.program.id, listItem.program.programName, 0, 0, 0, 0, 0, 0)};
		}
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	get view() {
		return SeriesView;
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	setup() {
		// Setup the header
		this.header = {
			label: "Add/Edit Series",
			leftButton: {
				eventHandler: this.cancel.bind(this),
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this),
				style: "confirmButton",
				label: "Save"
			}
		};

		// Set the series details
		$("#seriesName").val(this.listItem.series.seriesName);
		$("#nowShowing").val(this.listItem.series.nowShowingDisplay);

		// Bind events for all of the buttons/controls
		$("#nowShowing").on("click", this.getNowShowing.bind(this));
		$("#moveTo").on("click", this.getProgramId.bind(this));
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method save
	 * @desc Saves the series details to the database and returns to the previous view
	 */
	save() {
		// Get the series details
		this.listItem.series.seriesName = $("#seriesName").val();

		// Update the database and pop the view off the stack
		this.listItem.series.save(() => this.appController.popView(this.listItem));
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method cancel
	 * @desc Reverts any changes and returns to the previous view
	 */
	cancel() {
		// Revert to the original series details
		this.listItem.series.setNowShowing(this.originalNowShowing);
		this.listItem.series.programId = this.originalProgramId;

		// Pop the view off the stack
		this.appController.popView();
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method getNowShowing
	 * @desc Displays a SpinningWheel control for capturing the now showing status
	 */
	getNowShowing() {
		// Only proceed if the now showing status is not already being set
		if (!this.gettingNowShowing) {
			// Set the getting flag
			this.gettingNowShowing = true;

			// Get the current now showing status, and default to "Not Showing" if not set
			const nowShowing = this.listItem.series.nowShowing || 0;

			// Initialise the SpinningWheel with one slot for the now showing values; and show the control
			SpinningWheel.addSlot(Series.NOW_SHOWING, "left", nowShowing);
			SpinningWheel.setDoneAction(this.setNowShowing.bind(this));
			SpinningWheel.open();

			// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
			this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));

			// Clear the getting flag
			this.gettingNowShowing = false;
		}
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method setNowShowing
	 * @desc Gets the selected value from the SpinningWheel and updates the model and view
	 */
	setNowShowing() {
		// Update the model with the selected values in the SpinningWheel
		this.listItem.series.setNowShowing(SpinningWheel.getSelectedValues().keys[0]);

		// Update the view
		$("#nowShowing").val(this.listItem.series.nowShowingDisplay);

		// Remove the touch event proxy
		this.swtoucheventproxy = null;
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method getProgramId
	 * @desc Gets the list of programs that the user can move the series to
	 */
	getProgramId() {
		// Only proceed if the programs list is not already being retrieved
		if (!this.gettingProgramId) {
			// Set the getting flag
			this.gettingProgramId = true;

			// Get the list of programs
			Program.list(this.listRetrieved.bind(this));
		}
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method listRetrieved
	 * @desc Displays a SpinningWheel control for moving the series to a different program
	 * @param {Array<Program>} programList - array of program objects
	 */
	listRetrieved(programList) {
		// Reduce the list of programs into an object for the SpinningWheel
		const programs = programList.reduce((memo, program) => Object.assign(memo, {[program.id]: program.programName}), {});

		// Initialise the SpinningWheel with one slot for the programs; and show the control
		SpinningWheel.addSlot(programs, "left", this.listItem.series.programId);
		SpinningWheel.setDoneAction(this.setProgramId.bind(this));
		SpinningWheel.open();

		// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
		this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));

		// Clear the getting flag
		this.gettingProgramId = false;
	}

	/**
	 * @memberof SeriesController
	 * @this SeriesController
	 * @instance
	 * @method setProgramId
	 * @desc Gets the selected value from the SpinningWheel and updates the model and view
	 */
	setProgramId() {
		// Update the model with the selected values in the SpinningWheel
		[this.listItem.series.programId] = SpinningWheel.getSelectedValues().keys;
		[this.listItem.series.programName] = SpinningWheel.getSelectedValues().values;

		// Update the view
		$("#moveTo").val(this.listItem.series.programName);

		// Remove the touch event proxy
		this.swtoucheventproxy = null;
	}
}