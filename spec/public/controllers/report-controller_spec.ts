import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	Report
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ListMock from "mocks/list-mock";
import ReportController from "controllers/report-controller";
import ReportView from "views/report-view.html";
import SeriesMock from "mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("ReportController", (): void => {
	let args: string,
			items: SeriesMock[],
			report: Report,
			reportController: ReportController;

	beforeEach((): void => {
		args = "test-args";
		items = [
			new SeriesMock(null, "test-item-1", null, null),
			new SeriesMock(null, "test-item-2", null, null)
		];
		report = {
			reportName: "test-report",
			dataSource: sinon.stub().returns(items),
			args
		};

		reportController = new ReportController(report);
	});

	describe("object constructor", (): void => {
		it("should return a ReportController instance", (): Chai.Assertion => reportController.should.be.an.instanceOf(ReportController));
		it("should set the report", (): Chai.Assertion => reportController["report"].should.deep.equal(report));
	});

	describe("view", (): void => {
		it("should return the report view", (): Chai.Assertion => reportController.view.should.equal(ReportView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(reportController, "viewItem" as keyof ReportController);
			sinon.stub(reportController, "goBack" as keyof ReportController);
			sinon.stub(reportController, "activate");
			await reportController.setup();
			leftButton = reportController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(reportController.header.label).should.equal(report.reportName));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			reportController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Settings"));

		it("should attach a view event handler to the report list", (): void => {
			(reportController["reportList"] as ListMock).viewEventHandler(0);
			reportController["viewItem"].should.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion => reportController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(reportController, "viewItems" as keyof ReportController);
			reportController["reportList"] = new ListMock("", "", "", []);
			await reportController.activate();
		});

		it("should get the list for the report", (): void => {
			report.dataSource.should.have.been.calledWith(report.args);
			reportController["reportList"].items.should.deep.equal(items);
		});

		it("should refresh the list", (): Chai.Assertion => reportController["reportList"].refresh.should.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => reportController["viewItems"].should.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await reportController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		it("should push the episodes view for the selected item", async (): Promise<void> => {
			const index = 0;

			reportController["reportList"] = new ListMock("", "", "", items);
			await reportController["viewItem"](index);
			appController.pushView.should.have.been.calledWith("episodes", {
				source: "Report",
				listIndex: index,
				series: items[index]
			});
		});
	});

	describe("viewItems", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(reportController, "activate");
			await reportController.setup();
			await reportController["viewItems"]();
		});

		it("should set the list to view mode", (): Chai.Assertion => (reportController["reportList"] as ListMock).action.should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);
		it("should set the footer label", (): Chai.Assertion => String((reportController.footer as HeaderFooter).label).should.equal("v1"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});
});