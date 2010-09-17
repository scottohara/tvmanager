module("programs-controller", {
	setup: function() {
		this.items = [{
			programName: "test-program",
			remove: function() {
				ok(true, "Remove program");
			}
		}];
		this.originalProgram = Program;
		Program = ProgramMock;
		Program.programs = this.items;
		this.programsController = new ProgramsController();
	},
	teardown: function() {
		Program = this.originalProgram;
	}
});

test("constructor", 1, function() {
	ok(this.programsController, "Instantiate ProgramsController object");
});

test("setup", 10, function() {
	var originalList = List;
	List = ListMock;

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.programsController.viewItem = function() {
		ok(true, "Bind list view event handler")
	};
	this.programsController.editItem = function() {
		ok(true, "Bind list edit event handler")
	};
	this.programsController.deleteItem = function() {
		ok(true, "Bind list delete event handler")
	};
	this.programsController.goBack = function() {
		ok(true, "Bind back button event handler")
	};
	this.programsController.addItem = function() {
		ok(true, "Bind add action event handler")
	};
	this.programsController.editItems = function() {
		ok(true, "Bind edit action event handler")
	};
	this.programsController.deleteItems = function() {
		ok(true, "Bind delete action event handler")
	};

	this.programsController.setup();
	same(this.programsController.programList.items, this.items, "List items");
	equals(this.programsController.programList.action, "view", "List action");
	ok($("#list").hasClass("withHelper"), "Set list helper style");
	this.programsController.header.leftButton.eventHandler();
	this.programsController.header.rightButton.eventHandler();
	this.programsController.footer.leftButton.eventHandler();
	this.programsController.footer.rightButton.eventHandler();
	list.remove();
	List = originalList;
});

test("goBack", 1, function() {
	this.programsController.goBack();
});

test("activate", function() {
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

	expect(testParams.length);
	for (var i = 0; i < testParams.length; i++) {
		var itemsCopy = JSON.parse(JSON.stringify(this.items));
		this.programsController.programList = new ListMock(null, null, null, JSON.parse(JSON.stringify(this.items)));
		this.programsController.activate(testParams[i].listItem);
		itemsCopy[testParams[i].listItem.listIndex * -1] = testParams[i].listItem.program;
		same(this.programsController.programList.items, itemsCopy, testParams[i].description + " - List items");
	}
});

test("viewItem", 2, function() {
	var index = 0;
	this.programsController.programList = { items: this.items };
	this.programsController.viewItem(index);
	same(appController.viewArgs, { listIndex: index, program: this.items[index] }, "View arguments");
});

test("addItem", 1, function() {
	this.programsController.addItem();
});

test("editItem", 2, function() {
	var index = 0;
	this.programsController.programList = { items: this.items };
	this.programsController.editItem(index);
	same(appController.viewArgs, { listIndex: index, program: this.items[index] }, "View arguments");
});

test("deleteItem", 2, function() {
	var index = 0;
	this.programsController.programList = new ListMock(null, null, null, this.items);
	this.programsController.deleteItem(index);
	same(this.programsController.programList.items, this.items.slice(1), "List items");
});

test("deleteItems", 4, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.programsController.viewItems = function() {
		ok(true, "Bind done action event handler")
	};

	this.programsController.programList = new ListMock();

	this.programsController.deleteItems();
	ok(!$("#list").hasClass("withHelper"), "Unset list helper style");
	equals(this.programsController.programList.action, "delete", "List action");
	ok($("#list").hasClass("delete"), "Set list delete style");
	this.programsController.footer.rightButton.eventHandler();
	list.remove();
});

test("editItems", 4, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.programsController.viewItems = function() {
		ok(true, "Bind done action event handler")
	};

	this.programsController.programList = new ListMock();

	this.programsController.editItems();
	ok(!$("#list").hasClass("withHelper"), "Unset list helper style");
	equals(this.programsController.programList.action, "edit", "List action");
	ok($("#list").hasClass("edit"), "Set list edit style");
	this.programsController.footer.leftButton.eventHandler();
	list.remove();
});