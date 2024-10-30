import type { NavButtonEventHandler, ReportDataSource } from "~/controllers";
import Series from "~/models/series-model";
import SettingsView from "~/views/settings-view.html";
import ViewController from "~/controllers/view-controller";

export default class SettingsController extends ViewController {
	public get view(): string {
		return SettingsView;
	}

	// DOM selectors
	private get aboutRow(): HTMLDivElement {
		return document.querySelector("#aboutRow") as HTMLDivElement;
	}

	private get loginRow(): HTMLDivElement {
		return document.querySelector("#loginRow") as HTMLDivElement;
	}

	private get recordedReportRow(): HTMLDivElement {
		return document.querySelector("#recordedReportRow") as HTMLDivElement;
	}

	private get expectedReportRow(): HTMLDivElement {
		return document.querySelector("#expectedReportRow") as HTMLDivElement;
	}

	private get missedReportRow(): HTMLDivElement {
		return document.querySelector("#missedReportRow") as HTMLDivElement;
	}

	private get incompleteReportRow(): HTMLDivElement {
		return document.querySelector("#incompleteReportRow") as HTMLDivElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Settings",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Schedule",
			},
		};

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Bind events for all of the buttons/controls
		this.aboutRow.addEventListener("click", this.viewAbout.bind(this));
		this.loginRow.addEventListener("click", this.viewLogin.bind(this));
		this.recordedReportRow.addEventListener(
			"click",
			this.viewRecordedReport.bind(this),
		);
		this.expectedReportRow.addEventListener(
			"click",
			this.viewExpectedReport.bind(this),
		);
		this.missedReportRow.addEventListener(
			"click",
			this.viewMissedReport.bind(this),
		);
		this.incompleteReportRow.addEventListener(
			"click",
			this.viewIncompleteReport.bind(this),
		);

		return Promise.resolve();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewAbout(): Promise<void> {
		return this.appController.pushView("about");
	}

	private async viewLogin(): Promise<void> {
		return this.appController.pushView("login");
	}

	private async viewRecordedReport(): Promise<void> {
		return this.appController.pushView("report", {
			reportName: "All Recorded",
			dataSource: Series.listByStatus.bind(Series) as ReportDataSource,
			args: "recorded",
		});
	}

	private async viewExpectedReport(): Promise<void> {
		return this.appController.pushView("report", {
			reportName: "All Expected",
			dataSource: Series.listByStatus.bind(Series) as ReportDataSource,
			args: "expected",
		});
	}

	private async viewMissedReport(): Promise<void> {
		return this.appController.pushView("report", {
			reportName: "All Missed",
			dataSource: Series.listByStatus.bind(Series) as ReportDataSource,
			args: "missed",
		});
	}

	private async viewIncompleteReport(): Promise<void> {
		return this.appController.pushView("report", {
			reportName: "All Incomplete",
			dataSource: Series.incomplete.bind(Series) as ReportDataSource,
		});
	}
}
