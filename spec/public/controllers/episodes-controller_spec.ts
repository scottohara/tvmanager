import type {
	HeaderFooter,
	NavButton,
	NavButtonAsyncEventHandler,
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeMock from "mocks/episode-model-mock";
import type { EpisodeStatus } from "models";
import EpisodesController from "controllers/episodes-controller";
import EpisodesView from "views/episodes-view.html";
import ListMock from "mocks/list-mock";
import SeriesMock from "mocks/series-model-mock";
import Sortable from "sortablejs";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("EpisodesController", (): void => {
	let listItem: SeriesListItem,
			items: EpisodeMock[],
			episodeList: HTMLUListElement,
			episodesController: EpisodesController;

	beforeEach((): void => {
		listItem = {
			source: "test-source",
			series: new SeriesMock("1", "test-series", null, null, "test-program", 6, 2, 2, 2, 0, 2)
		};

		items = [new EpisodeMock("1", "test-episode", "Watched", "")];

		episodeList = document.createElement("ul");
		episodeList.id = "list";
		document.body.append(episodeList);

		episodesController = new EpisodesController(listItem);
	});

	describe("object constructor", (): void => {
		it("should return a EpisodesController instance", (): Chai.Assertion => episodesController.should.be.an.instanceOf(EpisodesController));
		it("should set the list item", (): Chai.Assertion => episodesController["listItem"].should.equal(listItem));
		it("should enable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.true);
	});

	describe("view", (): void => {
		it("should return the episodes view", (): Chai.Assertion => episodesController.view.should.equal(EpisodesView));
	});

	describe("setup", (): void => {
		interface Scenario {
			description: string;
			source?: string;
			leftButtonLabel: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "from source",
				source: "source",
				leftButtonLabel: "source"
			},
			{
				description: "from series list",
				leftButtonLabel: "Series"
			}
		];

		let leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(episodesController, "viewItem" as keyof EpisodesController);
			sinon.stub(episodesController, "deleteItem" as keyof EpisodesController);
			sinon.stub(episodesController, "goBack" as keyof EpisodesController);
			sinon.stub(episodesController, "addItem" as keyof EpisodesController);
			sinon.stub(episodesController, "activate");
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					listItem.source = scenario.source;
					await episodesController.setup();
					leftButton = episodesController.header.leftButton as NavButton;
					rightButton = episodesController.header.rightButton as NavButton;
				});

				it("should set the header label", (): Chai.Assertion => String(episodesController.header.label).should.equal(`${listItem.series.programName} : ${listItem.series.seriesName}`));

				it("should attach a header left button event handler", (): void => {
					(leftButton.eventHandler as NavButtonEventHandler)();
					episodesController["goBack"].should.have.been.called;
				});

				it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
				it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal(scenario.leftButtonLabel));

				it("should attach a header right button event handler", (): void => {
					(rightButton.eventHandler as NavButtonEventHandler)();
					episodesController["addItem"].should.have.been.called;
				});

				it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("+"));

				it("should attach a view event handler to the episodes list", (): void => {
					(episodesController["episodeList"] as ListMock).viewEventHandler(0);
					episodesController["viewItem"].should.have.been.calledWith(0);
				});

				it("should attach a delete event handler to the episodes list", (): void => {
					(episodesController["episodeList"] as ListMock).deleteEventHandler(0);
					episodesController["deleteItem"].should.have.been.calledWith(0);
				});

				it("should prepare the list for sorting", (): void => {
					episodesController["sortable"].should.equal(Sortable.get(episodeList));
					Boolean(episodesController["sortable"].option("disabled")).should.be.true;
				});

				it("should activate the controller", (): Chai.Assertion => episodesController.activate.should.have.been.called);
			});
		});
	});

	describe("activate", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			episodesController["episodeList"] = new ListMock("", "", "", []);
			EpisodeMock.episodes = items;
			await episodesController.activate();
		});

		it("should get the list of episodes for the series", (): void => {
			EpisodeMock.listBySeries.should.have.been.calledWith(listItem.series.id);
			episodesController["episodeList"].items.should.deep.equal(items);
		});

		it("should refresh the list", (): Chai.Assertion => episodesController["episodeList"].refresh.should.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => episodesController["viewItems"].should.have.been.called);
	});

	describe("contentShown", (): void => {
		beforeEach((): ListMock => (episodesController["episodeList"] = new ListMock("", "", "", [{ ...items[0] } as EpisodeMock])));

		describe("don't scroll to first unwatched", (): void => {
			beforeEach((): void => {
				episodesController["scrollToFirstUnwatched"] = false;
				episodesController.contentShown();
			});

			it("should not scroll to the first unwatched episode", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.not.have.been.called);
		});

		describe("scroll to first unwatched", (): void => {
			beforeEach((): boolean => (episodesController["scrollToFirstUnwatched"] = true));

			describe("all watched", (): void => {
				beforeEach((): void => episodesController.contentShown());

				it("should not scroll", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.not.have.been.called);
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});

			describe("none watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{ id: "1" },
						{ id: "2" },
						{ id: "3" }
					] as EpisodeMock[];
					episodesController.contentShown();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.have.been.calledWith("1"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});

			describe("some watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{ id: "1", status: "Watched" },
						{ id: "2", status: "Watched" },
						{ id: "3" }
					] as EpisodeMock[];
					episodesController.contentShown();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.have.been.calledWith("3"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await episodesController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			watched: number;
			recorded: number;
			expected: number;
			statusWarning: "" | "warning";
			warning: number;
		}

		const scenarios: Scenario[] = [
			{
				description: "watched",
				status: "Watched",
				watched: 1,
				recorded: 0,
				expected: 0,
				statusWarning: "",
				warning: 0
			},
			{
				description: "recorded",
				status: "Recorded",
				watched: 0,
				recorded: 1,
				expected: 0,
				statusWarning: "",
				warning: 0
			},
			{
				description: "expected",
				status: "Expected",
				watched: 0,
				recorded: 0,
				expected: 1,
				statusWarning: "",
				warning: 0
			},
			{
				description: "warning",
				status: "",
				watched: 0,
				recorded: 0,
				expected: 0,
				statusWarning: "warning",
				warning: 1
			}
		];

		let index: number;

		beforeEach((): number => (index = 0));

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					items[0].status = scenario.status;
					items[0].statusWarning = scenario.statusWarning;
					episodesController["episodeList"] = new ListMock("", "", "", items);
					await episodesController["viewItem"](index);
				});

				it("should push the episode view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("episode", {
					listIndex: index,
					episode: items[index]
				}));
			});
		});
	});

	describe("addItem", (): void => {
		it("should push the episode view with no selected item", async (): Promise<void> => {
			episodesController["episodeList"] = new ListMock("", "", "", items);
			await episodesController["addItem"]();
			appController.pushView.should.have.been.calledWithExactly("episode", { series: listItem.series, sequence: 1 });
		});
	});

	describe("deleteItem", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			watched: number;
			recorded: number;
			expected: number;
			statusWarning: "" | "warning";
			warning: number;
		}

		const scenarios: Scenario[] = [
			{
				description: "watched",
				status: "Watched",
				watched: 1,
				recorded: 0,
				expected: 0,
				statusWarning: "",
				warning: 0
			},
			{
				description: "recorded",
				status: "Recorded",
				watched: 0,
				recorded: 1,
				expected: 0,
				statusWarning: "",
				warning: 0
			},
			{
				description: "expected",
				status: "Expected",
				watched: 0,
				recorded: 0,
				expected: 1,
				statusWarning: "",
				warning: 0
			},
			{
				description: "warning",
				status: "",
				watched: 0,
				recorded: 0,
				expected: 0,
				statusWarning: "warning",
				warning: 1
			}
		];

		let index: number,
				item: EpisodeMock;

		beforeEach((): void => {
			const itemLink = document.createElement("a"),
						episodeListItem = document.createElement("li");

			itemLink.id = `item-${String(items[0].id)}`;
			episodeListItem.append(itemLink);
			episodeList.append(episodeListItem);

			index = 0;
			sinon.stub(episodesController, "resequenceItems" as keyof EpisodesController);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					item = {
						...items[0],
						status: scenario.status,
						statusWarning: scenario.statusWarning,
						save: sinon.stub(),
						remove: sinon.stub()
					};
					episodesController["episodeList"] = new ListMock("", "", "", [item]);
					await episodesController["deleteItem"](index);
				});

				it("should remove the item from the DOM", (): Chai.Assertion => (null === episodeList.querySelector("li a#item-1")).should.be.true);
				it("should remove the item from the database", (): Chai.Assertion => item.remove.should.have.been.called);
				it("should remove the item from the episodes list", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal([]));
				it("should refresh the list", (): Chai.Assertion => episodesController["resequenceItems"].should.have.been.called);
			});
		});
	});

	describe("deleteItems", (): void => {
		let	footer: HeaderFooter,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodesController, "activate");
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			await episodesController.setup();
			await episodesController["deleteItems"]();
			footer = episodesController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("delete"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.classList.contains("delete").should.be.true;
			episodeList.classList.contains("edit").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			episodesController["viewItems"].should.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("resequenceItems", (): void => {
		let sortedItems: EpisodeMock[];

		beforeEach(async (): Promise<void> => {
			items = [
				{ ...new EpisodeMock("1", null, "", "", "", false, false, 1), save: sinon.stub(), remove: sinon.stub() },
				{ ...new EpisodeMock("2", null, "", "", "", false, false, 2), save: sinon.stub(), remove: sinon.stub() },
				{ ...new EpisodeMock("3", null, "", "", "", false, false, 3), save: sinon.stub(), remove: sinon.stub() },
				{ ...new EpisodeMock("4", null, "", "", "", false, false, 3), save: sinon.stub(), remove: sinon.stub() }
			];

			sortedItems = [
				items[1],
				items[0],
				items[2],
				items[3]
			];

			episodeList.append(...sortedItems.map((item: EpisodeMock): HTMLLIElement => {
				const itemLink = document.createElement("a"),
							episodeListItem = document.createElement("li");

				itemLink.id = `item-${String(item.id)}`;
				episodeListItem.append(itemLink);

				return episodeListItem;
			}));

			episodesController["episodeList"] = new ListMock("", "", "", items);
			await episodesController["resequenceItems"]();
		});

		it("should update the sequence of items that have changed position", (): void => {
			items[0].save.should.have.been.called;
			items[1].save.should.have.been.called;
			items[2].save.should.not.have.been.called;
			items[3].save.should.not.have.been.called;
		});

		it("should sort the list by sequence", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal(sortedItems));
		it("should refresh the list", (): Chai.Assertion => episodesController["episodeList"].refresh.should.have.been.called);
	});

	describe("editItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodesController, "activate");
			sinon.stub(episodesController, "resequenceItems" as keyof EpisodesController);
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			await episodesController.setup();
			await episodesController["editItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("edit"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.classList.contains("delete").should.be.false;
			episodeList.classList.contains("edit").should.be.true;
		});

		it("should enable sorting", (): Chai.Assertion => Boolean(episodesController["sortable"].option("disabled")).should.be.false);

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", async (): Promise<void> => {
			await (leftButton.eventHandler as NavButtonAsyncEventHandler)();
			episodesController["resequenceItems"].should.have.been.called;
			episodesController["viewItems"].should.have.been.called;
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
			sinon.stub(episodesController, "activate");
			sinon.stub(episodesController, "editItems" as keyof EpisodesController);
			sinon.stub(episodesController, "deleteItems" as keyof EpisodesController);
			await episodesController.setup();
			await episodesController["viewItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.classList.contains("delete").should.be.false;
			episodeList.classList.contains("edit").should.be.false;
		});

		it("should disable sorting", (): Chai.Assertion => Boolean(episodesController["sortable"].option("disabled")).should.be.true);

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			episodesController["editItems"].should.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Sort"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			episodesController["deleteItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(rightButton.style).should.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	afterEach((): void => episodeList.remove());
});