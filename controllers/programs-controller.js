function ProgramsController() {

}

ProgramsController.prototype.setup = function() {
	this.header = {
		label: "Programs",
		leftButton: {
			eventHandler: function() {appController.popView();}.bind(this),
			style: "backButton",
			label: "Schedule"
		},
		rightButton: {
			eventHandler: this.addItem.bind(this),
			style: "toolButton",
			label: "+"
		}
	};

	this.programList = new List("list", "views/programListTemplate.html", "programGroup", [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));
	Program.list(this.listRetrieved.bind(this));
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
	$("list").className = "delete";
	this.footer = {
		label: "v" + db.version,
		rightButton: {
			eventHandler: this.viewItems.bind(this),
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
	$("list").className = "edit";
	this.footer = {
		label: "v" + db.version,
		leftButton: {
			eventHandler: this.viewItems.bind(this),
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
	$("list").className = "withHelper";
	this.footer = {
		label: "v" + db.version,
		leftButton: {
			eventHandler: this.editItems.bind(this),
			style: "toolButton",
			label: "Edit"
		},
		rightButton: {
			eventHandler: this.deleteItems.bind(this),
			style: "redButton",
			label: "Delete"
		}
	};

	appController.setFooter();
}