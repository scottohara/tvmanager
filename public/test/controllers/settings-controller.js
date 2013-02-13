define(
	[
		'controllers/settings-controller',
		'controllers/application-controller',
		'models/series-model',
		'framework/jquery',
		'test/framework/qunit',
		'test/mocks/jQuery-mock'
	],

	function(SettingsController, ApplicationController, Series, $, QUnit, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("settings-controller", {
			setup: function() {
				this.settingsController = new SettingsController();
			}
		});

		QUnit.test("constructor", 1, function() {
			QUnit.ok(this.settingsController, "Instantiate SettingsController object");
		});

		QUnit.test("setup", 11, function() {
			var sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
			var dataSyncRow = $("<div>")
				.attr("id", "dataSyncRow")
				.appendTo(sandbox);

			var aboutRow = $("<div>")
				.attr("id", "aboutRow")
				.appendTo(sandbox);

			var recordedReportRow = $("<div>")
				.attr("id", "recordedReportRow")
				.appendTo(sandbox);

			var expectedReportRow = $("<div>")
				.attr("id", "expectedReportRow")
				.appendTo(sandbox);

			var missedReportRow = $("<div>")
				.attr("id", "missedReportRow")
				.appendTo(sandbox);

			var incompleteReportRow = $("<div>")
				.attr("id", "incompleteReportRow")
				.appendTo(sandbox);

			this.settingsController.goBack = function() {
				QUnit.ok(true, "Bind back button event listener");
			};

			jQueryMock.setDefaultContext(sandbox);
			this.settingsController.setup();
			dataSyncRow.trigger("click");
			aboutRow.trigger("click");
			recordedReportRow.trigger("click");
			QUnit.deepEqual(appController.viewArgs, { reportName: "All Recorded", dataSource: Series.listByStatus, args: 'Recorded' }, "View arguments");
			expectedReportRow.trigger("click");
			QUnit.deepEqual(appController.viewArgs, { reportName: "All Expected", dataSource: Series.listByStatus, args: 'Expected' }, "View arguments");
			missedReportRow.trigger("click");
			QUnit.deepEqual(appController.viewArgs, { reportName: "All Missed", dataSource: Series.listByStatus, args: 'Missed' }, "View arguments");
			incompleteReportRow.trigger("click");
			QUnit.deepEqual(appController.viewArgs, { reportName: "All Incomplete", dataSource: Series.listByIncomplete, args: null }, "View arguments");
			this.settingsController.header.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
			sandbox.remove();
		});

		QUnit.test("goBack", 1, function() {
			this.settingsController.goBack();
		});
	}
);
