function ScheduleController() {

}

ScheduleController.prototype.setup = function() {
	this.header = {
		label: "Schedule",
		leftButton: {
			eventHandler: this.viewUnscheduled.bind(this),
			style: "toolButton",
			label: "Unscheduled"
		},
		rightButton: {
			eventHandler: this.viewPrograms.bind(this),
			style: "toolButton",
			label: "Programs"
		}
	};

	this.scheduleList = new List("list", "views/scheduleListTemplate.html", "nowShowingDisplay", [], this.viewItem.bind(this), this.editItem.bind(this));
	this.activate();
}

ScheduleController.prototype.activate = function() {
	Series.listByNowShowing(this.listRetrieved.bind(this));
}

ScheduleController.prototype.listRetrieved = function(scheduleList) {
	this.scheduleList.items = scheduleList;
	this.scheduleList.refresh();
  this.viewItems();
}

ScheduleController.prototype.viewItem = function(itemIndex) {
	appController.pushView("episodes", { source: "Schedule", listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
}

ScheduleController.prototype.viewUnscheduled = function() {
	appController.pushView("unscheduled");
}

ScheduleController.prototype.viewPrograms = function() {
	appController.pushView("programs");
}

ScheduleController.prototype.viewSettings = function() {
	appController.pushView("settings");
}

ScheduleController.prototype.editItem = function(itemIndex) {
	appController.pushView("series", { listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
}

ScheduleController.prototype.editItems = function() {
	appController.clearFooter();
	this.scheduleList.setAction("edit");
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

ScheduleController.prototype.viewItems = function() {
	appController.clearFooter();
	this.scheduleList.setAction("view");
	$("list").className = "";
	this.footer = {
		label: "v" + db.version,
		leftButton: {
			eventHandler: this.editItems.bind(this),
			style: "toolButton",
			label: "Edit"
		},
		rightButton: {
			eventHandler: this.viewSettings.bind(this),
			style: "toolButton",
			label: "Settings"
		}
	};

	appController.setFooter();
}