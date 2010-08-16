function UnscheduledController() {

}

UnscheduledController.prototype.setup = function() {
	this.header = {
		label: "Unscheduled",
		leftButton: {
				eventHandler: function() {appController.popView();},
				style: "backButton",
				label: "Schedule"
		}
	};

	this.unscheduledList = new List("list", "views/unscheduledListTemplate.html", null, [], $.proxy(this.viewItem, this), null);
	this.activate();
}

UnscheduledController.prototype.activate = function() {
	Episode.listByUnscheduled($.proxy(this.listRetrieved, this));
}

UnscheduledController.prototype.listRetrieved = function(unscheduledList) {
	this.unscheduledList.items = unscheduledList;
	this.unscheduledList.refresh();
  this.viewItems();
}

UnscheduledController.prototype.viewItem = function(itemIndex) {
	appController.pushView("episode", { listIndex: itemIndex, episode: this.unscheduledList.items[itemIndex] });
}

UnscheduledController.prototype.viewItems = function() {
	appController.clearFooter();
	this.unscheduledList.setAction("view");
	$("#list").removeClass();
	this.footer = {
		label: "v" + appController.db.version
	};

	appController.setFooter();
}