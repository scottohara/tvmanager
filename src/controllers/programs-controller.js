function ProgramsController() {

}

ProgramsController.prototype.setup = function() {
	this.header = {
		label: "Programs",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Schedule"
		},
		rightButton: {
			eventHandler: this.addItem,
			style: "toolButton",
			label: "+"
		}
	};

	this.programList = new List("list", "views/programListTemplate.html", "programGroup", [], $.proxy(this.viewItem, this), $.proxy(this.editItem, this), $.proxy(this.deleteItem, this));
	Program.list($.proxy(this.listRetrieved, this));
}

ProgramsController.prototype.activate = function(listItem) {
	if (listItem) {
		if (listItem.listIndex >= 0) {
			this.programList.items[listItem.listIndex] = listItem.program;
		} else {
			this.programList.items.push(listItem.program);
		}
	}

	this.programList.refresh();
	this.viewItems();
}

ProgramsController.prototype.listRetrieved = function(programList) {
	this.programList.items = programList;
	this.activate();
}

ProgramsController.prototype.goBack = function() {
	appController.popView();
}

ProgramsController.prototype.viewItem = function(itemIndex) {
	appController.pushView("seriesList", { listIndex: itemIndex, program: this.programList.items[itemIndex] });
}

ProgramsController.prototype.addItem = function() {
	appController.pushView("program");
}

ProgramsController.prototype.editItem = function(itemIndex) {
	appController.pushView("program", { listIndex: itemIndex, program: this.programList.items[itemIndex] });
}

ProgramsController.prototype.deleteItem = function(itemIndex) {
	this.programList.items[itemIndex].remove();
	this.programList.items.splice(itemIndex,1);
	this.programList.refresh();
}

ProgramsController.prototype.deleteItems = function() {
	appController.hideScrollHelper();
	appController.clearFooter();
	this.programList.setAction("delete");
	$("#list")
		.removeClass()
		.addClass("delete");
	this.footer = {
		label: "v" + appController.db.version,
		rightButton: {
			eventHandler: $.proxy(this.viewItems, this),
			style: "blueButton",
			label: "Done"
		}
	};

	appController.setFooter();
}

ProgramsController.prototype.editItems = function() {
	appController.hideScrollHelper();
	appController.clearFooter();
	this.programList.setAction("edit");
	$("#list")
		.removeClass()
		.addClass("edit");
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.viewItems, this),
			style: "blueButton",
			label: "Done"
		}
	};

	appController.setFooter();
}

ProgramsController.prototype.viewItems = function() {
	appController.showScrollHelper();
	appController.clearFooter();
	this.programList.setAction("view");
	$("#list")
		.removeClass()
		.addClass("withHelper");
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.editItems, this),
			style: "toolButton",
			label: "Edit"
		},
		rightButton: {
			eventHandler: $.proxy(this.deleteItems, this),
			style: "redButton",
			label: "Delete"
		}
	};

	appController.setFooter();
}