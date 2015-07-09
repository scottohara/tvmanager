define(
	[
		'framework/sw/spinningwheel',
		'controllers/episode-controller',
		'models/episode-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function(SpinningWheel, EpisodeController, Episode, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("episode-controller", {
			setup: function() {
				this.listItem = {
					listIndex: 0,
					episode: {
						episodeName: "test-episode",
						status: "Watched",
						statusDate: "01-Jan",
						unverified: false,
						unscheduled: false,
						save: function() {
							QUnit.ok(true, "Save episode");
						},
						setStatus: function(status) {
							this.status = status;
						},
						setStatusDate: function(statusDate) {
							this.statusDate = statusDate;
						},
						setUnverified: function(unverified) {
							this.unverified = unverified;
						}
					}
				};

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);

				$("<input>")
					.attr("id", "episodeName")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "watched")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "recorded")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "expected")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "missed")
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "statusDate")
					.appendTo(this.sandbox);

				$("<input type='checkbox'>")
					.attr("id", "unverified")
					.appendTo(this.sandbox);

				$("<input type='checkbox'>")
					.attr("id", "unscheduled")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "sw-wrapper")
					.appendTo(this.sandbox);

				this.episodeController = new EpisodeController(this.listItem);
			},
			teardown: function() {
				this.sandbox.remove();
				SpinningWheel.slots = [];
			}
		});

		QUnit.test("constructor - update", 4, function() {
			QUnit.ok(this.episodeController, "Instantiate EpisodeController object");
			QUnit.deepEqual(this.episodeController.listItem, this.listItem, "listItem property");
			QUnit.equal(this.episodeController.originalStatus, this.listItem.episode.status, "originalStatus property");
			QUnit.equal(this.episodeController.originalStatusDate, this.listItem.episode.statusDate, "originalStatusDate property");
		});

		QUnit.test("constructor - add", 2, function() {
			var series = { id: 1 };
			var sequence = 1;

			var listItem = {
				episode: new Episode(null, "", "", "", false, false, sequence, series.id)
			};

			this.episodeController = new EpisodeController({
				series: series,
				sequence: sequence
			});
			
			QUnit.ok(this.episodeController, "Instantiate EpisodeController object");
			QUnit.deepEqual(this.episodeController.listItem, listItem, "listItem property");
		});

		QUnit.test("setup", 13, function() {
			this.episodeController.cancel = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.episodeController.save = function() {
				QUnit.ok(true, "Bind save button event handler");
			};
			this.episodeController.setStatus = function(status) {
				QUnit.ok(true, "Bind " + status + " click event listener");
			};
			this.episodeController.getStatusDate = function() {
				QUnit.ok(true, "Bind status date click event listener");
			};
			this.episodeController.toggleStatusDateRow = function() {
				QUnit.ok(true, "Bind unscheduled click event listener");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.episodeController.setup();
			this.episodeController.header.leftButton.eventHandler();
			this.episodeController.header.rightButton.eventHandler();
			QUnit.equal($("#episodeName").val(), this.listItem.episode.episodeName, "Episode name");
			QUnit.equal($("#unverified").is(":checked"), this.listItem.episode.unverified, "Unverified");
			QUnit.equal($("#unscheduled").is(":checked"), this.listItem.episode.unscheduled, "Unscheduled");
			$("#watched").trigger("click");
			$("#recorded").trigger("click");
			$("#expected").trigger("click");
			$("#missed").trigger("click");
			$("#statusDate").trigger("click");
			$("#unscheduled").trigger("click");
			QUnit.equal($("#statusDate").val(), this.listItem.episode.statusDate, "Status date");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("save", 6, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			var episodeName = "test-episode-2";
			var unverified = true;
			var unscheduled = true;
			$("#episodeName").val(episodeName);
			$("#unverified").prop("checked", unverified);
			$("#unscheduled").prop("checked", unscheduled);
			appController.viewStack = [
				{ scrollPos: 0 },
				{ scrollPos: 0 }
			];
			this.episodeController.listItem.listIndex = -1;
			this.episodeController.save();
			QUnit.equal(this.episodeController.listItem.episode.episodeName, episodeName, "listItem.episode.episodeName property");
			QUnit.equal(this.episodeController.listItem.episode.unverified, unverified, "listItem.episode.unverified property");
			QUnit.equal(this.episodeController.listItem.episode.unscheduled, unscheduled, "listItem.episode.unscheduled property");
			QUnit.equal(appController.viewStack[0].scrollPos, -1, "Scroll position");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("cancel", 3, function() {
			this.episodeController.listItem.episode.status = "Recorded";
			this.episodeController.listItem.episode.statusDate = "02-Jan";
			this.episodeController.cancel();
			QUnit.equal(this.episodeController.listItem.episode.status, this.listItem.episode.status, "listItem.episode.status property");
			QUnit.equal(this.episodeController.listItem.episode.statusDate, this.listItem.episode.statusDate, "listItem.episode.statusDate property");
		});

		QUnit.test("setStatus - setting", 1, function() {
			this.episodeController.settingStatus = true;
			this.episodeController.setStatus();
			QUnit.ok(this.episodeController.settingStatus, "Blocked by semaphore");
		});

		QUnit.test("setStatus", function() {
			jQueryMock.setDefaultContext(this.sandbox);
			var testParams = [
				{
					description: "unset",
					unverifiedVisible: false
				},
				{
					description: "Watched",
					status: "Watched",
					button: $("#watched"),
					unverifiedVisible: false
				},
				{
					description: "Recorded",
					status: "Recorded",
					button: $("#recorded"),
					unverifiedVisible: true
				},
				{
					description: "Expected",
					status: "Expected",
					button: $("#expected"),
					unverifiedVisible: true
				},
				{
					description: "Missed",
					status: "Missed",
					button: $("#missed"),
					unverifiedVisible: true
				}
			];

			this.episodeController.toggleStatusDateRow = function() {
			};

			var unverifiedRow = $("<div>")
				.attr("id", "unverifiedRow")
				.hide()
				.appendTo(this.sandbox);

			QUnit.expect(testParams.length * 3);
			for (var i = 0; i < testParams.length; i++) {
				if (!testParams[i].status) {
					testParams[i].status = this.episodeController.listItem.episode.status;
					testParams[i].expectedStatus = "";
				} else {
					this.episodeController.listItem.episode.status = "";
					testParams[i].expectedStatus = testParams[i].status;
				}
				this.episodeController.setStatus(testParams[i].status);
				QUnit.equal(this.episodeController.listItem.episode.status, testParams[i].expectedStatus, testParams[i].description + " - listItem.episode.status property");
				if (testParams[i].button) {
					QUnit.ok(testParams[i].button.hasClass("status"), testParams[i].description + " - Toggle button style");
				}
				QUnit.notEqual(unverifiedRow.css("display") === "none", testParams[i].unverifiedVisible, testParams[i].description + " - Unverified row visible");
			}

			QUnit.ok(!this.episodeController.settingStatus, "Reset semaphore");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("getStatusDate - without date", 3, function() {
			var originalDate = Date;
			var fakeDate = new Date(1900, 1, 2, 12, 0, 0);
			Date = function() {
				return fakeDate;
			};

			this.episodeController.listItem.episode.statusDate = "";
			this.episodeController.setStatusDate = function() {
				QUnit.ok(true, "Set done action callback");
			};

			this.episodeController.getStatusDate();
			QUnit.equal(SpinningWheel.slots[0], 2, "Slot 1 value");
			QUnit.equal(SpinningWheel.slots[1], "Feb", "Slot 2 value");
			Date = originalDate;
		});

		QUnit.test("getStatusDate - with date", 3, function() {
			this.episodeController.setStatusDate = function() {
				QUnit.ok(true, "Set done action callback");
			};

			this.episodeController.getStatusDate();
			QUnit.equal(SpinningWheel.slots[0], 1, "Slot 1 value");
			QUnit.equal(SpinningWheel.slots[1], "Jan", "Slot 2 value");
		});

		QUnit.test("setStatusDate", 2, function() {
			var statusDateDay = "02";
			var statusDateMonth = "Feb";
			SpinningWheel.selectedValues.values = [statusDateDay, statusDateMonth];
			jQueryMock.setDefaultContext(this.sandbox);
			this.episodeController.setStatusDate();
			QUnit.equal(this.episodeController.listItem.episode.statusDate, statusDateDay + "-" + statusDateMonth, "listItem.episode.statusDate property");
			QUnit.equal($("#statusDate").val(), statusDateDay + "-" + statusDateMonth, "Now showing");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("toggleStatusDateRow", function() {
			var testParams = [
				{
					description: "hidden",
					unscheduled: false,
					status: "Watched",
					visible: false
				},
				{
					description: "unscheduled",
					unscheduled: true,
					status: "Watched",
					statusDate: "",
					visible: true
				},
				{
					description: "recorded",
					unscheduled: false,
					status: "Recorded",
					visible: true
				},
				{
					description: "expected",
					unscheduled: false,
					status: "Expected",
					visible: true
				},
				{
					description: "missed",
					unscheduled: false,
					status: "Missed",
					visible: true
				}
			];

			var statusDateRow = $("<div>")
				.attr("id", "statusDateRow")
				.hide()
				.appendTo(this.sandbox);

			var i;

			this.episodeController.getStatusDate = function() {
				QUnit.ok(true, testParams[i].description + " - Show spinning wheel");
			};

			QUnit.expect(testParams.length + 1);
			jQueryMock.setDefaultContext(this.sandbox);
			for (i = 0; i < testParams.length; i++) {
				$("#unscheduled").prop("checked", testParams[i].unscheduled);
				this.episodeController.listItem.episode.status = testParams[i].status;
				if ("undefined" !== testParams[i].statusDate) {
					this.episodeController.listItem.episode.statusDate = testParams[i].statusDate;
				}
				this.episodeController.toggleStatusDateRow();
				QUnit.notEqual(statusDateRow.css("display") === "none", testParams[i].visible, testParams[i].description + " - Status date row visible");
			}

			jQueryMock.clearDefaultContext();
		});
	}
);
