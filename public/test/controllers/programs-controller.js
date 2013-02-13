define(
	[
		'models/program-model',
		'controllers/programs-controller',
		'components/list',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit',
		'test/mocks/jQuery-mock'
	],

	function(Program, ProgramsController, List, ApplicationController, $, QUnit, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("programs-controller", {
			setup: function() {
				this.items = [{
					programName: "test-program",
					remove: function() {
						QUnit.ok(true, "Remove program");
					}
				}];

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
				$("<ul>")
					.attr("id", "list")
					.appendTo(this.sandbox);

				this.programsController = new ProgramsController();
			},
			teardown: function() {
				this.sandbox.remove();
			}			
		});

		QUnit.test("constructor", 1, function() {
			QUnit.ok(this.programsController, "Instantiate ProgramsController object");
		});

		QUnit.test("setup", 10, function() {
			this.programsController.viewItem = function() {
				QUnit.ok(true, "Bind list view event handler");
			};
			this.programsController.editItem = function() {
				QUnit.ok(true, "Bind list edit event handler");
			};
			this.programsController.deleteItem = function() {
				QUnit.ok(true, "Bind list delete event handler");
			};
			this.programsController.goBack = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.programsController.addItem = function() {
				QUnit.ok(true, "Bind add action event handler");
			};
			this.programsController.editItems = function() {
				QUnit.ok(true, "Bind edit action event handler");
			};
			this.programsController.deleteItems = function() {
				QUnit.ok(true, "Bind delete action event handler");
			};

			Program.programs = this.items;

			jQueryMock.setDefaultContext(this.sandbox);
			this.programsController.setup();
			QUnit.deepEqual(this.programsController.programList.items, this.items, "List items");
			QUnit.equal(this.programsController.programList.action, "view", "List action");
			QUnit.ok($("#list").hasClass("withHelper"), "Set list helper style");
			this.programsController.header.leftButton.eventHandler();
			this.programsController.header.rightButton.eventHandler();
			this.programsController.footer.leftButton.eventHandler();
			this.programsController.footer.rightButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("goBack", 1, function() {
			this.programsController.goBack();
		});

		QUnit.test("activate", function() {
			var testParams = [
				{
					description: "update",
					listItem: {
						listIndex: 0,
						program: { programName: "test-program-2" }
					}
				},
				{
					description: "add",
					listItem: {
						listIndex: -1,
						program: { programName: "test-program-2" }
					}
				}
			];

			QUnit.expect(testParams.length);
			for (var i = 0; i < testParams.length; i++) {
				var itemsCopy = JSON.parse(JSON.stringify(this.items));
				this.programsController.programList = new List(null, null, null, JSON.parse(JSON.stringify(this.items)));
				this.programsController.activate(testParams[i].listItem);
				itemsCopy[testParams[i].listItem.listIndex * -1] = testParams[i].listItem.program;
				QUnit.deepEqual(this.programsController.programList.items, itemsCopy, testParams[i].description + " - List items");
			}
		});

		QUnit.test("viewItem", 2, function() {
			var index = 0;
			this.programsController.programList = { items: this.items };
			this.programsController.viewItem(index);
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, program: this.items[index] }, "View arguments");
		});

		QUnit.test("addItem", 1, function() {
			this.programsController.addItem();
		});

		QUnit.test("editItem", 2, function() {
			var index = 0;
			this.programsController.programList = { items: this.items };
			this.programsController.editItem(index);
			QUnit.deepEqual(appController.viewArgs, { listIndex: index, program: this.items[index] }, "View arguments");
		});

		QUnit.test("deleteItem", 2, function() {
			var index = 0;
			this.programsController.programList = new List(null, null, null, this.items);
			this.programsController.deleteItem(index);
			QUnit.deepEqual(this.programsController.programList.items, this.items.slice(1), "List items");
		});

		QUnit.test("deleteItems", 4, function() {
			this.programsController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.programsController.programList = new List();

			jQueryMock.setDefaultContext(this.sandbox);
			this.programsController.deleteItems();
			QUnit.ok(!$("#list").hasClass("withHelper"), "Unset list helper style");
			QUnit.equal(this.programsController.programList.action, "delete", "List action");
			QUnit.ok($("#list").hasClass("delete"), "Set list delete style");
			this.programsController.footer.rightButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("editItems", 4, function() {
			this.programsController.viewItems = function() {
				QUnit.ok(true, "Bind done action event handler");
			};

			this.programsController.programList = new List();

			jQueryMock.setDefaultContext(this.sandbox);
			this.programsController.editItems();
			QUnit.ok(!$("#list").hasClass("withHelper"), "Unset list helper style");
			QUnit.equal(this.programsController.programList.action, "edit", "List action");
			QUnit.ok($("#list").hasClass("edit"), "Set list edit style");
			this.programsController.footer.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});
	}
);
