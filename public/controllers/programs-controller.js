/**
 * @file (Controllers) ProgramsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class ProgramsController
 * @classdesc Controller for the programs view
 * @property {HeaderFooter} header - the view header bar
 * @property {List} programList - the list of programs to display
 * @property {HeaderFooter} footer - the view footer bar
 * @this ProgramsController
 * @constructor
 */
var ProgramsController = function () {
	"use strict";
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
ProgramsController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Programs",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Schedule"
		},
		rightButton: {
			eventHandler: this.addItem,
			style: "toolButton",
			label: "+"
		}
	};

	// Instantiate a List object
	this.programList = new List("list", "views/programListTemplate.html", "programGroup", [], $.proxy(this.viewItem, this), $.proxy(this.editItem, this), $.proxy(this.deleteItem, this));

	// Get the list of programs
	Program.list($.proxy(this.listRetrieved, this));
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method activate
 * @desc Activates the controller
 * @param {ProgramListItem} [listItem] - a list item that was just added/edited in the Program view
 */
ProgramsController.prototype.activate = function(listItem) {
	"use strict";

	// When returning from the Program view, we need to update the list with the new values
	if (listItem) {
		// If an existing program was edited, update the program details
		if (listItem.listIndex >= 0) {
			this.programList.items[listItem.listIndex] = listItem.program;
		} else {
			// Otherwise add the new program to the list
			this.programList.items.push(listItem.program);
		}
	}

	// Refresh the list
	this.programList.refresh();

	// Set to view mode
	this.viewItems();
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method listRetrieved
 * @desc Callback function after the list of programs is retrieved
 * @param {Array<Program>} programList - array of program objects
 */
ProgramsController.prototype.listRetrieved = function(programList) {
	"use strict";

	// Set the list items
	this.programList.items = programList;

	// Activate the controller
	this.activate();
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method goBack
 * @desc Pops the view off the stack
 */
ProgramsController.prototype.goBack = function() {
	"use strict";

	appController.popView();
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method viewItem
 * @desc Displays the SeriesList view for a program
 * @param {Number} itemIndex - the list index of the program to view
 */
ProgramsController.prototype.viewItem = function(itemIndex) {
	"use strict";

	appController.pushView("seriesList", { listIndex: itemIndex, program: this.programList.items[itemIndex] });
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method addItem
 * @desc Displays the Program view for adding a program
 */
ProgramsController.prototype.addItem = function() {
	"use strict";

	appController.pushView("program");
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method editItem
 * @desc Displays the Program view for editing a program
 * @param {Number} itemIndex - the list index of the program to edit
 */
ProgramsController.prototype.editItem = function(itemIndex) {
	"use strict";

	appController.pushView("program", { listIndex: itemIndex, program: this.programList.items[itemIndex] });
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method deleteItem
 * @desc Deletes a program from the list
 * @param {Number} itemIndex - the list index of the program to delete
 */
ProgramsController.prototype.deleteItem = function(itemIndex) {
	"use strict";

	// Remove the item from the database
	this.programList.items[itemIndex].remove();

	// Remove the item from the list
	this.programList.items.splice(itemIndex,1);

	// Refresh the list
	this.programList.refresh();
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method deleteItems
 * @desc Sets the list to delete mode
 */
ProgramsController.prototype.deleteItems = function() {
	"use strict";

	// Set the list to delete mode
	this.programList.setAction("delete");

	// Hide the scroll helper and clear the view footer
	appController.hideScrollHelper();
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
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method editItems
 * @desc Sets the list to edit mode
 */
ProgramsController.prototype.editItems = function() {
	"use strict";

	// Set the list to edit mode
	this.programList.setAction("edit");

	// Hide the scroll helper and clear the view footer
	appController.hideScrollHelper();
	appController.clearFooter();

	// Show the edit icons next to each list item
	$("#list")
		.removeClass()
		.addClass("edit");

	// Setup the footer
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.viewItems, this),
			style: "blueButton",
			label: "Done"
		}
	};

	// Set the view footer
	appController.setFooter();
};

/**
 * @memberof ProgramsController
 * @this ProgramsController
 * @instance
 * @method viewItems
 * @desc Sets the list to view mode
 */
ProgramsController.prototype.viewItems = function() {
	"use strict";

	// Set the list to view mode
	this.programList.setAction("view");

	// Show the scroll helper and clear the view footer
	appController.showScrollHelper();
	appController.clearFooter();

	// Hide the icons next to each list item, in lieu of the scroll helper
	$("#list")
		.removeClass()
		.addClass("withHelper");

	// Setup the footer
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.editItems, this),
			style: "toolButton",
			label: "Edit"
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
