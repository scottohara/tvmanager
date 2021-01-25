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
import {
	NavButtonEventHandler,
	ProgramListItem
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import Program from "models/program-model";
import ProgramListTemplate from "views/programListTemplate.html";
import ProgramsView from "views/programs-view.html";
import { PublicInterface } from "global";
import ViewController from "controllers/view-controller";

/**
 * @class ProgramsController
 * @classdesc Controller for the programs view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {List} programList - the list of programs to display
 * @property {Program} activeListItem - active list item being added or edited
 * @property {HeaderFooter} footer - the view footer bar
 */
export default class ProgramsController extends ViewController {
	private programList!: PublicInterface<List>;

	private activeListItem: PublicInterface<Program> | null = null;

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return ProgramsView;
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Programs",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Schedule"
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+"
			}
		};

		// Instantiate a List object
		this.programList = new List("list", ProgramListTemplate, "programGroup", [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));

		// Get the list of programs
		return this.listRetrieved(await Program.list());
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 * @param {ProgramListItem} [listItem] - a list item that was just added/edited in the Program view
	 */
	public async activate(listItem?: ProgramListItem): Promise<void> {
		// When returning from the Program view, we need to update the list with the new values
		if (undefined !== listItem) {
			// If an existing program was edited, update the program details
			if (Number(listItem.listIndex) >= 0) {
				this.programList.items[Number(listItem.listIndex)] = listItem.program;
			} else {
				// Otherwise add the new program to the list
				this.programList.items.push(listItem.program);
			}

			// In case of any changes, resort the list
			this.programList.items = this.programList.items.sort((a: Program, b: Program): number => String(a.programName).localeCompare(String(b.programName)));
		}

		// Refresh the list
		this.programList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method contentShown
	 * @desc "Called after the controller content is visible"
	 */
	public contentShown(): void {
		// If there is an active list item, scroll it into view
		if (null !== this.activeListItem) {
			this.programList.scrollTo(String(this.activeListItem.id));
		}
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method listRetrieved
	 * @desc Called after the list of programs is retrieved
	 * @param {Array<Program>} programList - array of program objects
	 */
	private async listRetrieved(programList: PublicInterface<Program>[]): Promise<void> {
		// Set the list items
		this.programList.items = programList;

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method viewItem
	 * @desc Displays the SeriesList view for a program
	 * @param {Number} listIndex - the list index of the program to view
	 */
	private async viewItem(listIndex: number): Promise<void> {
		this.activeListItem = this.programList.items[listIndex] as Program;

		return this.appController.pushView("seriesList", { listIndex, program: this.activeListItem });
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method addItem
	 * @desc Displays the Program view for adding a program
	 */
	private async addItem(): Promise<void> {
		return this.appController.pushView("program");
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method editItem
	 * @desc Displays the Program view for editing a program
	 * @param {Number} listIndex - the list index of the program to edit
	 */
	private async editItem(listIndex: number): Promise<void> {
		this.activeListItem = this.programList.items[listIndex] as Program;

		return this.appController.pushView("program", { listIndex, program: this.activeListItem });
	}

	/**
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method deleteItem
	 * @desc Deletes a program from the list
	 * @param {Number} listIndex - the list index of the program to delete
	 */
	private async deleteItem(listIndex: number): Promise<void> {
		// Remove the item from the database
		await (this.programList.items[listIndex] as Program).remove();

		// Remove the item from the list
		this.programList.items.splice(listIndex, 1);

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
	private async deleteItems(): Promise<void> {
		// Set the list to delete mode
		this.programList.setAction("delete");

		// Hide the list index and clear the view footer
		this.programList.hideIndex();
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
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method editItems
	 * @desc Sets the list to edit mode
	 */
	private async editItems(): Promise<void> {
		// Set the list to edit mode
		this.programList.setAction("edit");

		// Hide the list index and clear the view footer
		this.programList.hideIndex();
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
	 * @memberof ProgramsController
	 * @this ProgramsController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.programList.setAction("view");

		// Show the list index and clear the view footer
		this.programList.showIndex();
		this.appController.clearFooter();

		// Hide the icons next to each list item, in lieu of the scroll helper
		$("#list")
			.removeClass()
			.addClass("withHelper");

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