define(
	[
		'models/series-model',
		'controllers/seriesList-controller',
		'components/list',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function(Series, SeriesListController, List, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("seriesList-controller", {
			setup: function() {
				this.listItem = {
					program: {
						id: 1,
						programName: "test-program",
						seriesCount: 1,
						episodeCount: 6,
						watchedCount: 2,
						recordedCount: 2,
						expectedCount: 2,
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
						}
					}
				};
				this.items = [{
					seriesName: "test-series",
					programId: 1,
					episodeCount: 3,
					watchedCount: 1,
					recordedCount: 1,
					expectedCount: 1,
					remove: function() {
						QUnit.ok(true, "Remove series");
					}
				}];

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
				$("<ul>")
					.attr("id", "list")
					.appendTo(this.sandbox);

				this.seriesListController = new SeriesListController(this.listItem);
			},
			teardown: function() {
				this.sandbox.remove();
			}
		});

		QUnit.test("object constructor", 2, function() {
			QUnit.ok(this.seriesListController, "Instantiate SeriesListController object");
			QUnit.deepEqual(this.seriesListController.listItem, this.listItem, "listItem property");
		});

		QUnit.test("setup", 10, function() {
			this.seriesListController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.seriesListController.editItem = function() {
				QUnit.ok(true, "Bind list edit event handler");
			};
			this.seriesListController.deleteItem = function() {
				QUnit.ok(true, "Bind list delete event handler");
			};
			this.seriesListController.goBack = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.seriesListController.addItem = function() {
				QUnit.ok(true, "Bind add action event handler");
			};
			this.seriesListController.editItems = function() {
				QUnit.ok(true, "Bind edit action event handler");
			};
			this.seriesListController.deleteItems = function() {
				QUnit.ok(true, "Bind delete action event handler");
			};

			Series.series = this.items;

			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesListController.setup();
			QUnit.equal(this.seriesListController.header.label, this.listItem.program.programName, "Header label");
			this.seriesListController.header.leftButton.eventHandler();
			this.seriesListController.header.rightButton.eventHandler();
			QUnit.deepEqual(this.seriesListController.seriesList.items, this.items, "List items");
			QUnit.equal(this.seriesListController.seriesList.action, "view", "List action");
			this.seriesListController.footer.leftButton.eventHandler();
			this.seriesListController.footer.rightButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("goBack", 1, function() {
			this.seriesListController.goBack();
		});

		QUnit.test("activate - move", 2, function() {
			var listItem = {
				listIndex: 0,
				series: {
					programId: 2
				}
			};

			this.seriesListController.deleteItem = function(index, dontRemove) {
				QUnit.equal(index, listItem.listIndex, "List index to delete");
				QUnit.ok(dontRemove, "Skip database delete");
			};

			this.seriesListController.seriesList = new List(null, null, null, this.items);
			this.seriesListController.activate(listItem);
		});

		QUnit.test("activate - update", 5, function() {
			var listItem = {
				listIndex: 0,
				series: {
					seriesName: "test-series-2",
					programId: 1,
					episodeCount: 4,
					watchedCount: 2,
					recordedCount: 0,
					expectedCount: 2
				}
			};

			var origEpisodeCount = this.listItem.program.episodeCount;
			var origWatchedCount = this.listItem.program.watchedCount;
			var origRecordedCount = this.listItem.program.recordedCount;
			var origExpectedCount = this.listItem.program.expectedCount;

			var itemsCopy = JSON.parse(JSON.stringify(this.items));
			this.seriesListController.seriesList = new List(null, null, null, JSON.parse(JSON.stringify(this.items)));
			this.seriesListController.origEpisodeCount = this.items[0].episodeCount;
			this.seriesListController.origWatchedCount = this.items[0].watchedCount;
			this.seriesListController.origRecordedCount = this.items[0].recordedCount;
			this.seriesListController.origExpectedCount = this.items[0].expectedCount;
			this.seriesListController.activate(listItem);
			itemsCopy[0].seriesName = listItem.series.seriesName;
			itemsCopy[0].episodeCount = listItem.series.episodeCount;
			itemsCopy[0].watchedCount = listItem.series.watchedCount;
			itemsCopy[0].recordedCount = listItem.series.recordedCount;
			itemsCopy[0].expectedCount = listItem.series.expectedCount;
			QUnit.deepEqual(this.seriesListController.seriesList.items, itemsCopy, "List items");
			QUnit.equal(this.seriesListController.listItem.program.episodeCount, origEpisodeCount + 1, "listItem.program.episodeCount property");
			QUnit.equal(this.seriesListController.listItem.program.watchedCount, origWatchedCount + 1, "listItem.program.watchedCount property");
			QUnit.equal(this.seriesListController.listItem.program.recordedCount, origRecordedCount - 1, "listItem.program.recordedCount property");
			QUnit.equal(this.seriesListController.listItem.program.expectedCount, origExpectedCount + 1, "listItem.program.expectedCount property");
		});

		QUnit.test("activate - add", 2, function() {
			var listItem = {
				listIndex: -1,
				series: {
					seriesName: "test-series-2"
				}
			};

			var origSeriesCount = this.listItem.program.seriesCount;
			var itemsCopy = JSON.parse(JSON.stringify(this.items));
			this.seriesListController.seriesList = new List(null, null, null, JSON.parse(JSON.stringify(this.items)));
			this.seriesListController.activate(listItem);
			itemsCopy[1] = listItem.series;
			QUnit.deepEqual(this.seriesListController.seriesList.items, itemsCopy, "List items");
			QUnit.equal(this.seriesListController.listItem.program.seriesCount, origSeriesCount + 1, "listItem.program.seriesCount property");
		});

		QUnit.test("viewItem", 6, function() {
			var index = 0;
			this.seriesListController.seriesList = { items: this.items };
			this.seriesListController.viewItem(index);
			QUnit.equal(this.seriesListController.origEpisodeCount, this.items[index].episodeCount, "episodeCount property");
			QUnit.equal(this.seriesListController.origWatchedCount, this.items[index].watchedCount, "watchedCount property");
			QUnit.equal(this.seriesListController.origRecordedCount, this.items[index].recordedCount, "recordedCount property");
			QUnit.equal(this.seriesListController.origExpectedCount, this.items[index].expectedCount, "expectedCount property");
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
		});

		QUnit.test("addItem", 2, function() {
			this.seriesListController.addItem(this.listItem.program);
			QUnit.deepEqual(appController.viewArgs, { program: this.listItem.program }, "View arguments");
		});

		QUnit.test("editItem", 6, function() {
			var index = 0;
			this.seriesListController.seriesList = { items: this.items };
			this.seriesListController.editItem(index);
			QUnit.equal(this.seriesListController.origEpisodeCount, this.items[index].episodeCount, "episodeCount property");
			QUnit.equal(this.seriesListController.origWatchedCount, this.items[index].watchedCount, "watchedCount property");
			QUnit.equal(this.seriesListController.origRecordedCount, this.items[index].recordedCount, "recordedCount property");
			QUnit.equal(this.seriesListController.origExpectedCount, this.items[index].expectedCount, "expectedCount property");
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
		});

		QUnit.test("deleteItem", function() {
			var testParams = [
				{
					description: "remove",
					dontRemove: false
				},
				{
					description: "don't remove",
					dontRemove: true
				}
			];

			QUnit.expect(testParams.length * 7 - 1);

			for (var i = 0; i < testParams.length; i++) {
				var origEpisodeCount = this.listItem.program.episodeCount;
				var origWatchedCount = this.listItem.program.watchedCount;
				var origRecordedCount = this.listItem.program.recordedCount;
				var origExpectedCount = this.listItem.program.expectedCount;
				var origSeriesCount = this.listItem.program.seriesCount;

				this.seriesListController.seriesList = new List(null, null, null, this.items.slice(0));
				this.seriesListController.deleteItem(0, testParams[i].dontRemove);

				QUnit.equal(this.seriesListController.listItem.program.episodeCount, origEpisodeCount - 3, testParams[i].description + " - listItem.program.episodeCount property");
				QUnit.equal(this.seriesListController.listItem.program.watchedCount, origWatchedCount - 1, testParams[i].description + " - listItem.program.watchedCount property");
				QUnit.equal(this.seriesListController.listItem.program.recordedCount, origRecordedCount - 1, testParams[i].description + " - listItem.program.recordedCount property");
				QUnit.equal(this.seriesListController.listItem.program.expectedCount, origExpectedCount - 1, testParams[i].description + " - listItem.program.expectedCount property");
				QUnit.equal(this.seriesListController.listItem.program.seriesCount, origSeriesCount - 1, testParams[i].description + " - listItem.program.seriesCount property");
				QUnit.deepEqual(this.seriesListController.seriesList.items, this.items.slice(1), testParams[i].description + " - List items");
			}
		});

		QUnit.test("deleteItems", 3, function() {
			this.seriesListController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.seriesListController.seriesList = new List();

			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesListController.deleteItems();
			QUnit.equal(this.seriesListController.seriesList.action, "delete", "List action");
			QUnit.ok($("#list").hasClass("delete"), "Set list delete style");
			this.seriesListController.footer.rightButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("editItems", 3, function() {
			this.seriesListController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.seriesListController.seriesList = new List();

			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesListController.editItems();
			QUnit.equal(this.seriesListController.seriesList.action, "edit", "List action");
			QUnit.ok($("#list").hasClass("edit"), "Set list edit style");
			this.seriesListController.footer.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});
	}
);
