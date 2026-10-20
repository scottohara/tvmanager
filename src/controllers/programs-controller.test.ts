import type { ClickEventHandler, HeaderFooter, NavButton } from "~/controllers";
import sinon, { type SinonStub } from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import type { ListEventHandler } from "~/components";
import ListMock from "~/mocks/list-mock";
import ProgramMock from "~/mocks/program-model-mock";
import ProgramsController from "~/controllers/programs-controller";
import ProgramsView from "~/views/programs-view.html";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("ProgramsController", (): void => {
	let items: ProgramMock[],
		programList: HTMLUListElement,
		programsController: ProgramsController;

	beforeEach((): void => {
		items = [
			new ProgramMock(1, "a-test-program"),
			new ProgramMock(2, "z-test-program"),
		];

		programList = document.createElement("ul");
		programList.id = "list";
		document.body.append(programList);

		programsController = new ProgramsController();
	});

	describe("object constructor", (): void => {
		it("should return a ProgramsController instance", (): Chai.Assertion =>
			expect(programsController).to.be.an.instanceOf(ProgramsController));
	});

	describe("view", (): void => {
		it("should return the programs view", (): Chai.Assertion =>
			expect(programsController.view).to.equal(ProgramsView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton,
			rightButton: NavButton,
			viewItem: SinonStub,
			editItem: SinonStub,
			deleteItem: SinonStub,
			goBack: SinonStub,
			addItem: SinonStub,
			activate: SinonStub;

		beforeEach(async (): Promise<void> => {
			viewItem = sinon.stub(
				programsController,
				"viewItem" as keyof ProgramsController,
			);
			editItem = sinon.stub(
				programsController,
				"editItem" as keyof ProgramsController,
			);
			deleteItem = sinon.stub(
				programsController,
				"deleteItem" as keyof ProgramsController,
			);
			goBack = sinon.stub(
				programsController,
				"goBack" as keyof ProgramsController,
			);
			addItem = sinon.stub(
				programsController,
				"addItem" as keyof ProgramsController,
			);
			activate = sinon.stub(programsController, "activate");
			await programsController.setup();
			leftButton = programsController.header.leftButton as NavButton;
			rightButton = programsController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(programsController.header.label)).to.equal("Programs"));

		it("should attach a header left button event handler", async (): Promise<void> => {
			await (leftButton.eventHandler as ClickEventHandler)();
			expect(goBack).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Schedule"));

		it("should attach a header right button event handler", async (): Promise<void> => {
			await (rightButton.eventHandler as ClickEventHandler)();
			expect(addItem).to.have.been.called;
		});

		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("+"));

		it("should attach a view event handler to the programs list", async (): Promise<void> => {
			await (programsController["programList"] as ListMock).viewEventHandler(0);
			expect(viewItem).to.have.been.calledWith(0);
		});

		it("should attach an edit event handler to the programs list", async (): Promise<void> => {
			await (
				(programsController["programList"] as ListMock)
					.editEventHandler as ListEventHandler
			)(0);
			expect(editItem).to.have.been.calledWith(0);
		});

		it("should attach a delete event handler to the programs list", async (): Promise<void> => {
			await (programsController["programList"] as ListMock).deleteEventHandler(
				0,
			);
			expect(deleteItem).to.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion =>
			expect(activate).to.have.been.called);
	});

	describe("activate", (): void => {
		let viewItems: SinonStub;

		beforeEach((): void => {
			viewItems = sinon.stub(
				programsController,
				"viewItems" as keyof ProgramsController,
			);
			programsController["programList"] = new ListMock("", "", "", []);
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.programs = items;
				await programsController.activate();
			});

			it("should get the list of programs", (): void => {
				expect(ProgramMock.list).to.have.been.called;
				expect(programsController["programList"].items).to.deep.equal(items);
			});

			it("should refresh the list", (): Chai.Assertion =>
				expect(programsController["programList"].refresh).to.have.been.called);
			it("should set the list to view mode", (): Chai.Assertion =>
				expect(viewItems).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.error = "activate failed";
				await programsController.activate();
			});

			it("should not refresh the list", (): Chai.Assertion =>
				expect(programsController["programList"].refresh).to.not.have.been
					.called);
			it("should not set the list to view mode", (): Chai.Assertion =>
				expect(viewItems).to.not.have.been.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "activate failed",
				}));

			afterEach((): null => (ProgramMock.error = null));
		});
	});

	describe("contentShown", (): void => {
		beforeEach(
			(): ListMock =>
				(programsController["programList"] = new ListMock("", "", "", [])),
		);

		describe("with active list item", (): void => {
			beforeEach((): void => {
				programsController["activeListItem"] = new ProgramMock(1, "");
				programsController.contentShown();
			});

			it("should scroll the list", (): Chai.Assertion =>
				expect(
					programsController["programList"].scrollTo,
				).to.have.been.calledWith("1"));
		});

		describe("without active list item", (): void => {
			beforeEach((): void => {
				programsController["activeListItem"] = null;
				programsController.contentShown();
			});

			it("should not scroll the list", (): Chai.Assertion =>
				expect(programsController["programList"].scrollTo).to.not.have.been
					.called);
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await programsController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		const index = 0;

		beforeEach(async (): Promise<void> => {
			programsController["programList"] = new ListMock("", "", "", items);
			await programsController["viewItem"](index);
		});

		it("should save the active list item", (): Chai.Assertion =>
			expect(programsController["activeListItem"]).to.equal(items[0]));
		it("should push the series list view for the selected item", (): Chai.Assertion =>
			expect(appController.pushView).to.have.been.calledWith("seriesList", {
				listIndex: index,
				program: items[index],
			}));
	});

	describe("addItem", (): void => {
		it("should push the program view with no selected item", async (): Promise<void> => {
			await programsController["addItem"]();
			expect(appController.pushView).to.have.been.calledWithExactly("program");
		});
	});

	describe("editItem", (): void => {
		const index = 0;

		beforeEach(async (): Promise<void> => {
			programsController["programList"] = new ListMock("", "", "", items);
			await programsController["editItem"](index);
		});

		it("should save the active list item", (): Chai.Assertion =>
			expect(programsController["activeListItem"]).to.equal(items[0]));
		it("should push the program view for the selected item", (): Chai.Assertion =>
			expect(appController.pushView).to.have.been.calledWith("program", {
				listIndex: index,
				program: items[index],
			}));
	});

	describe("deleteItem", (): void => {
		beforeEach(
			(): ListMock =>
				(programsController["programList"] = new ListMock("", "", "", [
					items[0],
				])),
		);

		describe("success", (): void => {
			beforeEach(async (): Promise<void> =>
				programsController["deleteItem"](0),
			);

			it("should remove the item from the database", (): Chai.Assertion =>
				expect(items[0].remove).to.have.been.called);
			it("should remove the item from the program list", (): Chai.Assertion =>
				expect(programsController["programList"].items).to.deep.equal([]));
			it("should refresh the list", (): Chai.Assertion =>
				expect(programsController["programList"].refresh).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.error = "delete failed";
				await programsController["deleteItem"](0);
			});

			it("should attempt to remove the item from the database", (): Chai.Assertion =>
				expect(items[0].remove).to.have.been.called);
			it("should not remove the item from the program list", (): Chai.Assertion =>
				expect(programsController["programList"].items).to.deep.equal([
					items[0],
				]));
			it("should not refresh the list", (): Chai.Assertion =>
				expect(programsController["programList"].refresh).to.not.have.been
					.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "delete failed",
				}));

			afterEach((): null => (ProgramMock.error = null));
		});
	});

	describe("deleteItems", (): void => {
		let footer: HeaderFooter, rightButton: NavButton, viewItems: SinonStub;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			viewItems = sinon.stub(
				programsController,
				"viewItems" as keyof ProgramsController,
			);
			await programsController.setup();
			programsController["deleteItems"]();
			footer = programsController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion =>
			expect((programsController["programList"] as ListMock).action).to.equal(
				"delete",
			));
		it("should hide the list index", (): Chai.Assertion =>
			expect(programsController["programList"].hideIndex).to.have.been.called);
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(programList.classList.contains("delete")).to.be.true;
			expect(programList.classList.contains("edit")).to.be.false;
			expect(programList.classList.contains("withHelper")).to.be.false;
		});

		it("should attach a footer right button event handler", async (): Promise<void> => {
			await (rightButton.eventHandler as ClickEventHandler)();
			expect(viewItems).to.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Done"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	describe("editItems", (): void => {
		let footer: HeaderFooter, leftButton: NavButton, viewItems: SinonStub;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			viewItems = sinon.stub(
				programsController,
				"viewItems" as keyof ProgramsController,
			);
			await programsController.setup();
			programsController["editItems"]();
			footer = programsController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion =>
			expect((programsController["programList"] as ListMock).action).to.equal(
				"edit",
			));
		it("should hide the list index", (): Chai.Assertion =>
			expect(programsController["programList"].hideIndex).to.have.been.called);
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(programList.classList.contains("delete")).to.be.false;
			expect(programList.classList.contains("edit")).to.be.true;
			expect(programList.classList.contains("withHelper")).to.be.false;
		});

		it("should attach a footer left button event handler", async (): Promise<void> => {
			await (leftButton.eventHandler as ClickEventHandler)();
			expect(viewItems).to.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Done"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	describe("viewItems", (): void => {
		let footer: HeaderFooter,
			leftButton: NavButton,
			rightButton: NavButton,
			editItems: SinonStub,
			deleteItems: SinonStub;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programsController, "activate");
			editItems = sinon.stub(
				programsController,
				"editItems" as keyof ProgramsController,
			);
			deleteItems = sinon.stub(
				programsController,
				"deleteItems" as keyof ProgramsController,
			);
			await programsController.setup();
			programsController["viewItems"]();
			footer = programsController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion =>
			expect((programsController["programList"] as ListMock).action).to.equal(
				"view",
			));
		it("should show the list index", (): Chai.Assertion =>
			expect(programsController["programList"].showIndex).to.have.been.called);
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(programList.classList.contains("delete")).to.be.false;
			expect(programList.classList.contains("edit")).to.be.false;
			expect(programList.classList.contains("withHelper")).to.be.true;
		});

		it("should attach a footer left button event handler", async (): Promise<void> => {
			await (leftButton.eventHandler as ClickEventHandler)();
			expect(editItems).to.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Edit"));

		it("should attach a footer right button event handler", async (): Promise<void> => {
			await (rightButton.eventHandler as ClickEventHandler)();
			expect(deleteItems).to.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	afterEach((): void => {
		ProgramMock.reset();
		programList.remove();
	});
});
