import ApplicationController from "controllers/application-controller";
import ReportController from "controllers/report-controller";
import ReportView from "views/report-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("ReportController", () => {
	let args,
			items,
			report,
			reportController;

	beforeEach(() => {
		args = "test-args";
		items = [
			"test-item-1",
			"test-item-2"
		];
		report = {
			reportName: "test-report",
			dataSource: sinon.stub().yields(items),
			args
		};

		reportController = new ReportController(report);
	});

	describe("object constructor", () => {
		it("should return a ReportController instance", () => reportController.should.be.an.instanceOf(ReportController));
		it("should set the report", () => reportController.report.should.deep.equal(report));
	});

	describe("view", () => {
		it("should return the report view", () => reportController.view.should.equal(ReportView));
	});

	describe("setup", () => {
		beforeEach(() => {
			sinon.stub(reportController, "viewItem");
			sinon.stub(reportController, "goBack");
			sinon.stub(reportController, "activate");
			reportController.setup();
		});

		it("should set the header label", () => reportController.header.label.should.equal(report.reportName));

		it("should attach a header left button event handler", () => {
			reportController.header.leftButton.eventHandler();
			reportController.goBack.should.have.been.called;
		});

		it("should set the header left button style", () => reportController.header.leftButton.style.should.equal("backButton"));
		it("should set the header left button label", () => reportController.header.leftButton.label.should.equal("Settings"));

		it("should attach a view event handler to the report list", () => {
			reportController.reportList.viewEventHandler();
			reportController.viewItem.should.have.been.called;
		});

		it("should activate the controller", () => reportController.activate.should.have.been.called);
	});

	describe("activate", () => {
		it("should get the list of unscheduled episodes", () => {
			sinon.stub(reportController, "listRetrieved");
			reportController.activate();
			report.dataSource.should.have.been.calledWith(sinon.match.func, report.args);
			reportController.listRetrieved.should.have.been.calledWith(items);
		});
	});

	describe("listRetrieved", () => {
		beforeEach(() => {
			sinon.stub(reportController, "activate");
			sinon.stub(reportController, "viewItems");
			reportController.setup();
			reportController.listRetrieved(items);
		});

		it("should set the report list items", () => reportController.reportList.items.should.deep.equal(items));
		it("should refresh the list", () => reportController.reportList.refresh.should.have.been.called);
		it("should set the list to view mode", () => reportController.viewItems.should.have.been.called);
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			reportController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", () => {
		it("should push the episodes view for the selected item", () => {
			const index = 0;

			reportController.reportList = {items};
			reportController.viewItem(index);
			appController.pushView.should.have.been.calledWith("episodes", {
				source: "Report",
				listIndex: index,
				series: items[index]
			});
		});
	});

	describe("viewItems", () => {
		beforeEach(() => {
			sinon.stub(reportController, "activate");
			reportController.setup();
			reportController.viewItems();
		});

		it("should set the list to view mode", () => reportController.reportList.action.should.equal("view"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);
		it("should set the footer label", () => reportController.footer.label.should.equal("v1.0"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});
});