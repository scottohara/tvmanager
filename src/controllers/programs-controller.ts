import List from "~/components/list";
import type { NavButtonEventHandler } from "~/controllers";
import Program from "~/models/program-model";
import ProgramListTemplate from "~/views/programListTemplate.html";
import ProgramsView from "~/views/programs-view.html";
import type { PublicInterface } from "~/global";
import ViewController from "~/controllers/view-controller";

export default class ProgramsController extends ViewController {
	private programList!: PublicInterface<List>;

	private activeListItem: PublicInterface<Program> | null = null;

	public get view(): string {
		return ProgramsView;
	}

	// DOM selectors
	private get list(): HTMLUListElement {
		return document.querySelector("#list") as HTMLUListElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Programs",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Schedule",
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+",
			},
		};

		// Instantiate a List object
		this.programList = new List(
			"list",
			ProgramListTemplate,
			"programGroup",
			[],
			this.viewItem.bind(this),
			this.editItem.bind(this),
			this.deleteItem.bind(this),
		);

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		try {
			// Get the list of programs
			this.programList.items = await Program.list();

			// Refresh the list
			this.programList.refresh();

			// Set to view mode
			this.viewItems();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	public override contentShown(): void {
		// If there is an active list item, scroll it into view
		if (null !== this.activeListItem) {
			this.programList.scrollTo(String(this.activeListItem.id));
		}
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewItem(listIndex: number): Promise<void> {
		this.activeListItem = this.programList.items[listIndex] as Program;

		return this.appController.pushView("seriesList", {
			listIndex,
			program: this.activeListItem,
		});
	}

	private async addItem(): Promise<void> {
		return this.appController.pushView("program");
	}

	private async editItem(listIndex: number): Promise<void> {
		this.activeListItem = this.programList.items[listIndex] as Program;

		return this.appController.pushView("program", {
			listIndex,
			program: this.activeListItem,
		});
	}

	private async deleteItem(listIndex: number): Promise<void> {
		try {
			// Remove the item from the database
			await (this.programList.items[listIndex] as Program).remove();

			// Remove the item from the list
			this.programList.items.splice(listIndex, 1);

			// Refresh the list
			this.programList.refresh();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private deleteItems(): void {
		// Set the list to delete mode
		this.programList.setAction("delete");

		// Hide the list index and clear the view footer
		this.programList.hideIndex();
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		this.list.className = "";
		this.list.classList.add("delete");

		// Setup the footer
		this.footer = {
			rightButton: {
				eventHandler: this.viewItems.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Done",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}

	private editItems(): void {
		// Set the list to edit mode
		this.programList.setAction("edit");

		// Hide the list index and clear the view footer
		this.programList.hideIndex();
		this.appController.clearFooter();

		// Show the edit icons next to each list item
		this.list.className = "";
		this.list.classList.add("edit");

		// Setup the footer
		this.footer = {
			leftButton: {
				eventHandler: this.viewItems.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Done",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}

	private viewItems(): void {
		// Set the list to view mode
		this.programList.setAction("view");

		// Show the list index and clear the view footer
		this.programList.showIndex();
		this.appController.clearFooter();

		// Hide the icons next to each list item, in lieu of the scroll helper
		this.list.className = "";
		this.list.classList.add("withHelper");

		// Setup the footer
		this.footer = {
			leftButton: {
				eventHandler: this.editItems.bind(this) as NavButtonEventHandler,
				label: "Edit",
			},
			rightButton: {
				eventHandler: this.deleteItems.bind(this) as NavButtonEventHandler,
				style: "cautionButton",
				label: "Delete",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}
}
