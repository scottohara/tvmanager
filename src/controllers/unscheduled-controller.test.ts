import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import EpisodeMock from "~/mocks/episode-model-mock";
import ListMock from "~/mocks/list-mock";
import UnscheduledController from "~/controllers/unscheduled-controller";
import UnscheduledView from "~/views/unscheduled-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("UnscheduledController", (): void => {
	let unscheduledController: UnscheduledController, items: EpisodeMock[];

	beforeEach((): void => {
		unscheduledController = new UnscheduledController();
		items = [{} as EpisodeMock];
	});

	describe("object constructor", (): void => {
		it("should return an UnscheduledController instance", (): Chai.Assertion =>
			expect(unscheduledController).to.be.an.instanceOf(UnscheduledController));
	});

	describe("view", (): void => {
		it("should return the unscheduled view", (): Chai.Assertion =>
			expect(unscheduledController.view).to.equal(UnscheduledView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(
				unscheduledController,
				"viewItem" as keyof UnscheduledController,
			);
			sinon.stub(
				unscheduledController,
				"goBack" as keyof UnscheduledController,
			);
			sinon.stub(unscheduledController, "activate");
			await unscheduledController.setup();
			leftButton = unscheduledController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(unscheduledController.header.label)).to.equal(
				"Unscheduled",
			));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(unscheduledController["goBack"]).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Schedule"));

		it("should attach a view event handler to the unscheduled list", (): void => {
			(unscheduledController["unscheduledList"] as ListMock).viewEventHandler(
				0,
			);
			expect(unscheduledController["viewItem"]).to.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion =>
			expect(unscheduledController["activate"]).to.have.been.called);
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(
				unscheduledController,
				"viewItems" as keyof UnscheduledController,
			);
			unscheduledController["unscheduledList"] = new ListMock("", "", "", []);
			await unscheduledController.activate();
		});

		it("should get the list of unscheduled episodes", (): void => {
			expect(EpisodeMock.listByUnscheduled).to.have.been.called;
			expect(unscheduledController["unscheduledList"].items).to.deep.equal(
				items,
			);
		});

		it("should refresh the list", (): Chai.Assertion =>
			expect(unscheduledController["unscheduledList"].refresh).to.have.been
				.called);
		it("should set the list to view mode", (): Chai.Assertion =>
			expect(unscheduledController["viewItems"]).to.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await unscheduledController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		it("should push the episode view for the selected item", async (): Promise<void> => {
			const index = 0;

			unscheduledController["unscheduledList"] = new ListMock(
				"",
				"",
				"",
				items,
			);
			await unscheduledController["viewItem"](index);
			expect(appController.pushView).to.have.been.calledWith("episode", {
				listIndex: index,
				episode: items[index],
			});
		});
	});

	describe("viewItems", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(unscheduledController, "activate");
			await unscheduledController.setup();
			await unscheduledController["viewItems"]();
		});

		it("should set the list to view mode", (): Chai.Assertion =>
			expect(
				String((unscheduledController["unscheduledList"] as ListMock).action),
			).to.equal("view"));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);
		it("should set the footer label", (): Chai.Assertion =>
			expect(
				String((unscheduledController.footer as HeaderFooter).label),
			).to.equal("v1"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});
});
