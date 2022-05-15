import type {
	NavButtonEventHandler,
	ReportDataSource
} from "controllers";
import $ from "jquery";
import Series from "models/series-model";
import SettingsView from "views/settings-view.html";
import ViewController from "controllers/view-controller";

export default class SettingsController extends ViewController {
	public get view(): string {
		return SettingsView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Settings",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Schedule"
			}
		};

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Bind events for all of the buttons/controls
		$("#dataSyncRow").on("click", this.viewDataSync.bind(this));
		$("#aboutRow").on("click", this.viewAbout.bind(this));
		$("#recordedReportRow").on("click", this.viewRecordedReport.bind(this));
		$("#expectedReportRow").on("click", this.viewExpectedReport.bind(this));
		$("#missedReportRow").on("click", this.viewMissedReport.bind(this));
		$("#incompleteReportRow").on("click", this.viewIncompleteReport.bind(this));

		return Promise.resolve();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewDataSync(): Promise<void> {
		return this.appController.pushView("dataSync");
	}

	private async viewAbout(): Promise<void> {
		return this.appController.pushView("about");
	}

	private async viewRecordedReport(): Promise<void> {
		return this.appController.pushView("report", { reportName: "All Recorded", dataSource: Series.listByStatus.bind(Series) as ReportDataSource, args: "Recorded" });
	}

	private async viewExpectedReport(): Promise<void> {
		return this.appController.pushView("report", { reportName: "All Expected", dataSource: Series.listByStatus.bind(Series) as ReportDataSource, args: "Expected" });
	}

	private async viewMissedReport(): Promise<void> {
		return this.appController.pushView("report", { reportName: "All Missed", dataSource: Series.listByStatus.bind(Series) as ReportDataSource, args: "Missed" });
	}

	private async viewIncompleteReport(): Promise<void> {
		return this.appController.pushView("report", { reportName: "All Incomplete", dataSource: Series.listByIncomplete.bind(Series) as ReportDataSource });
	}
}