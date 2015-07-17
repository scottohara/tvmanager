define(
	[
		'controllers/about-controller',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function(AboutController, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("about-controller", {
			setup: function() {
				this.aboutController = new AboutController();
			}
		});

		QUnit.test("object constructor", 1, function() {
			QUnit.ok(this.aboutController, "Instantiate AboutController object");
		});

		QUnit.test("setup", 8, function() {
			var sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
			var totalPrograms = $("<input>")
				.attr("id", "totalPrograms")
				.appendTo(sandbox);

			var totalSeries = $("<input>")
				.attr("id", "totalSeries")
				.appendTo(sandbox);

			var totalEpisodes = $("<input>")
				.attr("id", "totalEpisodes")
				.appendTo(sandbox);

			var databaseVersion = $("<input>")
				.attr("id", "databaseVersion")
				.appendTo(sandbox);

			var appVersion = $("<input>")
				.attr("id", "appVersion")
				.appendTo(sandbox);

			var update = $("<div>")
				.attr("id", "update")
				.appendTo(sandbox);

			this.aboutController.checkForUpdate = function() {
				QUnit.ok(true, "Bind click event listener");
			};
			this.aboutController.goBack = function() {
				QUnit.ok(true, "Bind back button event listener");
			};

			jQueryMock.setDefaultContext(sandbox);
			this.aboutController.setup();
			QUnit.equal(totalPrograms.val(), "1", "Total Programs");
			QUnit.equal(totalSeries.val(), "1", "Total Series");
			QUnit.equal(totalEpisodes.val(), "1 (100% watched)", "Total Episodes");
			QUnit.equal(databaseVersion.val(), "v1.0", "Database Version");
			QUnit.equal(appVersion.val(), "v1.0", "App Version");
			update.trigger("click");
			this.aboutController.header.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
			sandbox.remove();
		});

		QUnit.test("goBack", 1, function() {
			this.aboutController.goBack();
		});

		QUnit.test("watchedCount - no episodes", 1, function() {
			var sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);

			var totalEpisodes = $("<input>")
				.attr("id", "totalEpisodes")
				.appendTo(sandbox);

			jQueryMock.setDefaultContext(sandbox);
			this.aboutController.episodeTotalCount = 0;
			this.aboutController.watchedCount();
			QUnit.equal(totalEpisodes.val(), "0 (0% watched)", "Total Episodes");
			jQueryMock.clearDefaultContext();
			sandbox.remove();
		});

		QUnit.test("checkForUpdate - updating", 1, function() {
			this.aboutController.updating = true;
			this.aboutController.checkForUpdate();
			QUnit.ok(this.aboutController.updating, "Update blocked by semaphore");
		});

		QUnit.test("checkForUpdate - not updating", 2, function() {
			this.aboutController.checkForUpdate();
			QUnit.deepEqual(appController.notice.pop(), {
				label: "Updated",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}, "Update notice");
			QUnit.ok(!this.aboutController.updating, "Reset semaphore");
		});
	}
);
