module("program-controller", {
	setup: function() {
		this.listItem = {
			program: {
				programName: "test-program",
				save: function() {
					ok(true, "Save program");
				},
				setProgramName: function(programName) {
					this.programName = programName;
				}
			}
		}

		this.programName = $("<input>")
			.attr("id", "programName")
			.hide()
			.appendTo(document.body);

		this.programController = new ProgramController(this.listItem);
	},
	teardown: function() {
		this.programName.remove();
	}
});

test("constructor - update", 2, function() {
	ok(this.programController, "Instantiate ProgramController object");
	same(this.programController.listItem, this.listItem, "listItem property");
});

test("constructor - add", 2, function() {
	var listItem = {
		program: new Program(null, "", 0, 0, 0, 0, 0)
	}

	this.programController = new ProgramController();
	ok(this.programController, "Instantiate ProgramController object");
	same(this.programController.listItem, listItem, "listItem property");
});

test("setup", 4, function() {
	this.programController.cancel = function() {
		ok(true, "Bind back button event handler")
	};
	this.programController.save = function() {
		ok(true, "Bind save button event handler")
	};

	this.programController.setup();
	this.programController.header.leftButton.eventHandler();
	this.programController.header.rightButton.eventHandler();
	equals(this.programName.val(), this.listItem.program.programName, "Program name");
});

test("save", 4, function() {
	var programName = "test-program-2"
	this.programName.val(programName);
	appController.viewStack = [
		{ scrollPos: 0 },
		{ scrollPos: 0 }
	];
	this.programController.save();
	equals(this.programController.listItem.program.programName, programName, "listItem.program.programName property");
	equals(appController.viewStack[0].scrollPos, -1, "Scroll position");
});

test("cancel", 1, function() {
	this.programController.cancel();
});