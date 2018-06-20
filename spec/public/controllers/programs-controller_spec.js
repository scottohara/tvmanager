import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import Program from "models/program-model";
import ProgramsController from "controllers/programs-controller";
import ProgramsView from "views/programs-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("ProgramsController", () => {
	let items,
			programList,
			programsController;

	beforeEach(() => {
		items = [
			{id: 1, programName: "a-test-program"},
			{id: 2, programName: "z-test-program"}
		];

		programList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		programsController = new ProgramsController();
	});

	describe("object constructor", () => {
		it("should return a ProgramsController instance", () => programsController.should.be.an.instanceOf(ProgramsController));
	});

	describe("view", () => {
		it("should return the programs view", () => programsController.view.should.equal(ProgramsView));
	});

	describe("setup", () => {
		beforeEach(() => {
			sinon.stub(programsController, "viewItem");
			sinon.stub(programsController, "editItem");
			sinon.stub(programsController, "deleteItem");
			sinon.stub(programsController, "goBack");
			sinon.stub(programsController, "addItem");
			sinon.stub(programsController, "listRetrieved");
			Program.programs = items;
			programsController.setup();
		});

		it("should set the header label", () => programsController.header.label.should.equal("Programs"));

		it("should attach a header left button event handler", () => {
			programsController.header.leftButton.eventHandler();
			programsController.goBack.should.have.been.called;
		});

		it("should set the header left button style", () => programsController.header.leftButton.style.should.equal("backButton"));
		it("should set the header left button label", () => programsController.header.leftButton.label.should.equal("Schedule"));

		it("should attach a header right button event handler", () => {
			programsController.header.rightButton.eventHandler();
			programsController.addItem.should.have.been.called;
		});

		it("should set the header right button label", () => programsController.header.rightButton.label.should.equal("+"));

		it("should attach a view event handler to the programs list", () => {
			programsController.programList.viewEventHandler();
			programsController.viewItem.should.have.been.called;
		});

		it("should attach an edit event handler to the programs list", () => {
			programsController.programList.editEventHandler();
			programsController.editItem.should.have.been.called;
		});

		it("should attach a delete event handler to the programs list", () => {
			programsController.programList.deleteEventHandler();
			programsController.deleteItem.should.have.been.called;
		});

		it("should get the list of programs", () => {
			Program.list.should.have.been.calledWith(sinon.match.func);
			programsController.listRetrieved.should.have.been.calledWith(items);
		});
	});

	describe("activate", () => {
		beforeEach(() => {
			sinon.stub(programsController, "viewItems");
			programsController.programList = {
				items: [Object.assign({}, items[0])],
				refresh: sinon.stub(),
				scrollTo: sinon.stub()
			};
		});

		describe("from schedule", () => {
			beforeEach(() => programsController.activate());

			it("should refresh the list", () => programsController.programList.refresh.should.have.been.called);
			it("should set the list to view mode", () => programsController.viewItems.should.have.been.called);
		});

		describe("from program view", () => {
			let listItem,
					sortedItems;

			beforeEach(() => (programsController.programList.items = items));

			describe("edit", () => {
				beforeEach(() => {
					listItem = {
						listIndex: 0,
						program: {id: 1, programName: "edited-program"}
					};

					sortedItems = [
						listItem.program,
						items[1]
					];
				});

				describe("program name unchanged", () => {
					beforeEach(() => {
						programsController.origProgramName = listItem.program.programName;
						programsController.activate(listItem);
					});

					it("should update the item in the program list and resort by program name", () => programsController.programList.items.should.deep.equal(sortedItems));
					it("should refresh the list", () => programsController.programList.refresh.should.have.been.called);
					it("should not scroll the list", () => programsController.programList.scrollTo.should.not.have.been.called);
					it("should set the list to view mode", () => programsController.viewItems.should.have.been.called);
				});

				describe("program name changed", () => {
					beforeEach(() => {
						programsController.origProgramName = "original-program";
						programsController.activate(listItem);
					});

					it("should update the item in the program list and resort by program name", () => programsController.programList.items.should.deep.equal(sortedItems));
					it("should refresh the list", () => programsController.programList.refresh.should.have.been.called);
					it("should scroll the list", () => programsController.programList.scrollTo.should.have.been.calledWith(1));
					it("should set the list to view mode", () => programsController.viewItems.should.have.been.called);
				});
			});

			describe("add", () => {
				beforeEach(() => {
					listItem = {program: {id: 3, programName: "added-program"}};

					sortedItems = [
						items[0],
						listItem.program,
						items[1]
					];
					programsController.activate(listItem);
				});

				it("should add the item to the program list and resort by program name", () => programsController.programList.items.should.deep.equal(sortedItems));
				it("should refresh the list", () => programsController.programList.refresh.should.have.been.called);
				it("should scroll the list", () => programsController.programList.scrollTo.should.have.been.calledWith(3));
				it("should set the list to view mode", () => programsController.viewItems.should.have.been.called);
			});
		});
	});

	describe("listRetrieved", () => {
		beforeEach(() => {
			sinon.stub(programsController, "activate");
			programsController.programList = {};
			programsController.listRetrieved(items);
		});

		it("should set the program list items", () => programsController.programList.items.should.deep.equal(items));
		it("should activate the controller", () => programsController.activate.should.have.been.called);
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			programsController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", () => {
		const index = 0;

		beforeEach(() => {
			programsController.programList = {items};
			programsController.viewItem(index);
		});

		it("should save the current program details", () => programsController.origProgramName.should.equal(items[0].programName));
		it("should push the series list view for the selected item", () => appController.pushView.should.have.been.calledWith("seriesList", {
			listIndex: index,
			program: items[index]
		}));
	});

	describe("addItem", () => {
		it("should push the program view with no selected item", () => {
			programsController.addItem();
			appController.pushView.should.have.been.calledWithExactly("program");
		});
	});

	describe("editItem", () => {
		const index = 0;

		beforeEach(() => {
			programsController.programList = {items};
			programsController.editItem(index);
		});

		it("should save the current program details", () => programsController.origProgramName.should.equal(items[0].programName));
		it("should push the program view for the selected item", () => appController.pushView.should.have.been.calledWith("program", {
			listIndex: index,
			program: items[index]
		}));
	});

	describe("deleteItem", () => {
		let index,
				item;

		beforeEach(() => {
			index = 0;
			item = {
				programName: "test-program",
				remove: sinon.stub()
			};
			programsController.programList = {
				items: [item],
				refresh: sinon.stub()
			};
			programsController.deleteItem(index);
		});

		it("should remove the item from the database", () => item.remove.should.have.been.called);
		it("should remove the item from the program list", () => programsController.programList.items.should.deep.equal([]));
		it("should refresh the list", () => programsController.programList.refresh.should.have.been.called);
	});

	describe("deleteItems", () => {
		beforeEach(() => {
			sinon.stub(programsController, "listRetrieved");
			sinon.stub(programsController, "viewItems");
			programsController.setup();
			programsController.deleteItems();
		});

		it("should set the list to delete mode", () => programsController.programList.action.should.equal("delete"));
		it("should hide the scroll helper", () => appController.hideScrollHelper.should.have.been.called);
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			programList.hasClass("delete").should.be.true;
			programList.hasClass("edit").should.be.false;
			programList.hasClass("withHelper").should.be.false;
		});

		it("should set the footer label", () => programsController.footer.label.should.equal("v1.0"));

		it("should attach a footer right button event handler", () => {
			programsController.footer.rightButton.eventHandler();
			programsController.viewItems.should.have.been.called;
		});

		it("should set the footer right button style", () => programsController.footer.rightButton.style.should.equal("confirmButton"));
		it("should set the footer right button label", () => programsController.footer.rightButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("editItems", () => {
		beforeEach(() => {
			sinon.stub(programsController, "listRetrieved");
			sinon.stub(programsController, "viewItems");
			programsController.setup();
			programsController.editItems();
		});

		it("should set the list to edit mode", () => programsController.programList.action.should.equal("edit"));
		it("should hide the scroll helper", () => appController.hideScrollHelper.should.have.been.called);
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			programList.hasClass("delete").should.be.false;
			programList.hasClass("edit").should.be.true;
			programList.hasClass("withHelper").should.be.false;
		});

		it("should set the footer label", () => programsController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			programsController.footer.leftButton.eventHandler();
			programsController.viewItems.should.have.been.called;
		});

		it("should set the footer left button style", () => programsController.footer.leftButton.style.should.equal("confirmButton"));
		it("should set the footer left button label", () => programsController.footer.leftButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", () => {
		beforeEach(() => {
			sinon.stub(programsController, "listRetrieved");
			sinon.stub(programsController, "editItems");
			sinon.stub(programsController, "deleteItems");
			programsController.setup();
			programsController.viewItems();
		});

		it("should set the list to view mode", () => programsController.programList.action.should.equal("view"));
		it("should show the scroll helper", () => appController.showScrollHelper.should.have.been.called);
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			programList.hasClass("delete").should.be.false;
			programList.hasClass("edit").should.be.false;
			programList.hasClass("withHelper").should.be.true;
		});

		it("should set the footer label", () => programsController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			programsController.footer.leftButton.eventHandler();
			programsController.editItems.should.have.been.called;
		});

		it("should set the footer left button label", () => programsController.footer.leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", () => {
			programsController.footer.rightButton.eventHandler();
			programsController.deleteItems.should.have.been.called;
		});

		it("should set the footer left button style", () => programsController.footer.rightButton.style.should.equal("cautionButton"));
		it("should set the footer right button label", () => programsController.footer.rightButton.label.should.equal("Delete"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	afterEach(() => programList.remove());
});