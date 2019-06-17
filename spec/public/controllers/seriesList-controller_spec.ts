import {
	HeaderFooter,
	NavButton,
	ProgramListItem,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ListMock from "mocks/list-mock";
import ProgramMock from "mocks/program-model-mock";
import SeriesListController from "controllers/seriesList-controller";
import SeriesListView from "views/seriesList-view.html";
import SeriesMock from "mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("SeriesListController", (): void => {
	let listItem: ProgramListItem,
			items: SeriesMock[],
			seriesList: JQuery<HTMLElement>,
			seriesListController: SeriesListController,
			programName: undefined;

	beforeEach((): void => {
		listItem = { program: new ProgramMock("1", "test-program", 1, 6, 2, 2, 2) };
		items = [
			new SeriesMock("1", "a-test-series", null, "1", programName, 3, 1, 1, 1),
			new SeriesMock("2", "z-test-series", null, "1", programName, 3, 1, 1, 1)
		];

		seriesList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		seriesListController = new SeriesListController(listItem);
	});

	describe("object constructor", (): void => {
		it("should return a SeriesListController instance", (): Chai.Assertion => seriesListController.should.be.an.instanceOf(SeriesListController));
		it("should set the list item", (): Chai.Assertion => seriesListController["listItem"].should.equal(listItem));
	});

	describe("view", (): void => {
		it("should return the series list view", (): Chai.Assertion => seriesListController.view.should.equal(SeriesListView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(seriesListController, "viewItem" as keyof SeriesListController);
			sinon.stub(seriesListController, "editItem" as keyof SeriesListController);
			sinon.stub(seriesListController, "deleteItem" as keyof SeriesListController);
			sinon.stub(seriesListController, "goBack" as keyof SeriesListController);
			sinon.stub(seriesListController, "addItem" as keyof SeriesListController);
			sinon.stub(seriesListController, "listRetrieved" as keyof SeriesListController);
			SeriesMock.series = items;
			seriesListController.setup();
			leftButton = seriesListController.header.leftButton as NavButton;
			rightButton = seriesListController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(seriesListController.header.label).should.equal(listItem.program.programName));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			seriesListController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Programs"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			seriesListController["addItem"].should.have.been.called;
		});

		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("+"));

		it("should attach a view event handler to the series list", (): void => {
			(seriesListController["seriesList"] as ListMock).viewEventHandler(0);
			seriesListController["viewItem"].should.have.been.calledWith(0);
		});

		it("should attach an edit event handler to the series list", (): void => {
			((seriesListController["seriesList"] as ListMock).editEventHandler as Function)();
			seriesListController["editItem"].should.have.been.called;
		});

		it("should attach a delete event handler to the series list", (): void => {
			((seriesListController["seriesList"] as ListMock).deleteEventHandler as Function)();
			seriesListController["deleteItem"].should.have.been.called;
		});

		it("should get the list of series for the program", (): void => {
			SeriesMock.listByProgram.should.have.been.calledWith(listItem.program.id, sinon.match.func);
			seriesListController["listRetrieved"].should.have.been.calledWith(items);
		});
	});

	describe("activate", (): void => {
		beforeEach((): void => {
			sinon.stub(seriesListController, "viewItems" as keyof SeriesListController);
			seriesListController["seriesList"] = new ListMock("", "", "", [
				{ ...items[0] },
				{ ...items[1] }
			], sinon.stub());
		});

		describe("from programs view", (): void => {
			beforeEach((): void => seriesListController.activate());

			it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
			it("should set the list to view mode", (): Chai.Assertion => seriesListController["viewItems"].should.have.been.called);
		});

		describe("from series or episodes view", (): void => {
			let seriesListItem: SeriesListItem;

			describe("edit", (): void => {
				beforeEach((): void => {
					sinon.stub(seriesListController, "deleteItem" as keyof SeriesListController);
					items[0] = { ...items[0], seriesName: "edited-series" } as SeriesMock;
					seriesListItem = {
						listIndex: 0,
						series: { ...items[0] } as SeriesMock
					};
				});

				describe("program changed", (): void => {
					beforeEach((): void => {
						seriesListItem.series.programId = "2";
						seriesListController.activate(seriesListItem);
					});

					it("should not update the program episode count", (): Chai.Assertion => listItem.program.setEpisodeCount.should.not.have.been.called);
					it("should not update the program watched count", (): Chai.Assertion => listItem.program.setWatchedCount.should.not.have.been.called);
					it("should not update the program recorded count", (): Chai.Assertion => listItem.program.setRecordedCount.should.not.have.been.called);
					it("should not update the program expected count", (): Chai.Assertion => listItem.program.setExpectedCount.should.not.have.been.called);
					it("should remove the item from the list", (): Chai.Assertion => seriesListController["deleteItem"].should.have.been.calledWith(seriesListItem.listIndex, true));
					it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
					it("should not scroll the list", (): Chai.Assertion => seriesListController["seriesList"].scrollTo.should.not.have.been.called);
					it("should set the list to view mode", (): Chai.Assertion => seriesListController["viewItems"].should.have.been.called);
				});

				describe("program not changed", (): void => {
					beforeEach((): void => {
						seriesListController["origEpisodeCount"] = 2;
						seriesListController["origWatchedCount"] = 0;
						seriesListController["origRecordedCount"] = 1;
						seriesListController["origExpectedCount"] = 2;
					});

					describe("series name unchanged", (): void => {
						beforeEach((): void => {
							seriesListController["origSeriesName"] = seriesListItem.series.seriesName;
							seriesListController.activate(seriesListItem);
						});

						it("should update the item in the series list and resort by series name", (): Chai.Assertion => seriesListController["seriesList"].items.should.deep.equal(items));
						it("should update the program episode count", (): Chai.Assertion => listItem.program.setEpisodeCount.should.have.been.calledWith(7));
						it("should update the program watched count", (): Chai.Assertion => listItem.program.setWatchedCount.should.have.been.calledWith(3));
						it("should update the program recorded count", (): Chai.Assertion => listItem.program.setRecordedCount.should.have.been.calledWith(2));
						it("should update the program expected count", (): Chai.Assertion => listItem.program.setExpectedCount.should.have.been.calledWith(1));
						it("should not remove the item from the list", (): Chai.Assertion => seriesListController["deleteItem"].should.not.have.been.called);
						it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
						it("should not scroll the list", (): Chai.Assertion => seriesListController["seriesList"].scrollTo.should.not.have.been.called);
						it("should set the list to view mode", (): Chai.Assertion => seriesListController["viewItems"].should.have.been.called);
					});

					describe("series name changed", (): void => {
						beforeEach((): void => {
							seriesListController["origSeriesName"] = "original-program";
							seriesListController.activate(seriesListItem);
						});

						it("should update the item in the series list and resort by series name", (): Chai.Assertion => seriesListController["seriesList"].items.should.deep.equal(items));
						it("should update the program episode count", (): Chai.Assertion => listItem.program.setEpisodeCount.should.have.been.calledWith(7));
						it("should update the program watched count", (): Chai.Assertion => listItem.program.setWatchedCount.should.have.been.calledWith(3));
						it("should update the program recorded count", (): Chai.Assertion => listItem.program.setRecordedCount.should.have.been.calledWith(2));
						it("should update the program expected count", (): Chai.Assertion => listItem.program.setExpectedCount.should.have.been.calledWith(1));
						it("should not remove the item from the list", (): Chai.Assertion => seriesListController["deleteItem"].should.not.have.been.called);
						it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
						it("should scroll the list", (): Chai.Assertion => seriesListController["seriesList"].scrollTo.should.have.been.calledWith("1"));
						it("should set the list to view mode", (): Chai.Assertion => seriesListController["viewItems"].should.have.been.called);
					});
				});
			});

			describe("add", (): void => {
				let sortedItems: SeriesMock[];

				beforeEach((): void => {
					seriesListItem = { series: new SeriesMock("3", "new-series", null, "1", programName) };
					sortedItems = [
						items[0],
						seriesListItem.series as SeriesMock,
						items[1]
					];
					seriesListController.activate(seriesListItem);
				});

				it("should add the item to the series list and resort by series name", (): Chai.Assertion => seriesListController["seriesList"].items.should.deep.equal(sortedItems));
				it("should increment the program series count", (): Chai.Assertion => listItem.program.seriesCount.should.equal(2));
				it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
				it("should scroll the list", (): Chai.Assertion => seriesListController["seriesList"].scrollTo.should.have.been.calledWith("3"));
				it("should set the list to view mode", (): Chai.Assertion => seriesListController["viewItems"].should.have.been.called);
			});
		});
	});

	describe("listRetrieved", (): void => {
		beforeEach((): void => {
			sinon.stub(seriesListController, "activate");
			seriesListController["seriesList"] = new ListMock("", "", "", []);
			seriesListController["listRetrieved"](items);
		});

		it("should set the series list items", (): Chai.Assertion => seriesListController["seriesList"].items.should.deep.equal(items));
		it("should activate the controller", (): Chai.Assertion => seriesListController.activate.should.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", (): void => {
			seriesListController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		let index: number;

		beforeEach((): void => {
			index = 0;
			seriesListController["seriesList"] = new ListMock("", "", "", items);
			seriesListController["viewItem"](index);
		});

		it("should save the current series details", (): void => {
			String(seriesListController["origSeriesName"]).should.equal(items[0].seriesName);
			seriesListController["origEpisodeCount"].should.equal(3);
			seriesListController["origWatchedCount"].should.equal(1);
			seriesListController["origRecordedCount"].should.equal(1);
			seriesListController["origExpectedCount"].should.equal(1);
		});

		it("should push the episodes view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("episodes", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("addItem", (): void => {
		it("should push the series view with no selected item", (): void => {
			seriesListController["addItem"]();
			appController.pushView.should.have.been.calledWithExactly("series", { program: listItem.program });
		});
	});

	describe("editItem", (): void => {
		let index: number;

		beforeEach((): void => {
			index = 0;
			seriesListController["seriesList"] = new ListMock("", "", "", items);
			seriesListController["editItem"](index);
		});

		it("should save the current series details", (): void => {
			String(seriesListController["origSeriesName"]).should.equal(items[0].seriesName);
			seriesListController["origEpisodeCount"].should.equal(3);
			seriesListController["origWatchedCount"].should.equal(1);
			seriesListController["origRecordedCount"].should.equal(1);
			seriesListController["origExpectedCount"].should.equal(1);
		});

		it("should push the program view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("series", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("deleteItem", (): void => {
		interface Scenario {
			description: string;
			dontRemove: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "moving",
				dontRemove: true
			},
			{
				description: "deleting",
				dontRemove: false
			}
		];

		let index: number,
				item: SeriesMock;

		beforeEach((): void => {
			index = 0;
			item = { ...items[0], save: sinon.stub(), remove: sinon.stub() };
			seriesListController["seriesList"] = new ListMock("", "", "", [item]);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => seriesListController["deleteItem"](index, scenario.dontRemove));

				it("should decrement the program episode count", (): Chai.Assertion => listItem.program.setEpisodeCount.should.have.been.calledWith(3));
				it("should decrement the program watched count", (): Chai.Assertion => listItem.program.setWatchedCount.should.have.been.calledWith(1));
				it("should decrement the program recorded count", (): Chai.Assertion => listItem.program.setRecordedCount.should.have.been.calledWith(1));
				it("should decrement the program expected count", (): Chai.Assertion => listItem.program.setExpectedCount.should.have.been.calledWith(1));
				it("should decrement the program series count", (): Chai.Assertion => listItem.program.seriesCount.should.equal(0));

				if (!scenario.dontRemove) {
					it("should remove the item from the database", (): Chai.Assertion => item.remove.should.have.been.called);
				}

				it("should remove the item from the series list", (): Chai.Assertion => seriesListController["seriesList"].items.should.deep.equal([]));
				it("should refresh the list", (): Chai.Assertion => seriesListController["seriesList"].refresh.should.have.been.called);
			});
		});
	});

	describe("deleteItems", (): void => {
		let	footer: HeaderFooter,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(seriesListController, "listRetrieved" as keyof SeriesListController);
			sinon.stub(seriesListController, "viewItems" as keyof SeriesListController);
			seriesListController.setup();
			seriesListController["deleteItems"]();
			footer = seriesListController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion => String((seriesListController["seriesList"] as ListMock).action).should.equal("delete"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			seriesList.hasClass("delete").should.be.true;
			seriesList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			seriesListController["viewItems"].should.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("editItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton;

		beforeEach((): void => {
			sinon.stub(seriesListController, "listRetrieved" as keyof SeriesListController);
			sinon.stub(seriesListController, "viewItems" as keyof SeriesListController);
			seriesListController.setup();
			seriesListController["editItems"]();
			footer = seriesListController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion => (seriesListController["seriesList"] as ListMock).action.should.equal("edit"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			seriesList.hasClass("delete").should.be.false;
			seriesList.hasClass("edit").should.be.true;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			seriesListController["viewItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(leftButton.style).should.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(seriesListController, "listRetrieved" as keyof SeriesListController);
			sinon.stub(seriesListController, "editItems" as keyof SeriesListController);
			sinon.stub(seriesListController, "deleteItems" as keyof SeriesListController);
			seriesListController.setup();
			seriesListController["viewItems"]();
			footer = seriesListController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion => (seriesListController["seriesList"] as ListMock).action.should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			seriesList.hasClass("delete").should.be.false;
			seriesList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			seriesListController["editItems"].should.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			seriesListController["deleteItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(rightButton.style).should.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	afterEach((): JQuery<HTMLElement> => seriesList.remove());
});