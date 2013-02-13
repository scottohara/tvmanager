define(
	[
		'controllers/application-controller',
		'components/list',
		'test/mocks/jQuery-mock',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(ApplicationController, List, jQueryMock, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("list", {
			setup: function() {
				this.container = QUnit.config.current.module + "-" + QUnit.config.current.testName.replace(/\s/g, "") + "-list";
				this.itemTemplate = "views/listTemplate.html";
				this.groupBy = "name";
				this.items = [
					{
						name: "group-one",
						value: "item-one"
					},
					{
						name: "group-one",
						value: "item-two"
					},
					{
						name: "group-two",
						value: "item-three"
					}
				];
				this.currentItem = 0;
				this.eventHandler = $.proxy(function(index) {
					QUnit.equal(index, this.currentItem, "Invoke tap event handler");
				}, this);
				this.populateItemEventHandler = $.proxy(function(item) {
					QUnit.deepEqual(item, this.items[this.currentItem], "Invoke populate event handler");
					this.currentItem++;
				}, this);
				this.action = "view";
				this.validActions = [
					"view",
					"edit",
					"delete"
				];

				var originalSetScrollPosition = appController.setScrollPosition;
				this.mockSetScrollPosition = $.proxy(function() {
					QUnit.equal($("#" + this.container).html(), this.renderHtml, "list items");
					$("#" + this.container + " li:not([id])").each($.proxy(function(index, element) {
						this.currentItem = index;
						$(element).trigger("click");
					}, this));
					appController.setScrollPosition = originalSetScrollPosition;
					QUnit.start();
				}, this);

				$("<ul>")
				.attr("id", this.container)
				.hide()
				.appendTo(document.body);
				this.list = new List(this.container, this.itemTemplate, this.groupBy, this.items, this.eventHandler, this.eventHandler, this.eventHandler, this.populateItemEventHandler);
			},
			teardown: function() {
				$("#" + this.container).remove();
			}
		});

		QUnit.test("constructor", 10, function() {
			QUnit.ok(this.list, "Instantiate List object");
			QUnit.equal(this.list.container, this.container, "container property");
			QUnit.equal(this.list.itemTemplate, this.itemTemplate, "itemTemplate property");
			QUnit.equal(this.list.groupBy, this.groupBy, "groupBy property");
			QUnit.deepEqual(this.list.items, this.items, "items property");
			QUnit.deepEqual(this.list.viewEventHandler, this.eventHandler, "viewEventHandler property");
			QUnit.deepEqual(this.list.editEventHandler, this.eventHandler, "editEventHandler property");
			QUnit.deepEqual(this.list.deleteEventHandler, this.eventHandler, "deleteEventHandler property");
			QUnit.deepEqual(this.list.populateItemEventHandler, this.populateItemEventHandler, "populateItemEventHandler property");
			QUnit.equal(this.list.action, this.action, "action property");
		});

		QUnit.asyncTest("refresh - 304 not modified", 7, function() {
			$.get = jQueryMock.get;
			this.list.groupBy = null;
			this.renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
			appController.setScrollPosition = this.mockSetScrollPosition;
			this.list.refresh();
		});

		QUnit.asyncTest("refresh - without grouping", 7, function() {
			this.list.groupBy = null;
			this.renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
			appController.setScrollPosition = this.mockSetScrollPosition;
			this.list.refresh();
		});

		QUnit.asyncTest("refresh - with grouping", 7, function() {
			this.renderHtml = '<li id="group-one" class="group">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id="group-two" class="group">group-two</li><li><a>group-two:item-three</a></li>';
			appController.setScrollPosition = this.mockSetScrollPosition;
			this.list.refresh();
		});

		QUnit.test("setAction - valid", function() {
			QUnit.expect(this.validActions.length);
			for (var i = 0; i < this.validActions.length; i++) {
				this.list.action = "";
				this.list.setAction(this.validActions[i]);
				QUnit.equal(this.list.action, this.validActions[i], this.validActions[i] + " - action property");
			}
		});

		QUnit.test("setAction - invalid", 2, function() {
			window.alert = function(message) {
				QUnit.equal(message, "invalid is not a valid action", "alert");
			};
			this.list.action = "";
			this.list.setAction("invalid");
			QUnit.equal(this.list.action, "", "action property");
			delete window.alert;
		});

		QUnit.test("tap - without event handlers", 0, function() {
			this.list.viewEventHandler = null;
			this.list.editEventHandler = null;
			this.list.deleteEventHandler = null;
			for (var i = 0; i < this.validActions.length; i++) {
				this.list.action = this.validActions[i];
				this.list.tap(0);
			}
		});

		QUnit.test("tap - with event handlers", function() {
			QUnit.expect(this.validActions.length + 1);

			window.confirm = function(message) {
				QUnit.equal(message, "Delete this item?", "confirm");
				return true;
			};

			for (var i = 0; i < this.validActions.length; i++) {
				this.list.action = this.validActions[i];
				this.list.tap(0);
			}

			delete window.confirm;
		});
	}
);	
