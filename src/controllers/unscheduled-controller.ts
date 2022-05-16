import DatabaseService from "services/database-service";
import Episode from "models/episode-model";
import List from "components/list";
import type { NavButtonEventHandler } from "controllers";
import type { PublicInterface } from "global";
import UnscheduledListTemplate from "views/unscheduledListTemplate.html";
import UnscheduledView from "views/unscheduled-view.html";
import ViewController from "controllers/view-controller";

export default class UnscheduledController extends ViewController {
	private unscheduledList!: PublicInterface<List>;

	public get view(): string {
		return UnscheduledView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Unscheduled",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Schedule"
			}
		};

		// Instantiate a List object
		this.unscheduledList = new List("list", UnscheduledListTemplate, null, [], this.viewItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Get the list of unscheduled episodes
		this.unscheduledList.items = await Episode.listByUnscheduled();

		// Refresh the list
		this.unscheduledList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episode", { listIndex, episode: this.unscheduledList.items[listIndex] as PublicInterface<Episode> });
	}

	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.unscheduledList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`
		};

		// Set the view footer
		this.appController.setFooter();
	}
}