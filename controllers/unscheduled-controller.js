function UnscheduledController() {

}

UnscheduledController.prototype.setup = function() {
	this.header = {
		label: "Unscheduled",
		leftButton: {
				eventHandler: function() {appController.popView();}.bind(this),
				style: "backButton",
				label: "Schedule"
		}
	};

	this.unscheduledList = new List("list", "views/unscheduledListTemplate.html", null, [], this.viewItem.bind(this), null);
	this.activate();
}

UnscheduledController.prototype.activate = function() {
	Episode.listByUnscheduled(this.listRetrieved.bind(this));
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
	$("list").className = "";
	this.footer = {
		label: "v" + db.version
	};

	appController.setFooter();
}