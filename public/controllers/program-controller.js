/**
 * @file (Controllers) ProgramController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"models/program-model",
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports controllers/program-controller
	 */
	(Program, ApplicationController, $) => {
		"use strict";

		/**
		 * @class ProgramListItem
		 * @classdesc Anonymous object containing the properties of a program list item
		 * @private
		 * @property {Number} [listIndex] - the list index of a program being edited
		 * @property {Program} [program] - a program being edited
		 */

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class ProgramController
		 * @classdesc Controller for the program view
		 * @property {ProgramListItem} listItem - a list item from the Programs view
		 * @property {HeaderFooter} header - the view header bar
		 */
		class ProgramController {
			/**
			 * @constructor ProgramController
			 * @this ProgramController
			 * @param {ProgramListItem} listItem - a list item from the Programs view
			 */
			constructor(listItem) {
				// If a list item was passed, we're editing an existing program
				if (listItem) {
					this.listItem = listItem;
				} else {
					// Otherwise we're adding a new program
					this.listItem = {program: new Program(null, "", 0, 0, 0, 0, 0)};
				}
			}

			/**
			 * @memberof ProgramController
			 * @this ProgramController
			 * @instance
			 * @method setup
			 * @desc Initialises the controller
			 */
			setup() {
				// Setup the header
				this.header = {
					label: "Add/Edit Program",
					leftButton: {
						eventHandler: this.cancel,
						label: "Cancel"
					},
					rightButton: {
						eventHandler: this.save.bind(this),
						style: "confirmButton",
						label: "Save"
					}
				};

				// Set the program details
				$("#programName").val(this.listItem.program.programName);
			}

			/**
			 * @memberof ProgramController
			 * @this ProgramController
			 * @instance
			 * @method save
			 * @desc Saves the program details to the database and returns to the previous view
			 */
			save() {
				// Get the program details
				this.listItem.program.setProgramName($("#programName").val());

				// Update the database
				this.listItem.program.save();

				// Pop the view off the stack
				appController.popView(this.listItem);
			}

			/**
			 * @memberof ProgramController
			 * @this ProgramController
			 * @instance
			 * @method cancel
			 * @desc Pops the view off the stack
			 */
			cancel() {
				appController.popView();
			}
		}

		return ProgramController;
	}
);
