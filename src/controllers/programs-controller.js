/**
 * @file (Controllers) ProgramsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/programs-controller
 * @requires jquery
 * @requires components/list
 * @requires models/program-model
 * @requires controllers/view-controller
 */
import $ from "jquery";
import List from "components/list";
import Program from "models/program-model";
import ProgramListTemplate from "views/programListTemplate.html";
import ProgramsView from "views/programs-view.html";
import ViewController from "controllers/view-controller";
import window from "components/window";

/**
 * @class ProgramsController
 * @classdesc Controller for the programs view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {List} programList - the list of programs to display
 * @property {String} origProgramName - the program name before editing
 * @property {HeaderFooter} footer - the view footer bar
 */
export default class ProgramsController extends ViewController {
	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	get view() {
		return ProgramsView;
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	setup() {
		// Setup the header
		this.header = {
			label: "Programs",
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: "Schedule"
			},
			rightButton: {
				eventHandler: this.addItem.bind(this),
				label: "+"
			}
		};

		// Instantiate a List object
		this.programList = new List("list", ProgramListTemplate, "programGroup", [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));

		// Get the list of programs
		Program.list(this.listRetrieved.bind(this));
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 * @param {ProgramListItem} [listItem] - a list item that was just added/edited in the Program view
	 */
	activate(listItem) {
		let listResort = false;

		// When returning from the Program view, we need to update the list with the new values
		if (listItem) {
			// If an existing program was edited, update the program details
			if (listItem.listIndex >= 0) {
				// If the program name has changed, we will need to resort the list and scroll to the new position
				if (listItem.program.programName !== this.origProgramName) {
					listResort = true;
				}

				this.programList.items[listItem.listIndex] = listItem.program;
			} else {
				// Otherwise add the new program to the list
				this.programList.items.push(listItem.program);
				listResort = true;
			}

			// If necessary, resort the list
			if (listResort) {
				this.programList.items = this.programList.items.sort((a, b) => a.programName.localeCompare(b.programName));
			}
		}

		// Refresh the list
		this.programList.refresh();

		// If necessary, scroll the list item into view
		if (listResort) {
			const DELAY_MS = 300;

			window.setTimeout(() => this.programList.scrollTo(listItem.program.id), DELAY_MS);
		}

		// Set to view mode
		this.viewItems();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method listRetrieved
	 * @desc Callback function after the list of programs is retrieved
	 * @param {Array<Program>} programList - array of program objects
	 */
	listRetrieved(programList) {
		// Set the list items
		this.programList.items = programList;

		// Activate the controller
		this.activate();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	goBack() {
		this.appController.popView();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method viewItem
	 * @desc Displays the SeriesList view for a program
	 * @param {Number} itemIndex - the list index of the program to view
	 */
	viewItem(itemIndex) {
		// Save the current program details
		this.origProgramName = this.programList.items[itemIndex].programName;
		this.appController.pushView("seriesList", {listIndex: itemIndex, program: this.programList.items[itemIndex]});
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method addItem
	 * @desc Displays the Program view for adding a program
	 */
	addItem() {
		this.appController.pushView("program");
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method editItem
	 * @desc Displays the Program view for editing a program
	 * @param {Number} itemIndex - the list index of the program to edit
	 */
	editItem(itemIndex) {
		// Save the current program details
		this.origProgramName = this.programList.items[itemIndex].programName;
		this.appController.pushView("program", {listIndex: itemIndex, program: this.programList.items[itemIndex]});
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method deleteItem
	 * @desc Deletes a program from the list
	 * @param {Number} itemIndex - the list index of the program to delete
	 */
	deleteItem(itemIndex) {
		// Remove the item from the database
		this.programList.items[itemIndex].remove();

		// Remove the item from the list
		this.programList.items.splice(itemIndex, 1);

		// Refresh the list
		this.programList.refresh();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method deleteItems
	 * @desc Sets the list to delete mode
	 */
	deleteItems() {
		// Set the list to delete mode
		this.programList.setAction("delete");

		// Hide the scroll helper and clear the view footer
		this.appController.hideScrollHelper();
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		$("#list")
			.removeClass()
			.addClass("delete");

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			rightButton: {
				eventHandler: this.viewItems.bind(this),
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method editItems
	 * @desc Sets the list to edit mode
	 */
	editItems() {
		// Set the list to edit mode
		this.programList.setAction("edit");

		// Hide the scroll helper and clear the view footer
		this.appController.hideScrollHelper();
		this.appController.clearFooter();

		// Show the edit icons next to each list item
		$("#list")
			.removeClass()
			.addClass("edit");

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			leftButton: {
				eventHandler: this.viewItems.bind(this),
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	viewItems() {
		// Set the list to view mode
		this.programList.setAction("view");

		// Show the scroll helper and clear the view footer
		this.appController.showScrollHelper();
		this.appController.clearFooter();

		// Hide the icons next to each list item, in lieu of the scroll helper
		$("#list")
			.removeClass()
			.addClass("withHelper");

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			leftButton: {
				eventHandler: this.editItems.bind(this),
				label: "Edit"
			},
			rightButton: {
				eventHandler: this.deleteItems.bind(this),
				style: "cautionButton",
				label: "Delete"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}