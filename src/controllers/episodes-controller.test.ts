import type {
	HeaderFooter,
	NavButton,
	NavButtonAsyncEventHandler,
	NavButtonEventHandler,
	SeriesListItem,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import EpisodeMock from "~/mocks/episode-model-mock";
import type { EpisodeStatus } from "~/models";
import EpisodesController from "~/controllers/episodes-controller";
import EpisodesView from "~/views/episodes-view.html";
import ListMock from "~/mocks/list-mock";
import SeriesMock from "~/mocks/series-model-mock";
import Sortable from "sortablejs";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("EpisodesController", (): void => {
	let listItem: SeriesListItem,
		items: EpisodeMock[],
		episodeList: HTMLUListElement,
		episodesController: EpisodesController;

	beforeEach((): void => {
		listItem = {
			source: "test-source",
			series: new SeriesMock(
				1,
				"test-series",
				null,
				2,
				"test-program",
				6,
				2,
				2,
				2,
				0,
				2,
			),
		};

		items = [new EpisodeMock(1, "test-episode", "watched", "", 1)];

		episodeList = document.createElement("ul");
		episodeList.id = "list";
		document.body.append(episodeList);

		episodesController = new EpisodesController(listItem);
	});

	describe("object constructor", (): void => {
		it("should return a EpisodesController instance", (): Chai.Assertion =>
			expect(episodesController).to.be.an.instanceOf(EpisodesController));
		it("should set the list item", (): Chai.Assertion =>
			expect(episodesController["listItem"]).to.equal(listItem));
		it("should enable scrolling to the first unwatched episode", (): Chai.Assertion =>
			expect(episodesController["scrollToFirstUnwatched"]).to.be.true);
	});

	describe("view", (): void => {
		it("should return the episodes view", (): Chai.Assertion =>
			expect(episodesController.view).to.equal(EpisodesView));
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
				leftButtonLabel: "source",
			},
			{
				description: "from series list",
				leftButtonLabel: "Series",
			},
		];

		let leftButton: NavButton, rightButton: NavButton;

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

				it("should set the header label", (): Chai.Assertion =>
					expect(String(episodesController.header.label)).to.equal(
						`${listItem.series.programName} : ${listItem.series.seriesName}`,
					));

				it("should attach a header left button event handler", (): void => {
					(leftButton.eventHandler as NavButtonEventHandler)();
					expect(episodesController["goBack"]).to.have.been.called;
				});

				it("should set the header left button style", (): Chai.Assertion =>
					expect(String(leftButton.style)).to.equal("backButton"));
				it("should set the header left button label", (): Chai.Assertion =>
					expect(leftButton.label).to.equal(scenario.leftButtonLabel));

				it("should attach a header right button event handler", (): void => {
					(rightButton.eventHandler as NavButtonEventHandler)();
					expect(episodesController["addItem"]).to.have.been.called;
				});

				it("should set the header right button label", (): Chai.Assertion =>
					expect(rightButton.label).to.equal("+"));

				it("should attach a view event handler to the episodes list", (): void => {
					(episodesController["episodeList"] as ListMock).viewEventHandler(0);
					expect(episodesController["viewItem"]).to.have.been.calledWith(0);
				});

				it("should attach a delete event handler to the episodes list", (): void => {
					(episodesController["episodeList"] as ListMock).deleteEventHandler(0);
					expect(episodesController["deleteItem"]).to.have.been.calledWith(0);
				});

				it("should prepare the list for sorting", (): void => {
					expect(episodesController["sortable"]).to.equal(
						Sortable.get(episodeList),
					);
					expect(Boolean(episodesController["sortable"].option("disabled"))).to
						.be.true;
				});

				it("should activate the controller", (): Chai.Assertion =>
					expect(episodesController["activate"]).to.have.been.called);
			});
		});
	});

	describe("activate", (): void => {
		beforeEach((): void => {
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			episodesController["episodeList"] = new ListMock("", "", "", []);
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				EpisodeMock.episodes = items;
				await episodesController.activate();
			});

			it("should get the list of episodes for the series", (): void => {
				expect(EpisodeMock.list).to.have.been.calledWith(listItem.series.id);
				expect(episodesController["episodeList"].items).to.deep.equal(items);
			});

			it("should refresh the list", (): Chai.Assertion =>
				expect(episodesController["episodeList"].refresh).to.have.been.called);
			it("should set the list to view mode", (): Chai.Assertion =>
				expect(episodesController["viewItems"]).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				EpisodeMock.error = "activate failed";
				await episodesController.activate();
			});

			it("should not refresh the list", (): Chai.Assertion =>
				expect(episodesController["episodeList"].refresh).to.not.have.been
					.called);
			it("should not set the list to view mode", (): Chai.Assertion =>
				expect(episodesController["viewItems"]).to.not.have.been.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "activate failed",
				}));

			afterEach((): null => (EpisodeMock.error = null));
		});
	});

	describe("contentShown", (): void => {
		beforeEach(
			(): ListMock =>
				(episodesController["episodeList"] = new ListMock("", "", "", [
					items[0],
				])),
		);

		describe("don't scroll to first unwatched", (): void => {
			beforeEach((): void => {
				episodesController["scrollToFirstUnwatched"] = false;
				episodesController.contentShown();
			});

			it("should not scroll to the first unwatched episode", (): Chai.Assertion =>
				expect(episodesController["episodeList"].scrollTo).to.not.have.been
					.called);
		});

		describe("scroll to first unwatched", (): void => {
			beforeEach(
				(): boolean => (episodesController["scrollToFirstUnwatched"] = true),
			);

			describe("all watched", (): void => {
				beforeEach((): void => episodesController.contentShown());

				it("should not scroll", (): Chai.Assertion =>
					expect(episodesController["episodeList"].scrollTo).to.not.have.been
						.called);
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion =>
					expect(episodesController["scrollToFirstUnwatched"]).to.be.false);
			});

			describe("none watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{ id: 1 },
						{ id: 2 },
						{ id: 3 },
					] as EpisodeMock[];
					episodesController.contentShown();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion =>
					expect(
						episodesController["episodeList"].scrollTo,
					).to.have.been.calledWith("1"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion =>
					expect(episodesController["scrollToFirstUnwatched"]).to.be.false);
			});

			describe("some watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{ id: 1, status: "watched" },
						{ id: 2, status: "watched" },
						{ id: 3 },
					] as EpisodeMock[];
					episodesController.contentShown();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion =>
					expect(
						episodesController["episodeList"].scrollTo,
					).to.have.been.calledWith("3"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion =>
					expect(episodesController["scrollToFirstUnwatched"]).to.be.false);
			});
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await episodesController["goBack"]();
			expect(appController.popView).to.have.been.called;
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
				status: "watched",
				watched: 1,
				recorded: 0,
				expected: 0,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "recorded",
				status: "recorded",
				watched: 0,
				recorded: 1,
				expected: 0,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "expected",
				status: "expected",
				watched: 0,
				recorded: 0,
				expected: 1,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "warning",
				status: "",
				watched: 0,
				recorded: 0,
				expected: 0,
				statusWarning: "warning",
				warning: 1,
			},
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

				it("should push the episode view for the selected item", (): Chai.Assertion =>
					expect(appController.pushView).to.have.been.calledWith("episode", {
						listIndex: index,
						episode: items[index],
					}));
			});
		});
	});

	describe("addItem", (): void => {
		it("should push the episode view with no selected item", async (): Promise<void> => {
			episodesController["episodeList"] = new ListMock("", "", "", items);
			await episodesController["addItem"]();
			expect(appController.pushView).to.have.been.calledWithExactly("episode", {
				series: listItem.series,
				sequence: 1,
			});
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
				status: "watched",
				watched: 1,
				recorded: 0,
				expected: 0,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "recorded",
				status: "recorded",
				watched: 0,
				recorded: 1,
				expected: 0,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "expected",
				status: "expected",
				watched: 0,
				recorded: 0,
				expected: 1,
				statusWarning: "",
				warning: 0,
			},
			{
				description: "warning",
				status: "",
				watched: 0,
				recorded: 0,
				expected: 0,
				statusWarning: "warning",
				warning: 1,
			},
		];

		let itemLink: HTMLAnchorElement;

		beforeEach((): void => {
			const episodeListItem = document.createElement("li");

			itemLink = document.createElement("a");
			itemLink.id = `item-${String(items[0].id)}`;
			episodeListItem.append(itemLink);
			episodeList.append(episodeListItem);

			sinon.stub(
				episodesController,
				"resequenceItems" as keyof EpisodesController,
			);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					items[0].status = scenario.status;
					items[0].statusWarning = scenario.statusWarning;
					episodesController["episodeList"] = new ListMock("", "", "", [
						items[0],
					]);
				});

				describe("success", (): void => {
					beforeEach(
						async (): Promise<void> => episodesController["deleteItem"](0),
					);

					it("should remove the item from the DOM", (): Chai.Assertion =>
						expect(episodeList.querySelector("li a#item-1")).to.be.null);
					it("should remove the item from the database", (): Chai.Assertion =>
						expect(items[0].remove).to.have.been.called);
					it("should remove the item from the episodes list", (): Chai.Assertion =>
						expect(episodesController["episodeList"].items).to.deep.equal([]));
					it("should refresh the list", (): Chai.Assertion =>
						expect(episodesController["resequenceItems"]).to.have.been.called);
				});

				describe("failure", (): void => {
					beforeEach(async (): Promise<void> => {
						EpisodeMock.error = "delete failed";
						await episodesController["deleteItem"](0);
					});

					it("should attempt to remove the item from the database", (): Chai.Assertion =>
						expect(items[0].remove).to.have.been.called);
					it("should not remove the item from the episode list", (): Chai.Assertion =>
						expect(episodesController["episodeList"].items).to.deep.equal([
							items[0],
						]));
					it("should not remove the item from the DOM", (): Chai.Assertion =>
						expect(episodeList.querySelector("li a#item-1")).to.deep.equal(
							itemLink,
						));
					it("should not refresh the list", (): Chai.Assertion =>
						expect(episodesController["resequenceItems"]).to.not.have.been
							.called);
					it("should display a notice to the user", (): Chai.Assertion =>
						expect(appController.showNotice).to.have.been.calledWith({
							label: "delete failed",
						}));

					afterEach((): null => (EpisodeMock.error = null));
				});
			});
		});
	});

	describe("deleteItems", (): void => {
		let footer: HeaderFooter, rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodesController, "activate");
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			await episodesController.setup();
			episodesController["deleteItems"]();
			footer = episodesController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion =>
			expect((episodesController["episodeList"] as ListMock).action).to.equal(
				"delete",
			));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(episodeList.classList.contains("delete")).to.be.true;
			expect(episodeList.classList.contains("edit")).to.be.false;
		});

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(episodesController["viewItems"]).to.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Done"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	describe("resequenceItems", (): void => {
		let sortedItems: EpisodeMock[];

		beforeEach((): void => {
			items = [
				new EpisodeMock(1, "", "", "", 2, false, false, 1),
				{
					id: 2,
					sequence: 2,
					save: sinon.stub(),
					remove: sinon.stub(),
				} as EpisodeMock,
				{
					id: 3,
					sequence: 3,
					save: sinon.stub(),
					remove: sinon.stub(),
				} as EpisodeMock,
				{
					id: 4,
					sequence: 3,
					save: sinon.stub(),
					remove: sinon.stub(),
				} as EpisodeMock,
			];

			sortedItems = [items[1], items[0], items[2], items[3]];

			episodeList.append(
				...sortedItems.map((item: EpisodeMock): HTMLLIElement => {
					const itemLink = document.createElement("a"),
						episodeListItem = document.createElement("li");

					itemLink.id = `item-${String(item.id)}`;
					episodeListItem.append(itemLink);

					return episodeListItem;
				}),
			);

			episodesController["episodeList"] = new ListMock("", "", "", items);
		});

		describe("success", (): void => {
			beforeEach(
				async (): Promise<void> => episodesController["resequenceItems"](),
			);

			it("should update the sequence of items that have changed position", (): void => {
				expect(items[0].save).to.have.been.called;
				expect(items[1].save).to.have.been.called;
				expect(items[2].save).to.not.have.been.called;
				expect(items[3].save).to.not.have.been.called;
			});

			it("should sort the list by sequence", (): Chai.Assertion =>
				expect(episodesController["episodeList"].items).to.deep.equal(
					sortedItems,
				));
			it("should refresh the list", (): Chai.Assertion =>
				expect(episodesController["episodeList"].refresh).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				EpisodeMock.error = "resequence failed";
				await episodesController["resequenceItems"]();
			});

			it("should attempt to update the sequence of items that have changed position", (): void => {
				expect(items[0].save).to.have.been.called;
				expect(items[1].save).to.have.been.called;
				expect(items[2].save).to.not.have.been.called;
				expect(items[3].save).to.not.have.been.called;
			});

			it("should not sort the list by sequence", (): Chai.Assertion =>
				expect(episodesController["episodeList"].items).to.deep.equal(items));
			it("should not refresh the list", (): Chai.Assertion =>
				expect(episodesController["episodeList"].refresh).to.not.have.been
					.called);

			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "resequence failed",
				}));

			afterEach((): null => (EpisodeMock.error = null));
		});
	});

	describe("editItems", (): void => {
		let footer: HeaderFooter, leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodesController, "activate");
			sinon.stub(
				episodesController,
				"resequenceItems" as keyof EpisodesController,
			);
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			await episodesController.setup();
			episodesController["editItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion =>
			expect((episodesController["episodeList"] as ListMock).action).to.equal(
				"edit",
			));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(episodeList.classList.contains("delete")).to.be.false;
			expect(episodeList.classList.contains("edit")).to.be.true;
		});

		it("should enable sorting", (): Chai.Assertion =>
			expect(Boolean(episodesController["sortable"].option("disabled"))).to.be
				.false);

		it("should attach a footer left button event handler", async (): Promise<void> => {
			await (leftButton.eventHandler as NavButtonAsyncEventHandler)();
			expect(episodesController["resequenceItems"]).to.have.been.called;
			expect(episodesController["viewItems"]).to.have.been.called;
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
			sinon.stub(episodesController, "activate");
			sinon.stub(episodesController, "editItems" as keyof EpisodesController);
			sinon.stub(episodesController, "deleteItems" as keyof EpisodesController);
			await episodesController.setup();
			episodesController["viewItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion =>
			expect((episodesController["episodeList"] as ListMock).action).to.equal(
				"view",
			));
		it("should clear the view footer", (): Chai.Assertion =>
			expect(appController.clearFooter).to.have.been.called);

		it("should set the list item icons", (): void => {
			expect(episodeList.classList.contains("delete")).to.be.false;
			expect(episodeList.classList.contains("edit")).to.be.false;
		});

		it("should disable sorting", (): Chai.Assertion =>
			expect(Boolean(episodesController["sortable"].option("disabled"))).to.be
				.true);

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(episodesController["editItems"]).to.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Sort"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(episodesController["deleteItems"]).to.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion =>
			expect(appController.setFooter).to.have.been.called);
	});

	afterEach((): void => {
		SeriesMock.reset();
		EpisodeMock.reset();
		episodeList.remove();
	});
});
