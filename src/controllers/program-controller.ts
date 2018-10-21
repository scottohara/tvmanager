/**
 * @file (Controllers) ProgramController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/program-controller
 * @requires jquery
 * @requires models/program-model
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Program from "models/program-model";
import {ProgramListItem} from "controllers";
import ProgramView from "views/program-view.html";
import ViewController from "controllers/view-controller";

/**
 * @class ProgramController
 * @classdesc Controller for the program view
 * @extends ViewController
 * @this ProgramController
 * @property {ProgramListItem} listItem - a list item from the Programs view
 * @property {HeaderFooter} header - the view header bar
 * @param {ProgramListItem} listItem - a list item from the Programs view
 */
export default class ProgramController extends ViewController {
	private listItem: ProgramListItem;

	public constructor(listItem?: ProgramListItem) {
		super();

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
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return ProgramView;
	}

	/**
	 * @memberof ProgramController
	 * @this ProgramController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public setup(): void {
		// Setup the header
		this.header = {
			label: "Add/Edit Program",
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

		// Set the program details
		$("#programName").val(String(this.listItem.program.programName));
	}

	/**
	 * @memberof ProgramController
	 * @this ProgramController
	 * @instance
	 * @method save
	 * @desc Saves the program details to the database and returns to the previous view
	 */
	private save(): void {
		// Get the program details
		this.listItem.program.setProgramName(String($("#programName").val()));

		// Update the database and pop the view off the stack
		this.listItem.program.save((): void => this.appController.popView(this.listItem));
	}

	/**
	 * @memberof ProgramController
	 * @this ProgramController
	 * @instance
	 * @method cancel
	 * @desc Pops the view off the stack
	 */
	private cancel(): void {
		this.appController.popView();
	}
}