import type {
	NavButtonEventHandler,
	ProgramListItem
} from "controllers";
import Program from "models/program-model";
import ProgramView from "views/program-view.html";
import ViewController from "controllers/view-controller";

export default class ProgramController extends ViewController {
	private readonly listItem: ProgramListItem;

	public constructor(listItem?: ProgramListItem) {
		super();

		// If a list item was passed, we're editing an existing program, otherwise we're adding a new program
		this.listItem = listItem ?? { program: new Program(null, "", 0, 0, 0, 0, 0) };
	}

	public get view(): string {
		return ProgramView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Program",
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

		// Set the program details
		this.programName.value = String(this.listItem.program.programName);

		return Promise.resolve();
	}

	private async save(): Promise<void> {
		// Get the program details
		this.listItem.program.programName = this.programName.value;

		// Update the database and pop the view off the stack
		await this.listItem.program.save();

		return this.appController.popView(this.listItem);
	}

	private async cancel(): Promise<void> {
		return this.appController.popView();
	}

	// DOM selectors
	private get programName(): HTMLInputElement {
		return document.querySelector("#programName") as HTMLInputElement;
	}
}