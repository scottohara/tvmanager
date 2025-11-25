import type {
	NavButton,
	NavButtonEventHandler,
	ReportConfig,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import SeriesMock from "~/mocks/series-model-mock";
import SettingsController from "~/controllers/settings-controller";
import SettingsView from "~/views/settings-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("SettingsController", (): void => {
	interface ReportType {
		description: string;
		viewArgs: ReportConfig;
	}

	type ReportHandler =
		| "viewExpectedReport"
		| "viewIncompleteReport"
		| "viewMissedReport"
		| "viewRecordedReport";

	const reports: ReportType[] = [
		{
			description: "Recorded",
			viewArgs: {
				reportName: "All Recorded",
				dataSource: SeriesMock.listByStatus,
				args: "recorded",
			},
		},
		{
			description: "Expected",
			viewArgs: {
				reportName: "All Expected",
				dataSource: SeriesMock.listByStatus,
				args: "expected",
			},
		},
		{
			description: "Missed",
			viewArgs: {
				reportName: "All Missed",
				dataSource: SeriesMock.listByStatus,
				args: "missed",
			},
		},
		{
			description: "Incomplete",
			viewArgs: {
				reportName: "All Incomplete",
				dataSource: SeriesMock.incomplete,
			},
		},
	];

	let settingsController: SettingsController;

	beforeEach((): void => {
		settingsController = new SettingsController();
	});

	describe("object constructor", (): void => {
		it("should return a SettingsController instance", (): Chai.Assertion =>
			expect(settingsController).to.be.an.instanceOf(SettingsController));
	});

	describe("view", (): void => {
		it("should return the settings view", (): Chai.Assertion =>
			expect(settingsController.view).to.equal(SettingsView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(settingsController, "goBack" as keyof SettingsController);
			sinon.stub(settingsController, "activate");
			await settingsController.setup();
			leftButton = settingsController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(settingsController.header.label)).to.equal("Settings"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(settingsController["goBack"]).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Schedule"));

		it("should activate the controller", (): Chai.Assertion =>
			expect(settingsController["activate"]).to.have.been.called);
	});

	describe("activate", (): void => {
		let aboutRow: HTMLDivElement,
			loginRow: HTMLDivElement,
			recordedReportRow: HTMLDivElement,
			expectedReportRow: HTMLDivElement,
			missedReportRow: HTMLDivElement,
			incompleteReportRow: HTMLDivElement;

		beforeEach(async (): Promise<void> => {
			aboutRow = document.createElement("div");
			aboutRow.id = "aboutRow";

			loginRow = document.createElement("div");
			loginRow.id = "loginRow";

			recordedReportRow = document.createElement("div");
			recordedReportRow.id = "recordedReportRow";

			expectedReportRow = document.createElement("div");
			expectedReportRow.id = "expectedReportRow";

			missedReportRow = document.createElement("div");
			missedReportRow.id = "missedReportRow";

			incompleteReportRow = document.createElement("div");
			incompleteReportRow.id = "incompleteReportRow";

			document.body.append(
				aboutRow,
				loginRow,
				recordedReportRow,
				expectedReportRow,
				missedReportRow,
				incompleteReportRow,
			);

			sinon.stub(settingsController, "viewAbout" as keyof SettingsController);
			sinon.stub(settingsController, "viewLogin" as keyof SettingsController);
			sinon.stub(
				settingsController,
				"viewRecordedReport" as keyof SettingsController,
			);
			sinon.stub(
				settingsController,
				"viewExpectedReport" as keyof SettingsController,
			);
			sinon.stub(
				settingsController,
				"viewMissedReport" as keyof SettingsController,
			);
			sinon.stub(
				settingsController,
				"viewIncompleteReport" as keyof SettingsController,
			);

			await settingsController.activate();
		});

		it("should attach an about click event handler", (): void => {
			aboutRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewAbout"]).to.have.been.called;
		});

		it("should attach a login click event handler", (): void => {
			loginRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewLogin"]).to.have.been.called;
		});

		it("should attach a recorded report click event handler", (): void => {
			recordedReportRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewRecordedReport"]).to.have.been.called;
		});

		it("should attach an expected report click event handler", (): void => {
			expectedReportRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewExpectedReport"]).to.have.been.called;
		});

		it("should attach a missed report click event handler", (): void => {
			missedReportRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewMissedReport"]).to.have.been.called;
		});

		it("should attach an incomplete report click event handler", (): void => {
			incompleteReportRow.dispatchEvent(new MouseEvent("click"));
			expect(settingsController["viewIncompleteReport"]).to.have.been.called;
		});

		afterEach((): void => {
			aboutRow.remove();
			loginRow.remove();
			recordedReportRow.remove();
			expectedReportRow.remove();
			missedReportRow.remove();
			incompleteReportRow.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await settingsController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewAbout", (): void => {
		it("should push the about view", async (): Promise<void> => {
			await settingsController["viewAbout"]();
			expect(appController.pushView).to.have.been.calledWith("about");
		});
	});

	describe("viewLogin", (): void => {
		it("should push the login view", async (): Promise<void> => {
			await settingsController["viewLogin"]();
			expect(appController.pushView).to.have.been.calledWith("login");
		});
	});

	reports.forEach((report: ReportType): void => {
		describe(`view${report.description}Report`, (): void => {
			it(`should push the ${report.description.toLowerCase()} report view`, async (): Promise<void> => {
				await settingsController[
					`view${report.description}Report` as ReportHandler
				]();
				expect(appController.pushView).to.have.been.calledWith(
					"report",
					sinon.match({
						reportName: report.viewArgs.reportName,
						dataSource: sinon.match.func,
						args: report.viewArgs.args,
					}),
				);
			});
		});
	});

	afterEach((): void => SeriesMock.reset());
});
