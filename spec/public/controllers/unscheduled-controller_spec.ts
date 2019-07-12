import {
	HeaderFooter,
	NavButton
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeMock from "mocks/episode-model-mock";
import ListMock from "mocks/list-mock";
import UnscheduledController from "controllers/unscheduled-controller";
import UnscheduledView from "views/unscheduled-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("UnscheduledController", (): void => {
	let unscheduledController: UnscheduledController,
			items: EpisodeMock[];

	beforeEach((): void => {
		unscheduledController = new UnscheduledController();
		items = [{} as EpisodeMock];
	});

	describe("object constructor", (): void => {
		it("should return an UnscheduledController instance", (): Chai.Assertion => unscheduledController.should.be.an.instanceOf(UnscheduledController));
	});

	describe("view", (): void => {
		it("should return the unscheduled view", (): Chai.Assertion => unscheduledController.view.should.equal(UnscheduledView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(unscheduledController, "viewItem" as keyof UnscheduledController);
			sinon.stub(unscheduledController, "goBack" as keyof UnscheduledController);
			sinon.stub(unscheduledController, "activate");
			await unscheduledController.setup();
			leftButton = unscheduledController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(unscheduledController.header.label).should.equal("Unscheduled"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			unscheduledController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Schedule"));

		it("should attach a view event handler to the unscheduled list", (): void => {
			(unscheduledController["unscheduledList"] as ListMock).viewEventHandler(0);
			unscheduledController["viewItem"].should.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion => unscheduledController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		it("should get the list of unscheduled episodes", async (): Promise<void> => {
			sinon.stub(unscheduledController, "listRetrieved" as keyof UnscheduledController);
			await unscheduledController.activate();
			EpisodeMock.listByUnscheduled.should.have.been.called;
			unscheduledController["listRetrieved"].should.have.been.calledWith([{}]);
		});
	});

	describe("listRetrieved", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(unscheduledController, "activate");
			sinon.stub(unscheduledController, "viewItems" as keyof UnscheduledController);
			await unscheduledController.setup();
			await unscheduledController["listRetrieved"](items);
		});

		it("should set the unscheduled list items", (): Chai.Assertion => unscheduledController["unscheduledList"].items.should.deep.equal(items));
		it("should refresh the list", (): Chai.Assertion => unscheduledController["unscheduledList"].refresh.should.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => unscheduledController["viewItems"].should.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await unscheduledController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		it("should push the episode view for the selected item", async (): Promise<void> => {
			const index = 0;

			unscheduledController["unscheduledList"] = new ListMock("", "", "", items, sinon.stub());
			await unscheduledController["viewItem"](index);
			appController.pushView.should.have.been.calledWith("episode", {
				listIndex: index,
				episode: items[index]
			});
		});
	});

	describe("viewItems", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(unscheduledController, "activate");
			await unscheduledController.setup();
			await unscheduledController["viewItems"]();
		});

		it("should set the list to view mode", (): Chai.Assertion => String((unscheduledController["unscheduledList"] as ListMock).action).should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);
		it("should set the footer label", (): Chai.Assertion => String((unscheduledController.footer as HeaderFooter).label).should.equal("v1"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});
});