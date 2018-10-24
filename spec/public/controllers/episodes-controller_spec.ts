import {
	EpisodeListItem,
	HeaderFooter,
	NavButton,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeMock from "mocks/episode-model-mock";
import {EpisodeStatus} from "models";
import EpisodesController from "controllers/episodes-controller";
import EpisodesView from "views/episodes-view.html";
import ListMock from "mocks/list-mock";
import SeriesMock from "mocks/series-model-mock";
import WindowMock from "mocks/window-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("EpisodesController", (): void => {
	let listItem: SeriesListItem,
			items: EpisodeMock[],
			episodeList: JQuery<HTMLElement>,
			episodesController: EpisodesController;

	beforeEach((): void => {
		listItem = {
			source: "test-source",
			series: new SeriesMock("1", "test-series", null, null, "test-program", 6, 2, 2, 2, 0, 2)
		};

		items = [new EpisodeMock("1", "test-episode", "Watched", "")];

		episodeList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

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
			sinon.stub(episodesController, "listRetrieved" as keyof EpisodesController);
			EpisodeMock.episodes = items;
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					listItem.source = scenario.source;
					episodesController.setup();
					leftButton = episodesController.header.leftButton as NavButton;
					rightButton = episodesController.header.rightButton as NavButton;
				});

				it("should set the header label", (): Chai.Assertion => String(episodesController.header.label).should.equal(`${listItem.series.programName} : ${listItem.series.seriesName}`));

				it("should attach a header left button event handler", (): void => {
					(leftButton.eventHandler as Function)();
					episodesController["goBack"].should.have.been.called;
				});

				it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
				it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal(scenario.leftButtonLabel));

				it("should attach a header right button event handler", (): void => {
					(rightButton.eventHandler as Function)();
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

				it("should get the list of episodes for the series", (): void => {
					EpisodeMock.listBySeries.should.have.been.calledWith(listItem.series.id, sinon.match.func);
					episodesController["listRetrieved"].should.have.been.calledWith(items);
				});
			});
		});
	});

	describe("activate", (): void => {
		beforeEach((): void => {
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			episodesController["episodeList"] = new ListMock("", "", "", [{...items[0]}]);
			episodesController["scrollToFirstUnwatched"] = false;
			WindowMock.setTimeout.resetHistory();
		});

		describe("from series list view", (): void => {
			beforeEach((): void => episodesController.activate());

			it("should refresh the list", (): Chai.Assertion => episodesController["episodeList"].refresh.should.have.been.called);
			it("should not scroll to the first unwatched episode", (): Chai.Assertion => WindowMock.setTimeout.should.not.have.been.called);
			it("should set the list to view mode", (): Chai.Assertion => episodesController["viewItems"].should.have.been.called);
		});

		describe("from episode view", (): void => {
			interface Scenario {
				description: string;
				status: EpisodeStatus;
				watched?: true;
				recorded?: true;
				expected?: true;
				statusWarning: "" | "warning";
				warning?: true;
			}

			let episodeListItem: EpisodeListItem;

			const scenarios: Scenario[] = [
				{
					description: "watched",
					status: "Watched",
					statusWarning: "",
					watched: true
				},
				{
					description: "recorded",
					status: "Recorded",
					statusWarning: "",
					recorded: true
				},
				{
					description: "expected",
					status: "Expected",
					statusWarning: "",
					expected: true
				},
				{
					description: "warning",
					status: "",
					statusWarning: "warning",
					warning: true
				}
			];

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					describe("edit", (): void => {
						beforeEach((): void => {
							episodeListItem = {
								listIndex: 0,
								episode: {
									...items[0],
									episodeName: "edited-episode",
									status: scenario.status,
									statusWarning: scenario.statusWarning
								} as EpisodeMock
							};
							episodesController["origWatchedCount"] = 1;
							episodesController["origRecordedCount"] = 0;
							episodesController["origExpectedCount"] = 0;
							episodesController["origStatusWarningCount"] = 1;
							items[0] = episodeListItem.episode as EpisodeMock;
							episodesController["activate"](episodeListItem);
						});

						it("should update the item in the episodes list", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal(items));
						it("should update the series watched count", (): Chai.Assertion => listItem.series.setWatchedCount.should.have.been.calledWith(1 + (Number(scenario.watched) || 0)));
						it("should update the series recorded count", (): Chai.Assertion => listItem.series.setRecordedCount.should.have.been.calledWith(2 + (Number(scenario.recorded) || 0)));
						it("should update the series expected count", (): Chai.Assertion => listItem.series.setExpectedCount.should.have.been.calledWith(2 + (Number(scenario.expected) || 0)));
						it("should update the series status warning count", (): Chai.Assertion => listItem.series.setStatusWarning.should.have.been.calledWith(1 + (Number(scenario.warning) || 0)));
						it("should refresh the list", (): Chai.Assertion => episodesController["episodeList"].refresh.should.have.been.called);
						it("should not scroll to the first unwatched episode", (): Chai.Assertion => WindowMock.setTimeout.should.not.have.been.called);
						it("should set the list to view mode", (): Chai.Assertion => episodesController["viewItems"].should.have.been.called);
					});

					describe("add", (): void => {
						beforeEach((): void => {
							episodeListItem = {episode: new EpisodeMock(null, "new-episode", scenario.status, "")};
							episodeListItem.episode.statusWarning = scenario.statusWarning;
							items.push(episodeListItem.episode as EpisodeMock);
							episodesController.activate(episodeListItem);
						});

						it("should add the item to the episodes list", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal(items));
						it("should increment the series episode count", (): Chai.Assertion => listItem.series.setEpisodeCount.should.have.been.calledWith(7));
						it("should increment the series watched count", (): Chai.Assertion => listItem.series.setWatchedCount.should.have.been.calledWith(2 + (Number(scenario.watched) || 0)));
						it("should increment the series recorded count", (): Chai.Assertion => listItem.series.setRecordedCount.should.have.been.calledWith(2 + (Number(scenario.recorded) || 0)));
						it("should increment the series expected count", (): Chai.Assertion => listItem.series.setExpectedCount.should.have.been.calledWith(2 + (Number(scenario.expected) || 0)));
						it("should increment the series status warning count", (): Chai.Assertion => listItem.series.setStatusWarning.should.have.been.calledWith(2 + (Number(scenario.warning) || 0)));
						it("should refresh the list", (): Chai.Assertion => episodesController["episodeList"].refresh.should.have.been.called);
						it("should not scroll to the first unwatched episode", (): Chai.Assertion => WindowMock.setTimeout.should.not.have.been.called);
						it("should set the list to view mode", (): Chai.Assertion => episodesController["viewItems"].should.have.been.called);
					});
				});
			});
		});

		describe("scroll to first unwatched", (): void => {
			beforeEach((): boolean => (episodesController["scrollToFirstUnwatched"] = true));

			describe("all watched", (): void => {
				beforeEach((): void => episodesController.activate());

				it("should not scroll", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.not.have.been.called);
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});

			describe("none watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{id: "1"},
						{id: "2"},
						{id: "3"}
					];
					episodesController.activate();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.have.been.calledWith("1"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});

			describe("some watched", (): void => {
				beforeEach((): void => {
					episodesController["episodeList"].items = [
						{id: "1", status: "Watched"},
						{id: "2", status: "Watched"},
						{id: "3"}
					];
					episodesController.activate();
				});

				it("should scroll to the first unwatched episode", (): Chai.Assertion => episodesController["episodeList"].scrollTo.should.have.been.calledWith("3"));
				it("should disable scrolling to the first unwatched episode", (): Chai.Assertion => episodesController["scrollToFirstUnwatched"].should.be.false);
			});
		});
	});

	describe("listRetrieved", (): void => {
		beforeEach((): void => {
			sinon.stub(episodesController, "activate");
			episodesController["episodeList"] = new ListMock("", "", "", []);
			episodesController["listRetrieved"](items);
		});

		it("should set the episode list items", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal(items));
		it("should activate the controller", (): Chai.Assertion => episodesController.activate.should.have.been.called);
	});

	describe("goBack", (): void => {
		it("should pop the view", (): void => {
			episodesController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			watched?: 1;
			recorded?: 1;
			expected?: 1;
			statusWarning: "" | "warning";
			warning?: 1;
		}

		const scenarios: Scenario[] = [
			{
				description: "watched",
				status: "Watched",
				statusWarning: "",
				watched: 1
			},
			{
				description: "recorded",
				status: "Recorded",
				statusWarning: "",
				recorded: 1
			},
			{
				description: "expected",
				status: "Expected",
				statusWarning: "",
				expected: 1
			},
			{
				description: "warning",
				status: "",
				statusWarning: "warning",
				warning: 1
			}
		];

		let index: number;

		beforeEach((): number => (index = 0));

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					items[0].status = scenario.status;
					items[0].statusWarning = scenario.statusWarning;
					episodesController["episodeList"] = new ListMock("", "", "", items);
					episodesController["viewItem"](index);
				});

				it("should save the current episode details", (): void => {
					episodesController["origWatchedCount"].should.equal(scenario.watched || 0);
					episodesController["origRecordedCount"].should.equal(scenario.recorded || 0);
					episodesController["origExpectedCount"].should.equal(scenario.expected || 0);
					episodesController["origStatusWarningCount"].should.equal(scenario.warning || 0);
				});

				it("should push the episode view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("episode", {
					listIndex: index,
					episode: items[index]
				}));
			});
		});
	});

	describe("addItem", (): void => {
		it("should push the episode view with no selected item", (): void => {
			episodesController["episodeList"] = new ListMock("", "", "", items);
			episodesController["addItem"]();
			appController.pushView.should.have.been.calledWithExactly("episode", {series: listItem.series, sequence: 1});
		});
	});

	describe("deleteItem", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			watched?: 1;
			recorded?: 1;
			expected?: 1;
			statusWarning: "" | "warning";
			warning?: 1;
		}

		const scenarios: Scenario[] = [
			{
				description: "watched",
				status: "Watched",
				statusWarning: "",
				watched: 1
			},
			{
				description: "recorded",
				status: "Recorded",
				statusWarning: "",
				recorded: 1
			},
			{
				description: "expected",
				status: "Expected",
				statusWarning: "",
				expected: 1
			},
			{
				description: "warning",
				status: "",
				statusWarning: "warning",
				warning: 1
			}
		];

		let index: number,
				item: EpisodeMock;

		beforeEach((): void => {
			index = 0;
			sinon.stub(episodesController, "resequenceItems" as keyof EpisodesController);

			$("<a>")
				.attr("id", items[0].id)
				.hide()
				.appendTo($("<li>")
					.hide()
					.appendTo(episodeList));
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					item = {
						...items[0],
						status: scenario.status,
						statusWarning: scenario.statusWarning,
						save: sinon.stub(),
						remove: sinon.stub()
					};
					episodesController["episodeList"] = new ListMock("", "", "", [item]);
					episodesController["deleteItem"](index);
				});

				it("should decrement the series episode count", (): Chai.Assertion => listItem.series.setEpisodeCount.should.have.been.calledWith(5));
				it("should decrement the series watched count", (): Chai.Assertion => listItem.series.setWatchedCount.should.have.been.calledWith(2 - (scenario.watched || 0)));
				it("should decrement the series recorded count", (): Chai.Assertion => listItem.series.setRecordedCount.should.have.been.calledWith(2 - (scenario.recorded || 0)));
				it("should decrement the series expected count", (): Chai.Assertion => listItem.series.setExpectedCount.should.have.been.calledWith(2 - (scenario.expected || 0)));
				it("should decrement the series status warning count", (): Chai.Assertion => listItem.series.setStatusWarning.should.have.been.calledWith(2 - (scenario.warning || 0)));
				it("should remove the item from the DOM", (): Chai.Assertion => $("#list li a#1").length.should.equal(0));
				it("should remove the item from the database", (): Chai.Assertion => item.remove.should.have.been.called);
				it("should remove the item from the episodes list", (): Chai.Assertion => episodesController["episodeList"].items.should.deep.equal([]));
				it("should refresh the list", (): Chai.Assertion => episodesController["resequenceItems"].should.have.been.called);
			});
		});
	});

	describe("deleteItems", (): void => {
		let	footer: HeaderFooter,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(episodesController, "listRetrieved" as keyof EpisodesController);
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			episodesController.setup();
			episodesController["deleteItems"]();
			footer = episodesController.footer as HeaderFooter;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to delete mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("delete"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.hasClass("delete").should.be.true;
			episodeList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			episodesController["viewItems"].should.have.been.called;
		});

		it("should set the footer right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("resequenceItems", (): void => {
		let sortedItems: EpisodeMock[];

		beforeEach((): void => {
			items = [
				{...new EpisodeMock("1", null, "", "", false, false, 1), save: sinon.stub(), remove: sinon.stub()},
				{...new EpisodeMock("2", null, "", "", false, false, 2), save: sinon.stub(), remove: sinon.stub()},
				{...new EpisodeMock("3", null, "", "", false, false, 3), save: sinon.stub(), remove: sinon.stub()},
				{...new EpisodeMock("4", null, "", "", false, false, 3), save: sinon.stub(), remove: sinon.stub()}
			];

			sortedItems = [
				items[1],
				items[0],
				items[2],
				items[3]
			];

			episodeList.append(sortedItems.map((item: EpisodeMock): JQuery<HTMLElement> => $("<li>").append($("<a>").attr("id", item.id))));

			episodesController["episodeList"] = new ListMock("", "", "", items);

			episodesController["resequenceItems"]();
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

		beforeEach((): void => {
			sinon.stub(episodesController, "listRetrieved" as keyof EpisodesController);
			sinon.stub(episodesController, "resequenceItems" as keyof EpisodesController);
			sinon.stub(episodesController, "viewItems" as keyof EpisodesController);
			episodesController.setup();
			episodesController["editItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("edit"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.hasClass("delete").should.be.false;
			episodeList.hasClass("edit").should.be.true;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			episodesController["resequenceItems"].should.have.been.called;
			episodesController["viewItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(leftButton.style).should.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("sortItems", (): void => {
		it("should reposition the sort helper", (): void => {
			const helper: JQuery<HTMLElement> = $("<div>")
				.appendTo(document.body)
				.offset({top: 0});

			episodesController["sortItems"]({clientY: 100} as JQueryEventObject, {helper} as JQueryUI.SortableUIParams);
			(helper.offset() as JQuery.Coordinates).top.should.equal(80);
			helper.remove();
		});
	});

	describe("viewItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(episodesController, "listRetrieved" as keyof EpisodesController);
			sinon.stub(episodesController, "editItems" as keyof EpisodesController);
			sinon.stub(episodesController, "deleteItems" as keyof EpisodesController);
			episodesController.setup();
			episodesController["viewItems"]();
			footer = episodesController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion => (episodesController["episodeList"] as ListMock).action.should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", (): void => {
			episodeList.hasClass("delete").should.be.false;
			episodeList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			episodesController["editItems"].should.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Sort"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			episodesController["deleteItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(rightButton.style).should.equal("cautionButton"));
		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Delete"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	afterEach((): JQuery<HTMLElement> => episodeList.remove());
});