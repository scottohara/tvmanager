/**
 * @file (Controllers) ProgramsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		'components/list',
		'models/program-model',
		'controllers/application-controller',
		'framework/jquery'
	],

	/**
	 * @exports controllers/programs-controller
	 */
	function(List, Program, ApplicationController, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class ProgramsController
		 * @classdesc Controller for the programs view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {List} programList - the list of programs to display
		 * @property {HeaderFooter} footer - the view footer bar
		 * @this ProgramsController
		 * @constructor ProgramsController
		 */
		var ProgramsController = function () {
		};

		/**
		 * @memberof ProgramsController
		 * @this ProgramsController
		 * @instance
		 * @method setup
		 * @desc Initialises the controller
		 */
		ProgramsController.prototype.setup = function() {
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
					style: "confirmButton",
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
					style: "confirmButton",
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
					label: "Edit"
				},
				rightButton: {
					eventHandler: $.proxy(this.deleteItems, this),
					style: "cautionButton",
					label: "Delete"
				}
			};

			// Set the view footer
			appController.setFooter();
		};

		return ProgramsController;
	}
);
