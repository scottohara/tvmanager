module("list", {
	setup: function() {
		this.container = "list";
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
			equals(index, this.currentItem, "Invoke tap event handler");
		}, this);
		this.populateItemEventHandler = $.proxy(function(item) {
			same(item, this.items[this.currentItem], "Invoke populate event handler");
			this.currentItem++;
		}, this);
		this.action = "view";
		this.validActions = [
			"view",
			"edit",
			"delete"
		];
		this.originalRefreshScroller = appController.refreshScroller;
		appController.refreshScroller = $.proxy(function() {
			equals($("#" + this.container).html(), this.renderHtml, "list items");
			$("#" + this.container + " li:not([id])").each($.proxy(function(index, element) {
				this.currentItem = index;
				$(element).trigger("click");
			}, this));
			start();
		}, this);
		$("<ul>")
		.attr("id", this.container)
		.hide()
		.appendTo(document.body);
		this.list = new List(this.container, this.itemTemplate, this.groupBy, this.items, this.eventHandler, this.eventHandler, this.eventHandler, this.populateItemEventHandler);
	},
	teardown: function() {
		$("#" + this.container).remove();
		appController.refreshScroller = this.originalRefreshScroller;
	}
});

test("constructor", 10, function() {
	ok(this.list, "Instantiate List object");
	equals(this.list.container, this.container, "container property");
	equals(this.list.itemTemplate, this.itemTemplate, "itemTemplate property");
	equals(this.list.groupBy, this.groupBy, "groupBy property");
	same(this.list.items, this.items, "items property");
	same(this.list.viewEventHandler, this.eventHandler, "viewEventHandler property");
	same(this.list.editEventHandler, this.eventHandler, "editEventHandler property");
	same(this.list.deleteEventHandler, this.eventHandler, "deleteEventHandler property");
	same(this.list.populateItemEventHandler, this.populateItemEventHandler, "populateItemEventHandler property");
	equals(this.list.action, this.action, "action property");
});

asyncTest("refresh - 304 not modified", 7, function() {
	$.get = jQueryMock.get;
	this.list.groupBy = null;
	this.renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
	this.list.refresh();
});

asyncTest("refresh - without grouping", 7, function() {
	this.list.groupBy = null;
	this.renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
	this.list.refresh();
});

asyncTest("refresh - with grouping", 7, function() {
	this.renderHtml = '<li id="group-one" class="group">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id="group-two" class="group">group-two</li><li><a>group-two:item-three</a></li>';
	this.list.refresh();
});

test("setAction - valid", function() {
	expect(this.validActions.length);
	for (var i = 0; i < this.validActions.length; i++) {
		this.list.action = "";
		this.list.setAction(this.validActions[i]);
		equals(this.list.action, this.validActions[i], this.validActions[i] + " - action property");
	}
});

test("setAction - invalid", 2, function() {
	var originalAlert = window.alert;
	window.alert = function(message) {
		equals(message, "invalid is not a valid action", "alert");
	};
	this.list.action = "";
	this.list.setAction("invalid");
	equals(this.list.action, "", "action property");
	window.alert = originalAlert;
});

test("tap - without event handlers", 0, function() {
	this.list.viewEventHandler = null;
	this.list.editEventHandler = null;
	this.list.deleteEventHandler = null;
	for (var i = 0; i < this.validActions.length; i++) {
		this.list.action = this.validActions[i];
		this.list.tap(0);
	}
});

test("tap - with event handlers", function() {
	expect(this.validActions.length + 1);

	var originalConfirm = window.confirm;
	window.confirm = function(message) {
		equals(message, "Delete this item?", "confirm");
		return true;
	};

	for (var i = 0; i < this.validActions.length; i++) {
		this.list.action = this.validActions[i];
		this.list.tap(0);
	}

	window.confirm = originalConfirm;
});