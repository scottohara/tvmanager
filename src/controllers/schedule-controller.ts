import DatabaseService from "services/database-service";
import List from "components/list";
import type { NavButtonEventHandler } from "controllers";
import type { PublicInterface } from "global";
import ScheduleListTemplate from "views/scheduleListTemplate.html";
import ScheduleView from "views/schedule-view.html";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

export default class ScheduleController extends ViewController {
	private scheduleList!: PublicInterface<List>;

	public get view(): string {
		return ScheduleView;
	}

	// DOM selectors
	private get list(): HTMLUListElement {
		return document.querySelector("#list") as HTMLUListElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Schedule",
			leftButton: {
				eventHandler: this.viewUnscheduled.bind(this) as NavButtonEventHandler,
				label: "Unscheduled"
			},
			rightButton: {
				eventHandler: this.viewPrograms.bind(this) as NavButtonEventHandler,
				label: "Programs"
			}
		};

		// Instantiate a List object
		this.scheduleList = new List("list", ScheduleListTemplate, "nowShowingDisplay", [], this.viewItem.bind(this), this.editItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Get the list of scheduled series
		this.scheduleList.items = await Series.listByNowShowing();

		// Refresh the list
		this.scheduleList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episodes", { source: "Schedule", listIndex, series: this.scheduleList.items[listIndex] as PublicInterface<Series> });
	}

	private async viewUnscheduled(): Promise<void> {
		return this.appController.pushView("unscheduled");
	}

	private async viewPrograms(): Promise<void> {
		return this.appController.pushView("programs");
	}

	private async viewSettings(): Promise<void> {
		return this.appController.pushView("settings");
	}

	private async editItem(listIndex: number): Promise<void> {
		const series = this.scheduleList.items[listIndex] as Series;

		// Display the Series view
		return this.appController.pushView("series", { listIndex, series });
	}

	private async editItems(): Promise<void> {
		// Set the list to edit mode
		this.scheduleList.setAction("edit");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the edit icons next to each list item
		this.list.className = "";
		this.list.classList.add("edit");

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

	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.scheduleList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		this.list.className = "";

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`,
			leftButton: {
				eventHandler: this.editItems.bind(this) as NavButtonEventHandler,
				label: "Edit"
			},
			rightButton: {
				eventHandler: this.viewSettings.bind(this) as NavButtonEventHandler,
				label: "Settings"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}