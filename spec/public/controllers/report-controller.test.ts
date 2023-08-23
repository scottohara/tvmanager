import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	Report
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import ListMock from "~/mocks/list-mock";
import ReportController from "~/controllers/report-controller";
import ReportView from "~/views/report-view.html";
import SeriesMock from "~/mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

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
		it("should return a ReportController instance", (): Chai.Assertion => expect(reportController).to.be.an.instanceOf(ReportController));
		it("should set the report", (): Chai.Assertion => expect(reportController["report"]).to.deep.equal(report));
	});

	describe("view", (): void => {
		it("should return the report view", (): Chai.Assertion => expect(reportController.view).to.equal(ReportView));
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

		it("should set the header label", (): Chai.Assertion => expect(String(reportController.header.label)).to.equal(report.reportName));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(reportController["goBack"]).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => expect(leftButton.label).to.equal("Settings"));

		it("should attach a view event handler to the report list", (): void => {
			(reportController["reportList"] as ListMock).viewEventHandler(0);
			expect(reportController["viewItem"]).to.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion => expect(reportController["activate"]).to.have.been.called);
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(reportController, "viewItems" as keyof ReportController);
			reportController["reportList"] = new ListMock("", "", "", []);
			await reportController.activate();
		});

		it("should get the list for the report", (): void => {
			expect(report.dataSource).to.have.been.calledWith(report.args);
			expect(reportController["reportList"].items).to.deep.equal(items);
		});

		it("should refresh the list", (): Chai.Assertion => expect(reportController["reportList"].refresh).to.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => expect(reportController["viewItems"]).to.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await reportController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		it("should push the episodes view for the selected item", async (): Promise<void> => {
			const index = 0;

			reportController["reportList"] = new ListMock("", "", "", items);
			await reportController["viewItem"](index);
			expect(appController.pushView).to.have.been.calledWith("episodes", {
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

		it("should set the list to view mode", (): Chai.Assertion => expect((reportController["reportList"] as ListMock).action).to.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => expect(appController.clearFooter).to.have.been.called);
		it("should set the footer label", (): Chai.Assertion => expect(String((reportController.footer as HeaderFooter).label)).to.equal("v1"));
		it("should set the view footer", (): Chai.Assertion => expect(appController.setFooter).to.have.been.called);
	});
});