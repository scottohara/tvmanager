/**
 * @file (Controllers) ProgramController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class ProgramListItem
 * @classdesc Anonymous object containing the properties of a program list item
 * @private
 * @property {Number} [listIndex] - the list index of a program being edited
 * @property {Program} [program] - a program being edited
 */

/**
 * @class ProgramController
 * @classdesc Controller for the program view
 * @property {ProgramListItem} listItem - a list item from the Programs view
 * @property {HeaderFooter} header - the view header bar
 * @this ProgramController
 * @constructor
 * @param {ProgramListItem} listItem - a list item from the Programs view
 */
var ProgramController = function (listItem) {
	"use strict";

	// If a list item was passed, we're editing an existing program
	if (listItem) {
		this.listItem = listItem;
	} else {
		// Otherwise we're adding a new program
		this.listItem = { program: new Program(null, "", 0, 0, 0, 0, 0) };
	}
};

/**
 * @memberof ProgramController
 * @this ProgramController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
ProgramController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Add/Edit Program",
		leftButton: {
			eventHandler: this.cancel,
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: $.proxy(this.save, this),
			style: "blueButton",
			label: "Save"
		}
	};

	// Set the program details
	$("#programName").val(this.listItem.program.programName);
};

/**
 * @memberof ProgramController
 * @this ProgramController
 * @instance
 * @method save
 * @desc Saves the program details to the database and returns to the previous view
 */
ProgramController.prototype.save = function() {
	"use strict";

	// Get the program details
	this.listItem.program.setProgramName($("#programName").val());

	// Update the database
	this.listItem.program.save();

	// If a new program was added, scroll the Programs view to the end of the list to reveal the new item
	if (isNaN(this.listItem.listIndex) || this.listItem.listIndex < 0) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}

	// Pop the view off the stack
	appController.popView(this.listItem);
};

/**
 * @memberof ProgramController
 * @this ProgramController
 * @instance
 * @method cancel
 * @desc Pops the view off the stack
 */
ProgramController.prototype.cancel = function() {
	"use strict";

	appController.popView();
};
