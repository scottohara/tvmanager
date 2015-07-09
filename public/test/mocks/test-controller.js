define(
	[
		'framework/jquery',
		'test/mocks/jQuery-mock'
	],

	function($, jQueryMock) {
		"use strict";

		var TestController = function(args) {
			this.args = args;
			this.header = {
				label: "test-header",
				leftButton: {
					eventHandler: this.buttonClicked,
					style: "left-button-style",
					label: "left-button"
				},
				rightButton: {
					eventHandler: this.buttonClicked,
					style: "right-button-style",
					label: "right-button"
				}
			};
			this.footer = {
				label: "test-footer",
				leftButton: {
					eventHandler: this.buttonClicked,
					style: "left-button-style",
					label: "left-button"
				},
				rightButton: {
					eventHandler: this.buttonClicked,
					style: "right-button-style",
					label: "right-button"
				}
			};
		};

		TestController.prototype.buttonClicked = function(e, button) {
			QUnit.ok(true, "Bind " + button + " button " + e.type + " event listener");
		};

		TestController.prototype.setup = function() {
			jQueryMock.setDefaultContext(TestController.sandbox);
			QUnit.equal($("#content").html(), "<div></div>", "content");
			QUnit.start();
		};

		TestController.prototype.activate = function(args) {
			jQueryMock.setDefaultContext(TestController.sandbox);
			QUnit.equal(args, "Activated", "Activate arguments");
			QUnit.equal($("#content").html(), "<div></div>", "content");
			QUnit.start();
		};

		TestController.sandbox = null;

		return TestController;
	}
);

