import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	ProgramListItem,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import type { ListEventHandler } from "~/components";
import ListMock from "~/mocks/list-mock";
import ProgramMock from "~/mocks/program-model-mock";
import SeriesListController from "~/controllers/seriesList-controller";
import SeriesListView from "~/views/seriesList-view.html";
import SeriesMock from "~/mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("SeriesListController", (): void => {
	let listItem: ProgramListItem,
		items: SeriesMock[],
		seriesList: HTMLUListElement,
		seriesListController: SeriesListController;

	beforeEach((): void => {
		listItem = { program: new ProgramMock("1", "test-program", 1, 6, 2, 2, 2) };
		items = [
			new SeriesMock("1", "a-test-series", null, "1", undefined, 3, 1, 1, 1),
			new SeriesMock("2", "z-test-series", null, "1", undefined, 3, 1, 1, 1),
		];

		seriesList = document.createElement("ul");
		seriesList.id = "list";
		document.body.append(seriesList);

		seriesListController = new SeriesListController(listItem);
	});

	describe("object constructor", (): void => {
		it("should return a SeriesListController instance", (): Chai.Assertion =>
			expect(seriesListController).to.be.an.instanceOf(SeriesListController));
		it("should set the list item", (): Chai.Assertion =>
			expect(seriesListController["listItem"]).to.equal(listItem));
	});

	describe("view", (): void => {
		it("should return the series list view", (): Chai.Assertion =>
			expect(seriesListController.view).to.equal(SeriesListView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton, rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(
				seriesListController,
				"viewItem" as keyof SeriesListController,
			);
			sinon.stub(
				seriesListController,
				"editItem" as keyof SeriesListController,
			);
			sinon.stub(
				seriesListController,
				"deleteItem" as keyof SeriesListController,
			);
			sinon.stub(seriesListController, "goBack" as keyof SeriesListController);
			sinon.stub(seriesListController, "addItem" as keyof SeriesListController);
			sinon.stub(seriesListController, "activate");
			await seriesListController.setup();
			leftButton = seriesListController.header.leftButton as NavButton;
			rightButton = seriesListController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(seriesListController.header.label)).to.equal(
				listItem.program.programName,
			));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["goBack"]).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Programs"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["addItem"]).to.have.been.called;
		});

		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("+"));

		it("should attach a view event handler to the series list", (): void => {
			(seriesListController["seriesList"] as ListMock).viewEventHandler(0);
			expect(seriesListController["viewItem"]).to.have.been.calledWith(0);
		});

		it("should attach an edit event handler to the series list", (): void => {
			(
				(seriesListController["seriesList"] as ListMock)
					.editEventHandler as ListEventHandler
			)(0);
			expect(seriesListController["editItem"]).to.have.been.calledWith(0);
		});

		it("should attach a delete event handler to the series list", (): void => {
			(seriesListController["seriesList"] as ListMock).deleteEventHandler(0);
			expect(seriesListController["deleteItem"]).to.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion =>
			expect(seriesListController["activate"]).to.have.been.called);
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(
				seriesListController,
				"viewItems" as keyof SeriesListController,
			);
			seriesListController["seriesList"] = new ListMock("", "", "", []);
			SeriesMock.series = items;
			await seriesListController.activate();
		});

		it("should get the list of series for the program", (): void => {
			expect(SeriesMock.listByProgram).to.have.been.calledWith(
				listItem.program.id,
			);
			expect(seriesListController["seriesList"].items).to.deep.equal(items);
		});

		it("should refresh the list", (): Chai.Assertion =>
			expect(seriesListController["seriesList"].refresh).to.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion =>
			expect(seriesListController["viewItems"]).to.have.been.called);
	});

	describe("contentShown", (): void => {
		beforeEach(
			(): ListMock =>
				(seriesListController["seriesList"] = new ListMock("", "", "", [])),
		);

		describe("with active list item", (): void => {
			let item: HTMLLIElement;

			beforeEach((): void => {
				seriesListController["activeListItem"] = new SeriesMock(
					"1",
					"",
					null,
					"1",
				);
				item = document.createElement("li");
				item.id = "item-1";
				seriesList.append(item);

				seriesListController.contentShown();
			});

			it("should scroll the list", (): Chai.Assertion =>
				expect(
					seriesListController["seriesList"].scrollTo,
				).to.have.been.calledWith("1"));

			afterEach((): void => item.remove());
		});

		describe("with active list item that no longer exists", (): void => {
			beforeEach((): void => {
				seriesListController["activeListItem"] = new SeriesMock(
					"1",
					"",
					null,
					"1",
				);
				seriesListController.contentShown();
			});

			it("should not scroll the list", (): Chai.Assertion =>
				expect(seriesListController["seriesList"].scrollTo).to.not.have.been
					.called);
		});

		describe("without active list item", (): void => {
			beforeEach((): void => {
				seriesListController["activeListItem"] = null;
				seriesListController.contentShown();
			});

			it("should not scroll the list", (): Chai.Assertion =>
				expect(seriesListController["seriesList"].scrollTo).to.not.have.been
					.called);
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await seriesListController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		let index: number;

		beforeEach(async (): Promise<void> => {
			index = 0;
			seriesListController["seriesList"] = new ListMock("", "", "", items);
			await seriesListController["viewItem"](index);
		});

		it("should save the current series details", (): Chai.Assertion =>
			expect(seriesListController["activeListItem"] as SeriesMock).to.equal(
				items[0],
			));

		it("should push the episodes view for the selected item", (): Chai.Assertion =>
			expect(appController.pushView).to.have.been.calledWith("episodes", {
				listIndex: index,
				series: items[index],
			}));
	});

	describe("addItem", (): void => {
		it("should push the series view with no selected item", async (): Promise<void> => {
			seriesListController["seriesList"] = new ListMock("", "", "", items);
			await seriesListController["addItem"]();
			expect(appController.pushView).to.have.been.calledWithExactly("series", {
				program: listItem.program,
				sequence: 2,
			});
		});
	});

	describe("editItem", (): void => {
		let index: number;

		beforeEach(async (): Promise<void> => {
			index = 0;
			seriesListController["seriesList"] = new ListMock("", "", "", items);
			await seriesListController["editItem"](index);
		});

		it("should save the current series details", (): Chai.Assertion =>
			expect(seriesListController["activeListItem"] as SeriesMock).to.equal(
				items[0],
			));

		it("should push the program view for the selected item", (): Chai.Assertion =>
			expect(appController.pushView).to.have.been.calledWith("series", {
				listIndex: index,
				series: items[index],
			}));
	});

	describe("deleteItem", (): void => {
		interface Scenario {
			description: string;
			dontRemove?: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "moving",
				dontRemove: true,
			},
			{
				description: "deleting (explicit)",
				dontRemove: false,
			},
			{
				description: "deleting (default)",
			},
		];

		let index: number, item: SeriesMock;

		beforeEach((): void => {
			index = 0;
			item = { ...items[0], save: sinon.stub(), remove: sinon.stub() };
			seriesListController["seriesList"] = new ListMock("", "", "", [item]);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(
					async (): Promise<void> =>
						seriesListController["deleteItem"](index, scenario.dontRemove),
				);

				if (undefined === scenario.dontRemove || !scenario.dontRemove) {
					it("should remove the item from the database", (): Chai.Assertion =>
						expect(item.remove).to.have.been.called);
				}

				it("should remove the item from the series list", (): Chai.Assertion =>
					expect(seriesListController["seriesList"].items).to.deep.equal([]));
				it("should refresh the list", (): Chai.Assertion =>
					expect(seriesListController["seriesList"].refresh).to.have.been
						.called);
			});
		});
	});

	describe("deleteItems", (): void => {
		let footer: HeaderFooter, rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(seriesListController, "activate");
			sinon.stub(
				seriesListController,
				"viewItems" as keyof SeriesListController,
			);
			await seriesListController.setup();
			await seriesListController["deleteItems"]();
			footer = seriesListController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion =>
			expect(
				String((seriesListController["seriesList"] as ListMock).action),
			).to.equal("delete"));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(seriesList.classList.contains("delete")).to.be.true;
			expect(seriesList.classList.contains("edit")).to.be.false;
		});

		it("should set the footer label", (): Chai.Assertion =>
			expect(String(footer.label)).to.equal("v1"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["viewItems"]).to.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Done"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	describe("editItems", (): void => {
		let footer: HeaderFooter, leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(seriesListController, "activate");
			sinon.stub(
				seriesListController,
				"viewItems" as keyof SeriesListController,
			);
			await seriesListController.setup();
			await seriesListController["editItems"]();
			footer = seriesListController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion =>
			expect((seriesListController["seriesList"] as ListMock).action).to.equal(
				"edit",
			));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(seriesList.classList.contains("delete")).to.be.false;
			expect(seriesList.classList.contains("edit")).to.be.true;
		});

		it("should set the footer label", (): Chai.Assertion =>
			expect(String(footer.label)).to.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["viewItems"]).to.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion =>
			expect(String(leftButton.style)).to.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Done"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	describe("viewItems", (): void => {
		let footer: HeaderFooter, leftButton: NavButton, rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(seriesListController, "activate");
			sinon.stub(
				seriesListController,
				"editItems" as keyof SeriesListController,
			);
			sinon.stub(
				seriesListController,
				"deleteItems" as keyof SeriesListController,
			);
			await seriesListController.setup();
			await seriesListController["viewItems"]();
			footer = seriesListController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion =>
			expect((seriesListController["seriesList"] as ListMock).action).to.equal(
				"view",
			));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(seriesList.classList.contains("delete")).to.be.false;
			expect(seriesList.classList.contains("edit")).to.be.false;
		});

		it("should set the footer label", (): Chai.Assertion =>
			expect(String(footer.label)).to.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["editItems"]).to.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Edit"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(seriesListController["deleteItems"]).to.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	afterEach((): void => seriesList.remove());
});
