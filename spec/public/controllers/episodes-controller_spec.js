import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import Episode from "models/episode-model";
import EpisodesController from "controllers/episodes-controller";
import EpisodesView from "views/episodes-view.html";
import sinon from "sinon";
import window from "components/window";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("EpisodesController", () => {
	let listItem,
			items,
			episodeList,
			episodesController;

	beforeEach(() => {
		listItem = {
			source: "test-source",
			series: {
				id: 1,
				seriesName: "test-series",
				programName: "test-program",
				episodeCount: 6,
				watchedCount: 2,
				recordedCount: 2,
				expectedCount: 2,
				statusWarningCount: 2,
				setEpisodeCount: sinon.stub(),
				setWatchedCount: sinon.stub(),
				setRecordedCount: sinon.stub(),
				setExpectedCount: sinon.stub(),
				setStatusWarning: sinon.stub()
			}
		};

		items = [{
			id: 1,
			episodeName: "test-episode",
			status: "Watched",
			statusWarning: "warning"
		}];

		episodeList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		episodesController = new EpisodesController(listItem);
	});

	describe("object constructor", () => {
		it("should return a EpisodesController instance", () => episodesController.should.be.an.instanceOf(EpisodesController));
		it("should set the list item", () => episodesController.listItem.should.equal(listItem));
		it("should enable scrolling to the first unwatched episode", () => episodesController.scrollToFirstUnwatched.should.be.true);
	});

	describe("view", () => {
		it("should return the episodes view", () => episodesController.view.should.equal(EpisodesView));
	});

	describe("setup", () => {
		const testParams = [
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

		beforeEach(() => {
			sinon.stub(episodesController, "viewItem");
			sinon.stub(episodesController, "deleteItem");
			sinon.stub(episodesController, "goBack");
			sinon.stub(episodesController, "addItem");
			sinon.stub(episodesController, "listRetrieved");
			Episode.episodes = items;
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					listItem.source = params.source;
					episodesController.setup();
				});

				it("should set the header label", () => episodesController.header.label.should.equal(`${listItem.series.programName} : ${listItem.series.seriesName}`));

				it("should attach a header left button event handler", () => {
					episodesController.header.leftButton.eventHandler();
					episodesController.goBack.should.have.been.called;
				});

				it("should set the header left button style", () => episodesController.header.leftButton.style.should.equal("backButton"));
				it("should set the header left button label", () => episodesController.header.leftButton.label.should.equal(params.leftButtonLabel));

				it("should attach a header right button event handler", () => {
					episodesController.header.rightButton.eventHandler();
					episodesController.addItem.should.have.been.called;
				});

				it("should set the header right button label", () => episodesController.header.rightButton.label.should.equal("+"));

				it("should attach a view event handler to the episodes list", () => {
					episodesController.episodeList.viewEventHandler();
					episodesController.viewItem.should.have.been.called;
				});

				it("should attach a delete event handler to the episodes list", () => {
					episodesController.episodeList.deleteEventHandler();
					episodesController.deleteItem.should.have.been.called;
				});

				it("should get the list of episodes for the series", () => {
					Episode.listBySeries.should.have.been.calledWith(listItem.series.id, sinon.match.func);
					episodesController.listRetrieved.should.have.been.calledWith(items);
				});
			});
		});
	});

	describe("activate", () => {
		beforeEach(() => {
			sinon.stub(episodesController, "viewItems");
			episodesController.episodeList = {
				items: [Object.assign({}, items[0])],
				refresh: sinon.stub(),
				scrollTo: sinon.stub()
			};
			episodesController.scrollToFirstUnwatched = false;
		});

		describe("from series list view", () => {
			beforeEach(() => episodesController.activate());

			it("should refresh the list", () => episodesController.episodeList.refresh.should.have.been.called);
			it("should not scroll to the first unwatched episode", () => window.setTimeout.should.not.have.been.called);
			it("should set the list to view mode", () => episodesController.viewItems.should.have.been.called);
		});

		describe("from episode view", () => {
			const testParams = [
				{
					description: "watched",
					status: "Watched",
					watched: true
				},
				{
					description: "recorded",
					status: "Recorded",
					recorded: true
				},
				{
					description: "expected",
					status: "Expected",
					expected: true
				},
				{
					description: "warning",
					statusWarning: "warning",
					warning: true
				}
			];

			testParams.forEach(params => {
				describe(params.description, () => {
					describe("edit", () => {
						beforeEach(() => {
							listItem.listIndex = 0;
							listItem.episode = Object.assign(items[0], {
								episodeName: "edited-episode",
								status: params.status,
								statusWarning: params.statusWarning
							});
							episodesController.origWatchedCount = 1;
							episodesController.origRecordedCount = 0;
							episodesController.origExpectedCount = 0;
							episodesController.origStatusWarningCount = 1;
							items[0] = listItem.episode;
							episodesController.activate(listItem);
						});

						it("should update the item in the episodes list", () => episodesController.episodeList.items.should.deep.equal(items));
						it("should update the series watched count", () => listItem.series.setWatchedCount.should.have.been.calledWith(1 + (params.watched || 0)));
						it("should update the series recorded count", () => listItem.series.setRecordedCount.should.have.been.calledWith(2 + (params.recorded || 0)));
						it("should update the series expected count", () => listItem.series.setExpectedCount.should.have.been.calledWith(2 + (params.expected || 0)));
						it("should update the series status warning count", () => listItem.series.setStatusWarning.should.have.been.calledWith(1 + (params.warning || 0)));
						it("should refresh the list", () => episodesController.episodeList.refresh.should.have.been.called);
						it("should not scroll to the first unwatched episode", () => window.setTimeout.should.not.have.been.called);
						it("should set the list to view mode", () => episodesController.viewItems.should.have.been.called);
					});

					describe("add", () => {
						beforeEach(() => {
							listItem.episode = {
								episodeName: "new-episode",
								status: params.status,
								statusWarning: params.statusWarning
							};
							items.push(listItem.episode);
							episodesController.activate(listItem);
						});

						it("should add the item to the episodes list", () => episodesController.episodeList.items.should.deep.equal(items));
						it("should increment the series episode count", () => listItem.series.setEpisodeCount.should.have.been.calledWith(7));
						it("should increment the series watched count", () => listItem.series.setWatchedCount.should.have.been.calledWith(2 + (params.watched || 0)));
						it("should increment the series recorded count", () => listItem.series.setRecordedCount.should.have.been.calledWith(2 + (params.recorded || 0)));
						it("should increment the series expected count", () => listItem.series.setExpectedCount.should.have.been.calledWith(2 + (params.expected || 0)));
						it("should increment the series status warning count", () => listItem.series.setStatusWarning.should.have.been.calledWith(2 + (params.warning || 0)));
						it("should refresh the list", () => episodesController.episodeList.refresh.should.have.been.called);
						it("should not scroll to the first unwatched episode", () => window.setTimeout.should.not.have.been.called);
						it("should set the list to view mode", () => episodesController.viewItems.should.have.been.called);
					});
				});
			});
		});

		describe("scroll to first unwatched", () => {
			beforeEach(() => (episodesController.scrollToFirstUnwatched = true));

			describe("all watched", () => {
				beforeEach(() => {
					episodesController.activate();
				});

				it("should not scroll", () => episodesController.episodeList.scrollTo.should.not.have.been.called);
				it("should disable scrolling to the first unwatched episode", () => episodesController.scrollToFirstUnwatched.should.be.false);
			});

			describe("none watched", () => {
				beforeEach(() => {
					episodesController.episodeList.items = [
						{id: 1},
						{id: 2},
						{id: 3}
					];
					episodesController.activate();
				});

				it("should scroll to the first unwatched episode", () => episodesController.episodeList.scrollTo.should.have.been.calledWith(1));
				it("should disable scrolling to the first unwatched episode", () => episodesController.scrollToFirstUnwatched.should.be.false);
			});

			describe("some watched", () => {
				beforeEach(() => {
					episodesController.episodeList.items = [
						{id: 1, status: "Watched"},
						{id: 2, status: "Watched"},
						{id: 3}
					];
					episodesController.activate();
				});

				it("should scroll to the first unwatched episode", () => episodesController.episodeList.scrollTo.should.have.been.calledWith(3));
				it("should disable scrolling to the first unwatched episode", () => episodesController.scrollToFirstUnwatched.should.be.false);
			});
		});
	});

	describe("listRetrieved", () => {
		beforeEach(() => {
			sinon.stub(episodesController, "activate");
			episodesController.episodeList = {};
			episodesController.listRetrieved(items);
		});

		it("should set the episode list items", () => episodesController.episodeList.items.should.deep.equal(items));
		it("should activate the controller", () => episodesController.activate.should.have.been.called);
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			episodesController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", () => {
		const testParams = [
			{
				description: "watched",
				status: "Watched",
				watched: 1
			},
			{
				description: "recorded",
				status: "Recorded",
				recorded: 1
			},
			{
				description: "expected",
				status: "Expected",
				expected: 1
			},
			{
				description: "warning",
				statusWarning: "warning",
				warning: 1
			}
		];

		let index;

		beforeEach(() => (index = 0));

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					items[0].status = params.status;
					items[0].statusWarning = params.statusWarning;
					episodesController.episodeList = {items};
					episodesController.viewItem(index);
				});

				it("should save the current episode details", () => {
					episodesController.origWatchedCount.should.equal(params.watched || 0);
					episodesController.origRecordedCount.should.equal(params.recorded || 0);
					episodesController.origExpectedCount.should.equal(params.expected || 0);
					episodesController.origStatusWarningCount.should.equal(params.warning || 0);
				});

				it("should push the episode view for the selected item", () => appController.pushView.should.have.been.calledWith("episode", {
					listIndex: index,
					episode: items[index]
				}));
			});
		});
	});

	describe("addItem", () => {
		it("should push the episode view with no selected item", () => {
			episodesController.episodeList = {items};
			episodesController.addItem();
			appController.pushView.should.have.been.calledWithExactly("episode", {series: listItem.series, sequence: 1});
		});
	});

	describe("deleteItem", () => {
		const testParams = [
			{
				description: "watched",
				status: "Watched",
				watched: 1
			},
			{
				description: "recorded",
				status: "Recorded",
				recorded: 1
			},
			{
				description: "expected",
				status: "Expected",
				expected: 1
			},
			{
				description: "warning",
				statusWarning: "warning",
				warning: 1
			}
		];

		let index,
				item;

		beforeEach(() => {
			index = 0;
			sinon.stub(episodesController, "resequenceItems");

			$("<a>")
				.attr("id", items[0].id)
				.hide()
				.appendTo($("<li>")
					.hide()
					.appendTo(episodeList));
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					item = Object.assign(items[0], {
						status: params.status,
						statusWarning: params.statusWarning,
						remove: sinon.stub()
					});
					episodesController.episodeList = {items: [item]};
					episodesController.deleteItem(index);
				});

				it("should decrement the series episode count", () => listItem.series.setEpisodeCount.should.have.been.calledWith(5));
				it("should decrement the series watched count", () => listItem.series.setWatchedCount.should.have.been.calledWith(2 - (params.watched || 0)));
				it("should decrement the series recorded count", () => listItem.series.setRecordedCount.should.have.been.calledWith(2 - (params.recorded || 0)));
				it("should decrement the series expected count", () => listItem.series.setExpectedCount.should.have.been.calledWith(2 - (params.expected || 0)));
				it("should decrement the series status warning count", () => listItem.series.setStatusWarning.should.have.been.calledWith(2 - (params.warning || 0)));
				it("should remove the item from the DOM", () => $("#list li a#1").length.should.equal(0));
				it("should remove the item from the database", () => item.remove.should.have.been.called);
				it("should remove the item from the episodes list", () => episodesController.episodeList.items.should.deep.equal([]));
				it("should refresh the list", () => episodesController.resequenceItems.should.have.been.called);
			});
		});
	});

	describe("deleteItems", () => {
		beforeEach(() => {
			sinon.stub(episodesController, "listRetrieved");
			sinon.stub(episodesController, "viewItems");
			episodesController.setup();
			episodesController.deleteItems();
		});

		it("should set the list to delete mode", () => episodesController.episodeList.action.should.equal("delete"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			episodeList.hasClass("delete").should.be.true;
			episodeList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", () => episodesController.footer.label.should.equal("v1.0"));

		it("should attach a footer right button event handler", () => {
			episodesController.footer.rightButton.eventHandler();
			episodesController.viewItems.should.have.been.called;
		});

		it("should set the footer right button style", () => episodesController.footer.rightButton.style.should.equal("confirmButton"));
		it("should set the footer right button label", () => episodesController.footer.rightButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("resequenceItems", () => {
		let sortedItems;

		beforeEach(() => {
			items = [
				{
					id: "1",
					sequence: 1,
					save: sinon.stub()
				},
				{
					id: "2",
					sequence: 2,
					save: sinon.stub()
				},
				{
					id: "3",
					sequence: 3,
					save: sinon.stub()
				},
				{
					id: "4",
					sequence: 3,
					save: sinon.stub()
				}
			];

			sortedItems = [
				items[1],
				items[0],
				items[2],
				items[3]
			];

			episodeList.append(sortedItems.map(item => $("<li>").append($("<a>").attr("id", item.id))));

			episodesController.episodeList = {
				items,
				refresh: sinon.stub()
			};

			episodesController.resequenceItems();
		});

		it("should update the sequence of items that have changed position", () => {
			items[0].save.should.have.been.called;
			items[1].save.should.have.been.called;
			items[2].save.should.not.have.been.called;
			items[3].save.should.not.have.been.called;
		});

		it("should sort the list by sequence", () => episodesController.episodeList.items.should.deep.equal(sortedItems));
		it("should refresh the list", () => episodesController.episodeList.refresh.should.have.been.called);
	});

	describe("editItems", () => {
		beforeEach(() => {
			sinon.stub(episodesController, "listRetrieved");
			sinon.stub(episodesController, "resequenceItems");
			sinon.stub(episodesController, "viewItems");
			episodesController.setup();
			episodesController.editItems();
		});

		it("should set the list to edit mode", () => episodesController.episodeList.action.should.equal("edit"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			episodeList.hasClass("delete").should.be.false;
			episodeList.hasClass("edit").should.be.true;
		});

		it("should set the footer label", () => episodesController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			episodesController.footer.leftButton.eventHandler();
			episodesController.resequenceItems.should.have.been.called;
			episodesController.viewItems.should.have.been.called;
		});

		it("should set the footer left button style", () => episodesController.footer.leftButton.style.should.equal("confirmButton"));
		it("should set the footer left button label", () => episodesController.footer.leftButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("sortItems", () => {
		it("should reposition the sort helper", () => {
			const helper = $("<div>")
				.appendTo(document.body)
				.offset({top: 0});

			episodesController.sortItems({clientY: 100}, {helper});
			helper.offset().top.should.equal(80);
			helper.remove();
		});
	});

	describe("viewItems", () => {
		beforeEach(() => {
			sinon.stub(episodesController, "listRetrieved");
			sinon.stub(episodesController, "editItems");
			sinon.stub(episodesController, "deleteItems");
			episodesController.setup();
			episodesController.viewItems();
		});

		it("should set the list to view mode", () => episodesController.episodeList.action.should.equal("view"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			episodeList.hasClass("delete").should.be.false;
			episodeList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", () => episodesController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			episodesController.footer.leftButton.eventHandler();
			episodesController.editItems.should.have.been.called;
		});

		it("should set the footer left button label", () => episodesController.footer.leftButton.label.should.equal("Sort"));

		it("should attach a footer right button event handler", () => {
			episodesController.footer.rightButton.eventHandler();
			episodesController.deleteItems.should.have.been.called;
		});

		it("should set the footer left button style", () => episodesController.footer.rightButton.style.should.equal("cautionButton"));
		it("should set the footer right button label", () => episodesController.footer.rightButton.label.should.equal("Delete"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	afterEach(() => episodeList.remove());
});