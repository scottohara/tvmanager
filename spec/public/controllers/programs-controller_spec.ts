import {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler
} from "controllers";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import { ListEventHandler } from "components";
import ListMock from "mocks/list-mock";
import ProgramMock from "mocks/program-model-mock";
import ProgramsController from "controllers/programs-controller";
import ProgramsView from "views/programs-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("ProgramsController", (): void => {
	let items: ProgramMock[],
			programList: JQuery,
			programsController: ProgramsController;

	beforeEach((): void => {
		items = [
			new ProgramMock("1", "a-test-program"),
			new ProgramMock("2", "z-test-program")
		];

		programList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		programsController = new ProgramsController();
	});

	describe("object constructor", (): void => {
		it("should return a ProgramsController instance", (): Chai.Assertion => programsController.should.be.an.instanceOf(ProgramsController));
	});

	describe("view", (): void => {
		it("should return the programs view", (): Chai.Assertion => programsController.view.should.equal(ProgramsView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "viewItem" as keyof ProgramsController);
			sinon.stub(programsController, "editItem" as keyof ProgramsController);
			sinon.stub(programsController, "deleteItem" as keyof ProgramsController);
			sinon.stub(programsController, "goBack" as keyof ProgramsController);
			sinon.stub(programsController, "addItem" as keyof ProgramsController);
			sinon.stub(programsController, "activate");
			await programsController.setup();
			leftButton = programsController.header.leftButton as NavButton;
			rightButton = programsController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(programsController.header.label).should.equal("Programs"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			programsController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Schedule"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			programsController["addItem"].should.have.been.called;
		});

		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("+"));

		it("should attach a view event handler to the programs list", (): void => {
			(programsController["programList"] as ListMock).viewEventHandler(0);
			programsController["viewItem"].should.have.been.calledWith(0);
		});

		it("should attach an edit event handler to the programs list", (): void => {
			((programsController["programList"] as ListMock).editEventHandler as ListEventHandler)(0);
			programsController["editItem"].should.have.been.calledWith(0);
		});

		it("should attach a delete event handler to the programs list", (): void => {
			(programsController["programList"] as ListMock).deleteEventHandler(0);
			programsController["deleteItem"].should.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion => programsController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "viewItems" as keyof ProgramsController);
			programsController["programList"] = new ListMock("", "", "", []);
			ProgramMock.programs = items;
			await programsController.activate();
		});

		it("should get the list of programs", (): void => {
			ProgramMock.list.should.have.been.called;
			programsController["programList"].items.should.deep.equal(items);
		});

		it("should refresh the list", (): Chai.Assertion => programsController["programList"].refresh.should.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => programsController["viewItems"].should.have.been.called);
	});

	describe("contentShown", (): void => {
		beforeEach((): ListMock => (programsController["programList"] = new ListMock("", "", "", [])));

		describe("with active list item", (): void => {
			beforeEach((): void => {
				programsController["activeListItem"] = new ProgramMock("1", "");
				programsController.contentShown();
			});

			it("should scroll the list", (): Chai.Assertion => programsController["programList"].scrollTo.should.have.been.calledWith("1"));
		});

		describe("without active list item", (): void => {
			beforeEach((): void => {
				programsController["activeListItem"] = null;
				programsController.contentShown();
			});

			it("should not scroll the list", (): Chai.Assertion => programsController["programList"].scrollTo.should.not.have.been.called);
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await programsController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		const index = 0;

		beforeEach(async (): Promise<void> => {
			programsController["programList"] = new ListMock("", "", "", items);
			await programsController["viewItem"](index);
		});

		it("should save the active list item", (): Chai.Assertion => (programsController["activeListItem"] as ProgramMock).should.equal(items[0]));
		it("should push the series list view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("seriesList", {
			listIndex: index,
			program: items[index]
		}));
	});

	describe("addItem", (): void => {
		it("should push the program view with no selected item", async (): Promise<void> => {
			await programsController["addItem"]();
			appController.pushView.should.have.been.calledWithExactly("program");
		});
	});

	describe("editItem", (): void => {
		const index = 0;

		beforeEach(async (): Promise<void> => {
			programsController["programList"] = new ListMock("", "", "", items);
			await programsController["editItem"](index);
		});

		it("should save the active list item", (): Chai.Assertion => (programsController["activeListItem"] as ProgramMock).should.equal(items[0]));
		it("should push the program view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("program", {
			listIndex: index,
			program: items[index]
		}));
	});

	describe("deleteItem", (): void => {
		let index: number,
				item: ProgramMock;

		beforeEach(async (): Promise<void> => {
			index = 0;
			item = new ProgramMock(null, "test-program");
			programsController["programList"] = new ListMock("", "", "", [item]);
			await programsController["deleteItem"](index);
		});

		it("should remove the item from the database", (): Chai.Assertion => item.remove.should.have.been.called);
		it("should remove the item from the program list", (): Chai.Assertion => programsController["programList"].items.should.deep.equal([]));
		it("should refresh the list", (): Chai.Assertion => programsController["programList"].refresh.should.have.been.called);
	});

	describe("deleteItems", (): void => {
		let	footer: HeaderFooter,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			sinon.stub(programsController, "viewItems" as keyof ProgramsController);
			await programsController.setup();
			await programsController["deleteItems"]();
			footer = programsController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion => (programsController["programList"] as ListMock).action.should.equal("delete"));
		it("should hide the list index", (): Chai.Assertion => programsController["programList"].hideIndex.should.have.been.called);
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			programList.hasClass("delete").should.be.true;
			programList.hasClass("edit").should.be.false;
			programList.hasClass("withHelper").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			programsController["viewItems"].should.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("editItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			sinon.stub(programsController, "viewItems" as keyof ProgramsController);
			await programsController.setup();
			await programsController["editItems"]();
			footer = programsController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion => (programsController["programList"] as ListMock).action.should.equal("edit"));
		it("should hide the list index", (): Chai.Assertion => programsController["programList"].hideIndex.should.have.been.called);
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			programList.hasClass("delete").should.be.false;
			programList.hasClass("edit").should.be.true;
			programList.hasClass("withHelper").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			programsController["viewItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(leftButton.style).should.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			sinon.stub(programsController, "editItems" as keyof ProgramsController);
			sinon.stub(programsController, "deleteItems" as keyof ProgramsController);
			await programsController.setup();
			await programsController["viewItems"]();
			footer = programsController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion => (programsController["programList"] as ListMock).action.should.equal("view"));
		it("should show the list index", (): Chai.Assertion => programsController["programList"].showIndex.should.have.been.called);
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			programList.hasClass("delete").should.be.false;
			programList.hasClass("edit").should.be.false;
			programList.hasClass("withHelper").should.be.true;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			programsController["editItems"].should.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			programsController["deleteItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(rightButton.style).should.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	afterEach((): JQuery => programList.remove());
});