var ScheduleController = function () {

};

ScheduleController.prototype.setup = function() {
	this.header = {
		label: "Schedule",
		leftButton: {
			eventHandler: this.viewUnscheduled,
			style: "toolButton",
			label: "Unscheduled"
		},
		rightButton: {
			eventHandler: this.viewPrograms,
			style: "toolButton",
			label: "Programs"
		}
	};

	this.scheduleList = new List("list", "views/scheduleListTemplate.html", "nowShowingDisplay", [], $.proxy(this.viewItem, this), $.proxy(this.editItem, this));
	this.activate();
};

ScheduleController.prototype.activate = function(listItem) {
	if (listItem) {
		if ((!listItem.series.nowShowing) && 0 === listItem.series.recordedCount && 0 === listItem.series.expectedCount) {
			this.scheduleList.items.splice(listItem.listIndex,1);
		} else {
			this.scheduleList.items[listItem.listIndex] = listItem.series;
			if (listItem.series.seriesName !== this.origSeriesName || listItem.series.nowShowing !== this.origNowShowing) {
				this.scheduleList.items = this.scheduleList.items.sort(function(a, b) {
					var x = (a.nowShowing ? a.nowShowing : "Z") + "-" + a.programName;
					var y = (b.nowShowing ? b.nowShowing : "Z") + "-" + b.programName;
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				});
			}
		}
		this.scheduleList.refresh();
		this.viewItems();
	} else {
		Series.listByNowShowing($.proxy(this.listRetrieved, this));
	}
};

ScheduleController.prototype.listRetrieved = function(scheduleList) {
	this.scheduleList.items = scheduleList;
	this.scheduleList.refresh();
  this.viewItems();
};

ScheduleController.prototype.viewItem = function(itemIndex) {
	appController.pushView("episodes", { source: "Schedule", listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
};

ScheduleController.prototype.viewUnscheduled = function() {
	appController.pushView("unscheduled");
};

ScheduleController.prototype.viewPrograms = function() {
	appController.pushView("programs");
};

ScheduleController.prototype.viewSettings = function() {
	appController.pushView("settings");
};

ScheduleController.prototype.editItem = function(itemIndex) {
	this.origSeriesName = this.scheduleList.items[itemIndex].seriesName;
	this.origNowShowing = this.scheduleList.items[itemIndex].nowShowing;
	appController.pushView("series", { listIndex: itemIndex, series: this.scheduleList.items[itemIndex] });
};

ScheduleController.prototype.editItems = function() {
	appController.clearFooter();
	this.scheduleList.setAction("edit");
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
};

ScheduleController.prototype.viewItems = function() {
	appController.clearFooter();
	this.scheduleList.setAction("view");
	$("#list").removeClass();
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.editItems, this),
			style: "toolButton",
			label: "Edit"
		},
		rightButton: {
			eventHandler: this.viewSettings,
			style: "toolButton",
			label: "Settings"
		}
	};

	appController.setFooter();
};