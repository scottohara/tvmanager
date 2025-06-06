import type { NavButtonEventHandler, Report } from "~/controllers";
import List from "~/components/list";
import type { PublicInterface } from "~/global";
import ReportListTemplate from "~/views/reportListTemplate.html";
import ReportView from "~/views/report-view.html";
import type Series from "~/models/series-model";
import ViewController from "~/controllers/view-controller";

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
				label: "Settings",
			},
		};

		// Instantiate a List object
		this.reportList = new List(
			"list",
			ReportListTemplate,
			null,
			[],
			this.viewItem.bind(this),
		);

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		try {
			// Get the data for the report
			this.reportList.items = await this.report.dataSource(this.report.args);

			// Refresh the list
			this.reportList.refresh();

			// Set to view mode
			this.viewItems();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episodes", {
			source: "Report",
			listIndex,
			series: this.reportList.items[listIndex] as PublicInterface<Series>,
		});
	}

	private viewItems(): void {
		// Set the list to view mode
		this.reportList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();
	}
}
