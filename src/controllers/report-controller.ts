import type {
	NavButtonEventHandler,
	Report
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import type { PublicInterface } from "global";
import ReportListTemplate from "views/reportListTemplate.html";
import ReportView from "views/report-view.html";
import type Series from "models/series-model";
import ViewController from "controllers/view-controller";

export default class ReportController extends ViewController {
	private reportList!: PublicInterface<List>;

	public constructor(private readonly report: Report) {
		super();
	}

	public get view(): string {
		return ReportView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: this.report.reportName,
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings"
			}
		};

		// Instantiate a List object
		this.reportList = new List("list", ReportListTemplate, null, [], this.viewItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Get the data for the report
		this.reportList.items = await this.report.dataSource(this.report.args);

		// Refresh the list
		this.reportList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episodes", { source: "Report", listIndex, series: this.reportList.items[listIndex] as PublicInterface<Series> });
	}

	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.reportList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		$("#list").removeClass();

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`
		};

		// Set the view footer
		this.appController.setFooter();
	}
}