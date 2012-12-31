/**
 * @file (Controllers) SeriesController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class SeriesController
 * @classdesc Controller for the series view
 * @property {SeriesListItem} listItem - a list item from the SeriesList or Schedule view
 * @property {Number} originalNowShowing - the now showing status of the series when the view is first loaded
 * @property {String} originalProgramId - the program id of the series when the view is first loaded
 * @property {HeaderFooter} header - the view header bar
 * @property {Boolean} gettingNowShowing - indicates that the now showing status is currently being set
 * @property {TouchEventProxy} swtoucheventproxy - remaps touch events for the SpinningWheel
 * @property {Boolean} gettingProgramId - indicates that the programs list is currently being retrieved
 * @this SeriesController
 * @constructor
 * @param {SeriesListItem} listItem - a list item from the SeriesList or Schedule view
 */
var SeriesController = function (listItem) {
	"use strict";

	// If the passed item has an index, we're editing an existing series
	if (listItem.listIndex >= 0) {
		this.listItem = listItem;
		this.originalNowShowing = this.listItem.series.nowShowing;
		this.originalProgramId = this.listItem.series.programId;
	} else {
		// Otherwise, we're adding a new series
		this.listItem = { series: new Series(null, "", "", listItem.program.id, listItem.program.programName, 0, 0, 0, 0, 0, 0) };
	}
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
SeriesController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Add/Edit Series",
		leftButton: {
			eventHandler: $.proxy(this.cancel, this),
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: $.proxy(this.save, this),
			style: "blueButton",
			label: "Save"
		}
	};

	// Set the series details
	$("#seriesName").val(this.listItem.series.seriesName);
	$("#nowShowing").val(this.listItem.series.nowShowingDisplay);

	// Bind events for all of the buttons/controls
	$("#nowShowing").bind('click', $.proxy(this.getNowShowing, this));
	$("#moveTo").bind('click', $.proxy(this.getProgramId, this));
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method save
 * @desc Saves the series details to the database and returns to the previous view
 */
SeriesController.prototype.save = function() {
	"use strict";

	// Get the series details
	this.listItem.series.seriesName = $("#seriesName").val();

	// Update the database
	this.listItem.series.save();

	// If a new series was added, scroll the SeriesList view to the end of the list to reveal the new item
	if (isNaN(this.listItem.listIndex) || this.listItem.listIndex < 0) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}

	// Pop the view off the stack
	appController.popView(this.listItem);
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method cancel
 * @desc Reverts any changes and returns to the previous view
 */
SeriesController.prototype.cancel = function() {
	"use strict";

	// Revert to the original series details
	this.listItem.series.setNowShowing(this.originalNowShowing);
	this.listItem.series.programId = (this.originalProgramId);

	// Pop the view off the stack
	appController.popView();
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method getNowShowing
 * @desc Displays a SpinningWheel control for capturing the now showing status
 */
SeriesController.prototype.getNowShowing = function() {
	"use strict";

	// Only proceed if the now showing status is not already being set
	if (!this.gettingNowShowing) {
		// Set the getting flag
		this.gettingNowShowing = true;

		// Get the current now showing status, and default to "Not Showing" if not set
		var nowShowing = this.listItem.series.nowShowing;
		if (!nowShowing) {
			nowShowing = 0;
		}

		// Initialise the SpinningWheel with one slot for the now showing values; and show the control
		SpinningWheel.addSlot(Series.NOW_SHOWING, "left", nowShowing);
		SpinningWheel.setDoneAction($.proxy(this.setNowShowing, this));
		SpinningWheel.open();

		// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
		this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));

		// Clear the getting flag
		this.gettingNowShowing = false;
	}
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method setNowShowing
 * @desc Gets the selected value from the SpinningWheel and updates the model and view
 */
SeriesController.prototype.setNowShowing = function() {
	"use strict";

	// Update the model with the selected values in the SpinningWheel
	this.listItem.series.setNowShowing(SpinningWheel.getSelectedValues().keys[0]);

	// Update the view
	$("#nowShowing").val(this.listItem.series.nowShowingDisplay);

	// Remove the touch event proxy
	this.swtoucheventproxy = null;
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method getProgramId
 * @desc Gets the list of programs that the user can move the series to
 */
SeriesController.prototype.getProgramId = function() {
	"use strict";

	// Only proceed if the programs list is not already being retrieved
	if (!this.gettingProgramId) {
		// Set the getting flag
		this.gettingProgramId = true;

		// Get the list of programs
		Program.list($.proxy(this.listRetrieved, this));
	}
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method listRetrieved
 * @desc Displays a SpinningWheel control for moving the series to a different program
 * @param {Array<Program>} programList - array of program objects
 */
SeriesController.prototype.listRetrieved = function(programList) {
	"use strict";

	var programs = {};

	// Iterate of the list of programs and setup the data for the SpinningWheel
	for (var i = 0; i < programList.length; i++) {
		programs[programList[i].id] = programList[i].programName;
	}

	// Initialise the SpinningWheel with one slot for the programs; and show the control
	SpinningWheel.addSlot(programs, "left", this.listItem.series.programId);
	SpinningWheel.setDoneAction($.proxy(this.setProgramId, this));
	SpinningWheel.open();

	// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
	this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));

	// Clear the getting flag
	this.gettingProgramId = false;
};

/**
 * @memberof SeriesController
 * @this SeriesController
 * @instance
 * @method setProgramId
 * @desc Gets the selected value from the SpinningWheel and updates the model and view
 */
SeriesController.prototype.setProgramId = function() {
	"use strict";

	// Update the model with the selected values in the SpinningWheel
	this.listItem.series.programId = SpinningWheel.getSelectedValues().keys[0];

	// Update the view
	$("#moveTo").val(SpinningWheel.getSelectedValues().values[0]);

	// Remove the touch event proxy
	this.swtoucheventproxy = null;
};
