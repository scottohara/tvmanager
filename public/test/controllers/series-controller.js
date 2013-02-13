define(
	[
		'models/series-model',
		'framework/sw/spinningwheel-min',
		'controllers/series-controller',
		'controllers/application-controller',
		'models/program-model',
		'framework/jquery',
		'test/framework/qunit',
		'test/mocks/jQuery-mock'
	],

	function(Series, SpinningWheel, SeriesController, ApplicationController, Program, $, QUnit, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("series-controller", {
			setup: function() {
				this.listItem = {
					listIndex: 0,
					series: {
						seriesName: "test-series",
						nowShowing: null,
						nowShowingDisplay: "Not Showing",
						programId: 1,
						save: function() {
							QUnit.ok(true, "Save series");
						},
						setNowShowing: function(nowShowing) {
							this.nowShowing = nowShowing;
							this.nowShowingDisplay = Series.NOW_SHOWING[this.nowShowing];
						}
					}
				};

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);

				$("<input>")
					.attr("id", "seriesName")
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "nowShowing")
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "moveTo")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "sw-wrapper")
					.appendTo(this.sandbox);

				this.seriesController = new SeriesController(this.listItem);
			},
			teardown: function() {
				this.sandbox.remove();
				SpinningWheel.slots = [];
			}
		});

		QUnit.test("constructor - update", 4, function() {
			QUnit.ok(this.seriesController, "Instantiate SeriesController object");
			QUnit.deepEqual(this.seriesController.listItem, this.listItem, "listItem property");
			QUnit.equal(this.seriesController.originalNowShowing, this.listItem.series.nowShowing, "originalNowShowing property");
			QUnit.equal(this.seriesController.originalProgramId, this.listItem.series.programId, "originalProgramId property");
		});

		QUnit.test("constructor - add", 2, function() {
			var program = {
				id: 1,
				programName: "test-program"
			};

			var listItem = {
				series: new Series(null, "", "", program.id, program.programName, 0, 0, 0, 0, 0, 0)
			};

			this.seriesController = new SeriesController({ program: program });
			QUnit.ok(this.seriesController, "Instantiate SeriesController object");
			QUnit.deepEqual(this.seriesController.listItem, listItem, "listItem property");
		});

		QUnit.test("setup", 6, function() {
			this.seriesController.cancel = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.seriesController.save = function() {
				QUnit.ok(true, "Bind save button event handler");
			};
			this.seriesController.getNowShowing = function() {
				QUnit.ok(true, "Bind now showing click event listener");
			};
			this.seriesController.getProgramId = function() {
				QUnit.ok(true, "Bind move to click event listener");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesController.setup();
			this.seriesController.header.leftButton.eventHandler();
			this.seriesController.header.rightButton.eventHandler();
			QUnit.equal($("#seriesName").val(), this.listItem.series.seriesName, "Series name");
			QUnit.equal($("#nowShowing").val(), this.listItem.series.nowShowingDisplay, "Now showing");
			$("#nowShowing").trigger("click");
			$("#moveTo").trigger("click");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("save", 4, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			var seriesName = "test-series-2";
			$("#seriesName").val(seriesName);
			appController.viewStack = [
				{ scrollPos: 0 },
				{ scrollPos: 0 }
			];
			this.seriesController.listItem.listIndex = -1;
			this.seriesController.save();
			QUnit.equal(this.seriesController.listItem.series.seriesName, seriesName, "listItem.series.seriesName property");
			QUnit.equal(appController.viewStack[0].scrollPos, -1, "Scroll position");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("cancel", 3, function() {
			this.seriesController.listItem.series.nowShowing = 2;
			this.seriesController.listItem.series.programId = 2;
			this.seriesController.cancel();
			QUnit.equal(this.seriesController.listItem.series.nowShowing, this.listItem.series.nowShowing, "listItem.series.nowShowing property");
			QUnit.equal(this.seriesController.listItem.series.programId, this.listItem.series.programId, "listItem.series.programId property");
		});

		QUnit.test("getNowShowing - getting", 1, function() {
			this.seriesController.gettingNowShowing = true;
			this.seriesController.getNowShowing();
			QUnit.ok(this.seriesController.gettingNowShowing, "Blocked by semaphore");
		});

		QUnit.test("getNowShowing - not getting", 3, function() {
			this.seriesController.setNowShowing = function() {
				QUnit.ok(true, "Set done action callback");
			};

			this.seriesController.getNowShowing();
			QUnit.equal(SpinningWheel.slots[0], 0, "Selected value");
			QUnit.ok(!this.seriesController.gettingNowShowing, "Reset semaphore");
		});

		QUnit.test("setNowShowing", 2, function() {
			var nowShowing = 1;
			var nowShowingDisplay = "Mondays";
			SpinningWheel.selectedValues.keys = [nowShowing];
			SpinningWheel.selectedValues.values = [nowShowingDisplay];
			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesController.setNowShowing();
			QUnit.equal(this.seriesController.listItem.series.nowShowing, nowShowing, "listItem.series.nowShowing property");
			QUnit.equal($("#nowShowing").val(), nowShowingDisplay, "Now showing");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("getProgramId - getting", 1, function() {
			this.seriesController.gettingProgramId = true;
			this.seriesController.getProgramId();
			QUnit.ok(this.seriesController.gettingProgramId, "Blocked by semaphore");
		});

		QUnit.test("getProgramId - not getting", 3, function() {
			this.seriesController.setProgramId = function() {
				QUnit.ok(true, "Set done action callback");
			};

			Program.programs = [{
				id: 1,
				programName: "test-program-1"
			}];

			this.seriesController.getProgramId();
			QUnit.equal(SpinningWheel.slots[0], this.listItem.series.programId, "Selected value");
			QUnit.ok(!this.seriesController.gettingProgramId, "Reset semaphore");
		});

		QUnit.test("setProgramId", 2, function() {
			var programId = 2;
			var programName = "test-program-2";
			SpinningWheel.selectedValues.keys = [programId];
			SpinningWheel.selectedValues.values = [programName];
			jQueryMock.setDefaultContext(this.sandbox);
			this.seriesController.setProgramId();
			QUnit.equal(this.seriesController.listItem.series.programId, programId, "listItem.series.nowShowing property");
			QUnit.equal($("#moveTo").val(), programName, "Move to");
			jQueryMock.clearDefaultContext();
		});
	}
);
