define(
	[
		'models/episode-model',
		'controllers/episodes-controller',
		'components/list',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock',
		'framework/jquery.ui.touch-punch'
	],

	function(Episode, EpisodesController, List, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("episodes-controller", {
			setup: function() {
				this.listItem = {
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
						setEpisodeCount: function(count) {
							this.episodeCount = count;
						},
						setWatchedCount: function(count) {
							this.watchedCount = count;
						},
						setRecordedCount: function(count) {
							this.recordedCount = count;
						},
						setExpectedCount: function(count) {
							this.expectedCount = count;
						},
						setStatusWarning: function(count) {
							this.statusWarningCount = count;
						}
					}
				};
				this.items = [{
					id: 1,
					episodeName: "test-episode",
					status: "Watched",
					statusWarning: "warning",
					remove: function() {
						QUnit.ok(true, "Remove episode");
					}
				}];

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
				$("<ul>")
					.attr("id", "list")
					.appendTo(this.sandbox);

				this.episodesController = new EpisodesController(this.listItem);
			},
			teardown: function() {
				this.sandbox.remove();
			}
		});

		QUnit.test("object constructor", 3, function() {
			QUnit.ok(this.episodesController, "Instantiate EpisodesController object");
			QUnit.deepEqual(this.episodesController.listItem, this.listItem, "listItem property");
			QUnit.ok(this.episodesController.scrollToFirstUnwatched, "scrollToFirstUnwatched property");
		});

		QUnit.test("setup", function() {
			var testParams = [
				{
					description: "with source",
					expected: this.listItem.source
				},
				{
					description: "without source",
					noSource: true,
					expected: "Series"
				}
			];

			this.episodesController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.episodesController.deleteItem = function() {
				QUnit.ok(true, "Bind list delete event handler");
			};
			this.episodesController.onPopulateListItem = function() {
				QUnit.ok(true, "Bind list populate event handler");
			};
			this.episodesController.goBack = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.episodesController.addItem = function() {
				QUnit.ok(true, "Bind add action event handler");
			};
			this.episodesController.editItems = function() {
				QUnit.ok(true, "Bind edit action event handler");
			};
			this.episodesController.deleteItems = function() {
				QUnit.ok(true, "Bind delete action event handler");
			};

			Episode.episodes = this.items;

			QUnit.expect(testParams.length * 11);

			for (var i = 0; i < testParams.length; i++) {
				jQueryMock.setDefaultContext(this.sandbox);
				if (testParams[i].noSource) {
					this.listItem.source = null;
				}
				this.episodesController.setup();
				QUnit.equal(this.episodesController.header.label, this.listItem.series.programName + " : " + this.listItem.series.seriesName, testParams[i].description + " - Header label");
				QUnit.equal(this.episodesController.header.leftButton.label, testParams[i].expected, testParams[i].description + " - Back button label");
				this.episodesController.header.leftButton.eventHandler();
				this.episodesController.header.rightButton.eventHandler();
				QUnit.deepEqual(this.episodesController.episodeList.items, this.items, testParams[i].description + " - List items");
				QUnit.equal(this.episodesController.episodeList.action, "view", testParams[i].description + " - List action");
				this.episodesController.footer.leftButton.eventHandler();
				this.episodesController.footer.rightButton.eventHandler();
				jQueryMock.clearDefaultContext();
			}
		});

		QUnit.test("goBack", 1, function() {
			this.episodesController.goBack();
		});

		QUnit.test("activate", function() {
			var testParams = [
				{
					description: "update",
					addEpisodes: 0,
					addWatched: 0,
					addRecorded: 0,
					addExpected: 0,
					addStatusWarning: 0,
					listItem: {
						listIndex: 0,
						episode: {
							episodeName: "test-episode-2",
							status: "Watched"
						}
					}
				},
				{
					description: "update",
					addEpisodes: 0,
					addWatched: -1,
					addRecorded: 1,
					addExpected: 0,
					addStatusWarning: 0,
					listItem: {
						listIndex: 0,
						episode: {
							episodeName: "test-episode-2",
							status: "Recorded"
						}
					}
				},
				{
					description: "add",
					addEpisodes: 1,
					addWatched: 0,
					addRecorded: 0,
					addExpected: 1,
					addStatusWarning: 1,
					listItem: {
						listIndex: -1,
						episode: {
							episodeName: "test-episode-2",
							status: "Expected",
							statusWarning: "warning"
						}
					}
				}
			];

			QUnit.expect(testParams.length * 6);
			for (var i = 0; i < testParams.length; i++) {
				var origEpisodeCount = this.listItem.series.episodeCount;
				var origWatchedCount = this.listItem.series.watchedCount;
				var origRecordedCount = this.listItem.series.recordedCount;
				var origExpectedCount = this.listItem.series.expectedCount;
				var origStatusWarningCount = this.listItem.series.statusWarningCount;
				var itemsCopy = JSON.parse(JSON.stringify(this.items));
				this.episodesController.episodeList = new List(null, null, null, JSON.parse(JSON.stringify(this.items)));
				this.episodesController.origWatchedCount = 1;
				this.episodesController.origRecordedCount = 0;
				this.episodesController.origExpectedCount = 0;
				this.episodesController.origStatusWarningCount = 0;
				this.episodesController.activate(testParams[i].listItem);
				itemsCopy[testParams[i].listItem.listIndex * -1] = testParams[i].listItem.episode;
				QUnit.deepEqual(this.episodesController.episodeList.items, itemsCopy, testParams[i].description + " - List items");
				QUnit.equal(this.episodesController.listItem.series.episodeCount, origEpisodeCount + testParams[i].addEpisodes, testParams[i].description + " - listItem.series.episodeCount property");
				QUnit.equal(this.episodesController.listItem.series.watchedCount, origWatchedCount + testParams[i].addWatched, testParams[i].description + " - listItem.series.watchedCount property");
				QUnit.equal(this.episodesController.listItem.series.recordedCount, origRecordedCount + testParams[i].addRecorded, testParams[i].description + " - listItem.series.recordedCount property");
				QUnit.equal(this.episodesController.listItem.series.expectedCount, origExpectedCount + testParams[i].addExpected, testParams[i].description + " - listItem.series.expectedCount property");
				QUnit.equal(this.episodesController.listItem.series.statusWarningCount, origStatusWarningCount + testParams[i].addStatusWarning, testParams[i].description + " - listItem.series.statusWarningCount property");
			}
		});

		QUnit.test("onPopulateListItem", function() {
			var testParams = [
				{
					description: "watched",
					status: "Watched",
					scrollPos: 1,
					scrollToFirstUnwatched: true
				},
				{
					description: "not watched",
					status: "",
					scrollPos: 0,
					scrollToFirstUnwatched: false
				},
				{
					description: "another not watched",
					status: "",
					scrollPos: 0,
					scrollToFirstUnwatched: false
				}
			];

			var listItem = $("<li>")
				.outerHeight(1)
				.hide()
				.appendTo(this.sandbox);

			$("<a>")
				.attr("id", "test-episode")
				.hide()
				.appendTo(listItem);

			QUnit.expect(testParams.length * 2);
			jQueryMock.setDefaultContext(this.sandbox);
			for (var i = 0; i < testParams.length; i++) {
				appController.viewStack = [{ scrollPos: 0 }];
				this.episodesController.onPopulateListItem({
					id: "test-episode",
					status: testParams[i].status
				});
				QUnit.equal(appController.viewStack[0].scrollPos, testParams[i].scrollPos, testParams[i].description + " - Scroll position");
				QUnit.equal(this.episodesController.scrollToFirstUnwatched, testParams[i].scrollToFirstUnwatched, testParams[i].description + " - scrollToFirstUnwathced property");
			}
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("viewItem", function() {
			var testParams = [
				{
					description: "Watched",
					statusWarning: "warning",
					expectedWatchedCount: 1,
					expectedRecordedCount: 0,
					expectedExpectedCount: 0,
					expectedStatusWarningCount: 1
				},
				{
					description: "Recorded",
					statusWarning: null,
					expectedWatchedCount: 0,
					expectedRecordedCount: 1,
					expectedExpectedCount: 0,
					expectedStatusWarningCount: 0
				},
				{
					description: "Expected",
					statusWarning: null,
					expectedWatchedCount: 0,
					expectedRecordedCount: 0,
					expectedExpectedCount: 1,
					expectedStatusWarningCount: 0
				}
			];

			var index = 0;

			QUnit.expect(testParams.length * 6);

			for (var i = 0; i < testParams.length; i++) {
				this.items[index].status = testParams[i].description;
				this.items[index].statusWarning = testParams[i].statusWarning;
				this.episodesController.episodeList = { items: this.items };
				this.episodesController.viewItem(index);
				QUnit.equal(this.episodesController.origWatchedCount, testParams[i].expectedWatchedCount, testParams[i].description + " - watchedCount property");
				QUnit.equal(this.episodesController.origRecordedCount, testParams[i].expectedRecordedCount, testParams[i].description + " - recordedCount property");
				QUnit.equal(this.episodesController.origExpectedCount, testParams[i].expectedExpectedCount, testParams[i].description + " - expectedCount property");
				QUnit.equal(this.episodesController.origStatusWarningCount, testParams[i].expectedStatusWarningCount, testParams[i].description + " - statusWarningCount property");
				QUnit.deepEqual(appController.viewArgs, { listIndex: index, episode: this.items[index] }, testParams[i].description + " - View arguments");
			}
		});

		QUnit.test("addItem", 2, function() {
			this.episodesController.episodeList = { items: this.items };
			this.episodesController.addItem();
			QUnit.deepEqual(appController.viewArgs, { series: this.listItem.series, sequence: this.items.length }, "View arguments");
		});

		QUnit.test("deleteItem", function() {
			var testParams = [
				{
					description: "Watched",
					statusWarning: "warning",
					expectedWatchedCount: 1,
					expectedRecordedCount: 0,
					expectedExpectedCount: 0,
					expectedStatusWarningCount: 1
				},
				{
					description: "Recorded",
					statusWarning: null,
					expectedWatchedCount: 0,
					expectedRecordedCount: 1,
					expectedExpectedCount: 0,
					expectedStatusWarningCount: 0
				},
				{
					description: "Expected",
					statusWarning: null,
					expectedWatchedCount: 0,
					expectedRecordedCount: 0,
					expectedExpectedCount: 1,
					expectedStatusWarningCount: 0
				}
			];

			var index = 0;

			QUnit.expect(testParams.length * 8);

			for (var i = 0; i < testParams.length; i++) {
				this.items[index].status = testParams[i].description;
				this.items[index].statusWarning = testParams[i].statusWarning;
				jQueryMock.setDefaultContext(this.sandbox);
				var list = $("#list");

				$("<a>")
					.attr("id", this.items[index].id)
					.hide()
					.appendTo($("<li>")
						.hide()
						.appendTo(list));

				this.episodesController.episodeList = new List(null, null, null, this.items.slice(0));

				var origEpisodeCount = this.listItem.series.episodeCount;
				var origWatchedCount = this.listItem.series.watchedCount;
				var origRecordedCount = this.listItem.series.recordedCount;
				var origExpectedCount = this.listItem.series.expectedCount;
				var origStatusWarningCount = this.listItem.series.statusWarningCount;

				this.episodesController.deleteItem(index);
				QUnit.equal(this.episodesController.listItem.series.episodeCount, origEpisodeCount - 1, testParams[i].description + " - listItem.series.episodeCount property");
				QUnit.equal(this.episodesController.listItem.series.watchedCount, origWatchedCount - testParams[i].expectedWatchedCount, testParams[i].description + " - listItem.series.watchedCount property");
				QUnit.equal(this.episodesController.listItem.series.recordedCount, origRecordedCount - testParams[i].expectedRecordedCount, testParams[i].description + " - listItem.series.recordedCount property");
				QUnit.equal(this.episodesController.listItem.series.expectedCount, origExpectedCount - testParams[i].expectedExpectedCount, testParams[i].description + " - listItem.series.expectedCount property");
				QUnit.equal(this.episodesController.listItem.series.statusWarningCount, origStatusWarningCount - testParams[i].expectedStatusWarningCount, testParams[i].description + " - listItem.series.statusWarningCount property");
				QUnit.deepEqual(this.episodesController.episodeList.items, this.items.slice(1), testParams[i].description + " - List items");
				QUnit.equal($("#list li a").length, 0, testParams[i].description + " - Remove list item from DOM");
				jQueryMock.clearDefaultContext();
			}
		});

		QUnit.test("deleteItems", 3, function() {
			this.episodesController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.episodesController.episodeList = new List();

			jQueryMock.setDefaultContext(this.sandbox);
			this.episodesController.deleteItems();
			QUnit.equal(this.episodesController.episodeList.action, "delete", "List action");
			QUnit.ok($("#list").hasClass("delete"), "Set list delete style");
			this.episodesController.footer.rightButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("requenceItems", function() {
			var save = function() {
				QUnit.ok(true, "Save episode " + this.sequence);
			};

			var items = [
				{
					id: "1",
					sequence: 1,
					save: save
				},
				{
					id: "2",
					sequence: 2,
					save: save
				},
				{
					id: "3",
					sequence: 3,
					save: save
				},
				{
					id: "4",
					sequence: 3,
					save: save
				}
			];

			var sortedItems = [
				items[1],
				items[0],
				items[2],
				items[3]
			];

			jQueryMock.setDefaultContext(this.sandbox);
			var list = $("#list");

			for (var i = 0; i < items.length; i++) {
				$("<a>")
					.attr("id", sortedItems[i].id)
					.hide()
					.appendTo($("<li>")
						.hide()
						.appendTo(list));
			}

			this.episodesController.episodeList = new List(null, null, null, items);
			QUnit.expect(items.length - 1);
			this.episodesController.resequenceItems();
			QUnit.deepEqual(this.episodesController.episodeList.items, sortedItems, "List items");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("editItems", 3, function() {
			this.episodesController.resequenceItems = function() {
			};
			this.episodesController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.episodesController.episodeList = new List();
			this.episodesController.editItems();
			QUnit.equal(this.episodesController.episodeList.action, "edit", "List action");
			QUnit.ok($("#list").hasClass("edit"), "Set list edit style");
			this.episodesController.footer.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("sortItems", 1, function() {
			var e = {
				clientY: 100
			};

			var ui = {
				helper: $("<div>")
					.appendTo(document.body)
					.offset({top: 0})
			};

			this.episodesController.sortItems(e, ui);
			QUnit.equal(ui.helper.offset().top, 80, "UI helper offset top");
			ui.helper.remove();
		});
	}
);
