function ProgramController(listItem) {
	if (listItem) {
		this.listItem = listItem;
	} else {
		this.listItem = { program: new Program(null, "", 0, 0, 0, 0, 0) };
	}
}

ProgramController.prototype.setup = function() {
	this.header = {
		label: "Add/Edit Program",
		leftButton: {
			eventHandler: this.cancel,
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: $.proxy(this.save, this),
			style: "blueButton",
			label: "Save"
		}
	};

	$("#programName").val(this.listItem.program.programName);

	appController.refreshScroller();
}

ProgramController.prototype.save = function() {
	this.listItem.program.setProgramName($("#programName").val());
	this.listItem.program.save();
	if (!(this.listItem.listIndex >= 0)) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}
	appController.popView(this.listItem);
}

ProgramController.prototype.cancel = function() {
	appController.popView();
}