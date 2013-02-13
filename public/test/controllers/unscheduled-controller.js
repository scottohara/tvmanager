define(
	[
		'controllers/unscheduled-controller',
		'controllers/application-controller',
		'test/framework/qunit'
	],

	function(UnscheduledController, ApplicationController, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("unscheduled-controller", {
			setup: function() {
				this.items = [{}];
				this.unscheduledController = new UnscheduledController();
			}
		});

		QUnit.test("constructor", 1, function() {
			QUnit.ok(this.unscheduledController, "Instantiate UnscheduledController object");
		});

		QUnit.test("setup", 4, function() {
			this.unscheduledController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.unscheduledController.goBack = function() {
				QUnit.ok(true, "Bind back button event listener");
			};

			this.unscheduledController.setup();
			QUnit.deepEqual(this.unscheduledController.unscheduledList.items, this.items, "List items");
			QUnit.equal(this.unscheduledController.unscheduledList.action, "view", "List action");
			this.unscheduledController.header.leftButton.eventHandler();
		});

		QUnit.test("goBack", 1, function() {
			this.unscheduledController.goBack();
		});

		QUnit.test("viewItem", 2, function() {
			var index = 0;
			this.unscheduledController.unscheduledList = { items: this.items };
			this.unscheduledController.viewItem(index);
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, episode: this.items[index] }, "View arguments");
		});
	}
);
