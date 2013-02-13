define(
	[
		'controllers/report-controller',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(ReportController, ApplicationController, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("report-controller", {
			setup: function() {
				this.args = "test-args";

				this.items = [
					"test-item-1",
					"test-item-2"
				];

				this.report = {
					reportName: "test-report",
					dataSource: $.proxy(function(callback, args) {
						QUnit.equal(args, this.args, "data source arguments");
						callback(this.items);
					}, this),
					args: this.args
				};

				this.reportController = new ReportController(this.report);
			}
		});

		QUnit.test("constructor", 2, function() {
			QUnit.ok(this.reportController, "Instantiate ReportController object");
			QUnit.deepEqual(this.reportController.report, this.report, "report property");
		});

		QUnit.test("setup", 6, function() {
			this.reportController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.reportController.goBack = function() {
				QUnit.ok(true, "Bind back button event listener");
			};

			this.reportController.setup();
			QUnit.equal(this.reportController.header.label, this.report.reportName, "Header label");
			this.reportController.header.leftButton.eventHandler();
			QUnit.deepEqual(this.reportController.reportList.items, this.items, "List items");
			QUnit.equal(this.reportController.reportList.action, "view", "List action");
		});

		QUnit.test("goBack", 1, function() {
			this.reportController.goBack();
		});

		QUnit.test("viewItem", 2, function() {
			var index = 1;
			this.reportController.reportList = { items: this.items };
			this.reportController.viewItem(index);
			QUnit.deepEqual(appController.viewArgs, { source: "Report", listIndex: index, series: this.items[index] }, "View arguments");
		});
	}
);
