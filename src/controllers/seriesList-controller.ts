import type { NavButtonEventHandler, ProgramListItem } from "~/controllers";
import List from "~/components/list";
import type { PublicInterface } from "~/global";
import Series from "~/models/series-model";
import SeriesListTemplate from "~/views/seriesListTemplate.html";
import SeriesListView from "~/views/seriesList-view.html";
import ViewController from "~/controllers/view-controller";

export default class SeriesListController extends ViewController {
	private seriesList!: PublicInterface<List>;

	private activeListItem: PublicInterface<Series> | null = null;

	public constructor(private readonly listItem: ProgramListItem) {
		super();
	}

	public get view(): string {
		return SeriesListView;
	}

	// DOM selectors
	private get list(): HTMLUListElement {
		return document.querySelector("#list") as HTMLUListElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: String(this.listItem.program.programName),
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Programs",
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+",
			},
		};

		// Instantiate a List object
		this.seriesList = new List(
			"list",
			SeriesListTemplate,
			null,
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
			// Get the list of series for the specified program
			this.seriesList.items = await Series.list(
				Number(this.listItem.program.id),
			);

			// Refresh the list
			this.seriesList.refresh();

			// Set to view mode
			this.viewItems();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	public override contentShown(): void {
		// If there is an active list item, scroll it into view
		if (
			null !== this.activeListItem &&
			this.list.querySelector(`#item-${this.activeListItem.id}`)
		) {
			this.seriesList.scrollTo(String(this.activeListItem.id));
		}
	}

	private async goBack(): Promise<void> {
		return this.appController.popView(this.listItem);
	}

	private async viewItem(listIndex: number): Promise<void> {
		this.activeListItem = this.seriesList.items[listIndex] as Series;

		// Display the Episodes view
		return this.appController.pushView("episodes", {
			listIndex,
			series: this.activeListItem,
		});
	}

	private async addItem(): Promise<void> {
		return this.appController.pushView("series", {
			program: this.listItem.program,
			sequence: this.seriesList.items.length,
		});
	}

	private async editItem(listIndex: number): Promise<void> {
		this.activeListItem = this.seriesList.items[listIndex] as Series;

		// Display the Series view
		return this.appController.pushView("series", {
			listIndex,
			series: this.activeListItem,
		});
	}

	private async deleteItem(listIndex: number): Promise<void> {
		try {
			const series = this.seriesList.items[listIndex] as Series;

			// Remove the item from the database
			await series.remove();

			// Remove the item from the list
			this.seriesList.items.splice(listIndex, 1);

			// Refresh the list
			this.seriesList.refresh();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private deleteItems(): void {
		// Set the list to delete mode
		this.seriesList.setAction("delete");

		// Clear the view footer
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
		this.seriesList.setAction("edit");

		// Clear the view footer
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
		this.seriesList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		this.list.className = "";

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
