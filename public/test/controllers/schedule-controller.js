define(
	[
		'controllers/schedule-controller',
		'components/list',
		'models/series-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function(ScheduleController, List, Series, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("schedule-controller", {
			setup: function() {
				this.items = [
					{
						programName: "test-program-2",
						seriesName: "test-series",
						nowShowing: 1,
						recordedCount: 0,
						expectedCount: 0
					},
					{
						programName: "test-program-3",
						seriesName: "test-series",
						nowShowing: 1,
						recordedCount: 0,
						expectedCount: 0
					},
					{
						programName: "test-program-1",
						seriesName: "test-series",
						nowShowing: null,
						recordedCount: 0,
						expectedCount: 0
					},
					{
						programName: "test-program-1",
						seriesName: "test-series",
						nowShowing: null,
						recordedCount: 0,
						expectedCount: 0
					}
				];
				this.scheduleController = new ScheduleController();
			}
		});

		QUnit.test("object constructor", 1, function() {
			QUnit.ok(this.scheduleController, "Instantiate ScheduleController object");
		});

		QUnit.test("setup", 8, function() {
			Series.series = this.items;

			this.scheduleController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.scheduleController.editItem = function() {
				QUnit.ok(true, "Bind list edit event handler");
			};
			this.scheduleController.editItems = function() {
				QUnit.ok(true, "Bind edit action event handler");
			};
			this.scheduleController.viewUnscheduled = function() {
				QUnit.ok(true, "Bind view unscheduled event handler");
			};
			this.scheduleController.viewPrograms = function() {
				QUnit.ok(true, "Bind view programs event handler");
			};
			this.scheduleController.viewSettings = function() {
				QUnit.ok(true, "Bind view settings event handler");
			};

			this.scheduleController.setup();
			QUnit.deepEqual(this.scheduleController.scheduleList.items, this.items, "List items");
			QUnit.equal(this.scheduleController.scheduleList.action, "view", "List action");
			this.scheduleController.header.leftButton.eventHandler();
			this.scheduleController.header.rightButton.eventHandler();
			this.scheduleController.footer.leftButton.eventHandler();
			this.scheduleController.footer.rightButton.eventHandler();
		});

		QUnit.test("activate - item not in schedule", 1, function() {
			var listItem = {
				listIndex: 0,
				series: {
					nowShowing: null,
					recordedCount: 0,
					expectedCount: 0
				}
			};

			this.scheduleController.scheduleList = new List(null, null, null, this.items.slice(0));
			this.scheduleController.activate(listItem);
			QUnit.deepEqual(this.scheduleController.scheduleList.items, this.items.slice(1), "List items");
		});

		QUnit.test("activate - item in schedule", function() {
			var testParams = [
				{
					description: "series name change",
					listItem: {
						listIndex: 0,
						series: {
							programName: "test-program-4",
							seriesName: "test-series-2",
							nowShowing: 1,
							recordedCount: 0,
							expectedCount: 0
						}
					}
				},
				{
					description: "now showing change",
					listItem: {
						listIndex: 0,
						series: {
							programName: "test-program-2",
							seriesName: "test-series",
							nowShowing: 2,
							recordedCount: 0,
							expectedCount: 0
						}
					}
				},
				{
					description: "no change",
					listItem: {
						listIndex: 0,
						series: {
							programName: "test-program-3",
							seriesName: "test-series",
							nowShowing: 1,
							recordedCount: 0,
							expectedCount: 0
						}
					}
				}
			];

			QUnit.expect(testParams.length);
			for (var i = 0; i < testParams.length; i++) {
				var itemsCopy = JSON.parse(JSON.stringify(this.items));
				this.scheduleController.scheduleList = new List(null, null, null, JSON.parse(JSON.stringify(this.items)));
				this.scheduleController.origSeriesName = this.items[0].seriesName;
				this.scheduleController.origNowShowing = this.items[0].nowShowing;
				this.scheduleController.activate(testParams[i].listItem);
				itemsCopy[0].programName = "test-program-3";
				itemsCopy[1] = testParams[i].listItem.series;
				QUnit.deepEqual(this.scheduleController.scheduleList.items, itemsCopy, testParams[i].description + " - List items");
			}
		});

		QUnit.test("viewItem", 2, function() {
			var index = 0;
			this.scheduleController.scheduleList = { items: this.items };
			this.scheduleController.viewItem(index);
			QUnit.deepEqual(appController.viewArgs, { source: "Schedule", listIndex: index, series: this.items[index] }, "View arguments");
		});

		QUnit.test("viewUnscheduled", 1, function() {
			this.scheduleController.viewUnscheduled();
		});

		QUnit.test("viewPrograms", 1, function() {
			this.scheduleController.viewPrograms();
		});

		QUnit.test("viewSettings", 1, function() {
			this.scheduleController.viewSettings();
		});

		QUnit.test("editItem", 4, function() {
			var index = 0;
			this.scheduleController.scheduleList = { items: this.items };
			this.scheduleController.editItem(index);
			QUnit.equal(this.scheduleController.origSeriesName, this.items[index].seriesName, "origSeriesName property");
			QUnit.equal(this.scheduleController.origNowShowing, this.items[index].nowShowing, "origNowShowing property");
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
		});

		QUnit.test("editItems", 3, function() {
			var sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
			$("<ul>")
				.attr("id", "list")
				.appendTo(sandbox);

			this.scheduleController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.scheduleController.scheduleList = new List();

			jQueryMock.setDefaultContext(sandbox);
			this.scheduleController.editItems();
			QUnit.equal(this.scheduleController.scheduleList.action, "edit", "List action");
			QUnit.ok($("#list").hasClass("edit"), "Set list edit style");
			this.scheduleController.footer.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
			sandbox.remove();
		});
	}
);
