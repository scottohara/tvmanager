define(
	[
		'controllers/program-controller',
		'models/program-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function(ProgramController, Program, ApplicationController, $, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("program-controller", {
			setup: function() {
				this.listItem = {
					program: {
						programName: "test-program",
						save: function() {
							QUnit.ok(true, "Save program");
						},
						setProgramName: function(programName) {
							this.programName = programName;
						}
					}
				};

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
				$("<input>")
					.attr("id", "programName")
					.appendTo(this.sandbox);

				this.programController = new ProgramController(this.listItem);
			},
			teardown: function() {
				this.sandbox.remove();
			}
		});

		QUnit.test("constructor - update", 2, function() {
			QUnit.ok(this.programController, "Instantiate ProgramController object");
			QUnit.deepEqual(this.programController.listItem, this.listItem, "listItem property");
		});

		QUnit.test("constructor - add", 2, function() {
			var listItem = {
				program: new Program(null, "", 0, 0, 0, 0, 0)
			};

			this.programController = new ProgramController();
			QUnit.ok(this.programController, "Instantiate ProgramController object");
			QUnit.deepEqual(this.programController.listItem, listItem, "listItem property");
		});

		QUnit.test("setup", 3, function() {
			this.programController.cancel = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.programController.save = function() {
				QUnit.ok(true, "Bind save button event handler");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.programController.setup();
			this.programController.header.leftButton.eventHandler();
			this.programController.header.rightButton.eventHandler();
			QUnit.equal($("#programName").val(), this.listItem.program.programName, "Program name");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("save", function() {
			var testParams = [
				{
					description: "update",
					listIndex: 0,
					scrollPos: 0
				},
				{
					description: "insert",
					listIndex: -1,
					scrollPos: -1
				}
			];

			QUnit.expect(testParams.length * 4);

			for (var i = 0; i < testParams.length; i++) {
				jQueryMock.setDefaultContext(this.sandbox);
				var programName = "test-program-2";
				$("#programName").val(programName);
				appController.viewStack = [
					{ scrollPos: 0 },
					{ scrollPos: 0 }
				];
				this.programController.listItem.listIndex = testParams[i].listIndex;
				this.programController.save();
				QUnit.equal(this.programController.listItem.program.programName, programName, testParams[i].description + " - listItem.program.programName property");
				QUnit.equal(appController.viewStack[0].scrollPos, testParams[i].scrollPos, testParams[i].description + " - Scroll position");
				jQueryMock.clearDefaultContext();
			}
		});

		QUnit.test("cancel", 1, function() {
			this.programController.cancel();
		});
	}
);
