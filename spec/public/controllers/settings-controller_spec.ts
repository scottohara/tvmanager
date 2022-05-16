import type {
	NavButton,
	NavButtonEventHandler,
	Report
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import SeriesMock from "mocks/series-model-mock";
import SettingsController from "controllers/settings-controller";
import SettingsView from "views/settings-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("SettingsController", (): void => {
	interface ReportType {
		description: string;
		viewArgs: Report;
	}

	type ReportHandler = "viewExpectedReport" | "viewIncompleteReport" | "viewMissedReport" | "viewRecordedReport";

	const reports: ReportType[] = [
		{
			description: "Recorded",
			viewArgs: {
				reportName: "All Recorded",
				dataSource: SeriesMock.listByStatus,
				args: "Recorded"
			}
		},
		{
			description: "Expected",
			viewArgs: {
				reportName: "All Expected",
				dataSource: SeriesMock.listByStatus,
				args: "Expected"
			}
		},
		{
			description: "Missed",
			viewArgs: {
				reportName: "All Missed",
				dataSource: SeriesMock.listByStatus,
				args: "Missed"
			}
		},
		{
			description: "Incomplete",
			viewArgs: {
				reportName: "All Incomplete",
				dataSource: SeriesMock.listByIncomplete
			}
		}
	];

	let settingsController: SettingsController;

	beforeEach((): void => {
		settingsController = new SettingsController();
	});

	describe("object constructor", (): void => {
		it("should return a SettingsController instance", (): Chai.Assertion => settingsController.should.be.an.instanceOf(SettingsController));
	});

	describe("view", (): void => {
		it("should return the settings view", (): Chai.Assertion => settingsController.view.should.equal(SettingsView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(settingsController, "goBack" as keyof SettingsController);
			sinon.stub(settingsController, "activate");
			await settingsController.setup();
			leftButton = settingsController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(settingsController.header.label).should.equal("Settings"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			settingsController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Schedule"));

		it("should activate the controller", (): Chai.Assertion => settingsController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		let dataSyncRow: HTMLDivElement,
				aboutRow: HTMLDivElement,
				recordedReportRow: HTMLDivElement,
				expectedReportRow: HTMLDivElement,
				missedReportRow: HTMLDivElement,
				incompleteReportRow: HTMLDivElement;

		beforeEach(async (): Promise<void> => {
			dataSyncRow = document.createElement("div");
			dataSyncRow.id = "dataSyncRow";

			aboutRow = document.createElement("div");
			aboutRow.id = "aboutRow";

			recordedReportRow = document.createElement("div");
			recordedReportRow.id = "recordedReportRow";

			expectedReportRow = document.createElement("div");
			expectedReportRow.id = "expectedReportRow";

			missedReportRow = document.createElement("div");
			missedReportRow.id = "missedReportRow";

			incompleteReportRow = document.createElement("div");
			incompleteReportRow.id = "incompleteReportRow";

			document.body.append(dataSyncRow, aboutRow, recordedReportRow, expectedReportRow, missedReportRow, incompleteReportRow);

			sinon.stub(settingsController, "viewDataSync" as keyof SettingsController);
			sinon.stub(settingsController, "viewAbout" as keyof SettingsController);
			sinon.stub(settingsController, "viewRecordedReport" as keyof SettingsController);
			sinon.stub(settingsController, "viewExpectedReport" as keyof SettingsController);
			sinon.stub(settingsController, "viewMissedReport" as keyof SettingsController);
			sinon.stub(settingsController, "viewIncompleteReport" as keyof SettingsController);

			await settingsController.activate();
		});

		it("should attach a data sync click event handler", (): void => {
			dataSyncRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewDataSync"].should.have.been.called;
		});

		it("should attach an about click event handler", (): void => {
			aboutRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewAbout"].should.have.been.called;
		});

		it("should attach a recorded report click event handler", (): void => {
			recordedReportRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewRecordedReport"].should.have.been.called;
		});

		it("should attach an expected report click event handler", (): void => {
			expectedReportRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewExpectedReport"].should.have.been.called;
		});

		it("should attach a missed report click event handler", (): void => {
			missedReportRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewMissedReport"].should.have.been.called;
		});

		it("should attach an incomplete report click event handler", (): void => {
			incompleteReportRow.dispatchEvent(new MouseEvent("click"));
			settingsController["viewIncompleteReport"].should.have.been.called;
		});

		afterEach((): void => {
			dataSyncRow.remove();
			aboutRow.remove();
			recordedReportRow.remove();
			expectedReportRow.remove();
			missedReportRow.remove();
			incompleteReportRow.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await settingsController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewDataSync", (): void => {
		it("should push the data sync view", async (): Promise<void> => {
			await settingsController["viewDataSync"]();
			appController.pushView.should.have.been.calledWith("dataSync");
		});
	});

	describe("viewAbout", (): void => {
		it("should push the about view", async (): Promise<void> => {
			await settingsController["viewAbout"]();
			appController.pushView.should.have.been.calledWith("about");
		});
	});

	reports.forEach((report: ReportType): void => {
		describe(`view${report.description}Report`, (): void => {
			it(`should push the ${report.description.toLowerCase()} report view`, async (): Promise<void> => {
				await settingsController[`view${report.description}Report` as ReportHandler]();
				appController.pushView.should.have.been.calledWith("report", sinon.match({
					reportName: report.viewArgs.reportName,
					dataSource: sinon.match.func,
					args: report.viewArgs.args
				}));
			});
		});
	});
});