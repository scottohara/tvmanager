import type {
	NavButton,
	NavButtonEventHandler,
	Report
} from "controllers";
import $ from "jquery";
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
		interface Scenario {
			description: string;
			id: string;
			handler: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "data sync",
				id: "dataSyncRow",
				handler: "viewDataSync"
			},
			{
				description: "about",
				id: "aboutRow",
				handler: "viewAbout"
			},
			{
				description: "recorded report",
				id: "recordedReportRow",
				handler: "viewRecordedReport"
			},
			{
				description: "expected report",
				id: "expectedReportRow",
				handler: "viewExpectedReport"
			},
			{
				description: "missed report",
				id: "missedReportRow",
				handler: "viewMissedReport"
			},
			{
				description: "incomplete report",
				id: "incompleteReportRow",
				handler: "viewIncompleteReport"
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			it(`should attach a ${scenario.description} click event handler`, async (): Promise<void> => {
				const handler = sinon.stub(settingsController, scenario.handler as keyof SettingsController),
							element: JQuery = $("<div>")
								.attr("id", scenario.id)
								.appendTo(document.body);

				await settingsController.activate();
				element.trigger("click");
				handler.should.have.been.called;
				element.remove();
			});
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