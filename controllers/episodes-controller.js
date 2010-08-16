function EpisodesController(listItem) {
  this.listItem = listItem;
	this.scrollToFirstUnwatched = true;
}

EpisodesController.prototype.setup = function() {
	this.header = {
		label: this.listItem.series.programName + " : " + this.listItem.series.seriesName,
		leftButton: {
			eventHandler: function(listItem) { return function() {appController.popView(listItem);}}(this.listItem),
			style: "backButton",
			label: (this.listItem.source ? this.listItem.source : "Series")
		},
		rightButton: {
			eventHandler: $.proxy(this.addItem, this),
			style: "toolButton",
			label: "+"
		}
	};

	this.episodeList = new List("list", "views/episodeListTemplate.html", null, [], $.proxy(this.viewItem, this), null, $.proxy(this.deleteItem, this), $.proxy(this.onPopulateListItem, this));
	Episode.listBySeries(this.listItem.series.id, $.proxy(this.listRetrieved, this));
}

EpisodesController.prototype.activate = function(listItem) {
	if (listItem) {
		var newWatchedCount = ("Watched" === listItem.episode.status ? 1 : 0);
		var newRecordedCount = ("Recorded" === listItem.episode.status ? 1 : 0);
		var newExpectedCount = ("Expected" === listItem.episode.status ? 1 : 0);
		var newStatusWarningCount = ("warning" === listItem.episode.statusWarning ? 1 : 0);
		if (listItem.listIndex >= 0) {
			this.episodeList.items[listItem.listIndex] = listItem.episode;
			this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + (newWatchedCount - this.origWatchedCount));
			this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + (newRecordedCount - this.origRecordedCount));
			this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + (newExpectedCount - this.origExpectedCount));
			this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + (newStatusWarningCount - this.origStatusWarningCount));
		} else {
			this.episodeList.items.push(listItem.episode);
			this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount + 1);
			this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + newWatchedCount);
			this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + newRecordedCount);
			this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + newExpectedCount);
			this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + newStatusWarningCount);
		}
	}
	this.episodeList.refresh();
	this.viewItems();
}

EpisodesController.prototype.onPopulateListItem = function(episode) {
	if (this.scrollToFirstUnwatched) {
		if ("Watched" === episode.status) {
			appController.viewStack[appController.viewStack.length - 1].scrollPos -= $("#" + String(episode.id)).innerHeight;
		} else {
			this.scrollToFirstUnwatched = false;
		}
	}
}

EpisodesController.prototype.listRetrieved = function(episodeList) {
	this.episodeList.items = episodeList;
	this.activate();
}

EpisodesController.prototype.viewItem = function(itemIndex) {
	this.origWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origStatusWarningCount = (this.episodeList.items[itemIndex].statusWarning ? 1 : 0);
	appController.pushView("episode", { listIndex: itemIndex, episode: this.episodeList.items[itemIndex] });
}

EpisodesController.prototype.addItem = function() {
	appController.pushView("episode", { series: this.listItem.series });
}

EpisodesController.prototype.deleteItem = function(itemIndex) {
	var newWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
	var newRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
	var newExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
	var newStatusWarningCount = ("warning" === this.episodeList.items[itemIndex].statusWarning ? 1 : 0);
	this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount - 1);
	this.listItem.series.setWatchedCount(this.listItem.series.watchedCount - newWatchedCount);
	this.listItem.series.setRecordedCount(this.listItem.series.recordedCount - newRecordedCount);
	this.listItem.series.setExpectedCount(this.listItem.series.expectedCount - newExpectedCount);
	this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount - newStatusWarningCount);
	this.episodeList.items[itemIndex].remove();
	this.episodeList.items.splice(itemIndex,1);
	this.episodeList.refresh();
}

EpisodesController.prototype.deleteItems = function() {
	appController.clearFooter();
	this.episodeList.setAction("delete");
	$("#list").removeClass().addClass("delete");
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

EpisodesController.prototype.editItems = function() {
	appController.clearFooter();
	this.episodeList.setAction("edit");
	$("#list").removeClass().addClass("edit");
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

EpisodesController.prototype.viewItems = function() {
	appController.clearFooter();
	this.episodeList.setAction("view");
	$("#list").removeClass();
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