var EpisodesController = function (listItem) {
  this.listItem = listItem;
	this.scrollToFirstUnwatched = true;
};

EpisodesController.prototype.setup = function() {
	this.header = {
		label: this.listItem.series.programName + " : " + this.listItem.series.seriesName,
		leftButton: {
			eventHandler: $.proxy(this.goBack, this),
			style: "backButton",
			label: this.listItem.source || "Series"
		},
		rightButton: {
			eventHandler: $.proxy(this.addItem, this),
			style: "toolButton",
			label: "+"
		}
	};

	this.episodeList = new List("list", "views/episodeListTemplate.html", null, [], $.proxy(this.viewItem, this), null, $.proxy(this.deleteItem, this), $.proxy(this.onPopulateListItem, this));
	Episode.listBySeries(this.listItem.series.id, $.proxy(this.listRetrieved, this));
};

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
};

EpisodesController.prototype.onPopulateListItem = function(episode) {
	if (this.scrollToFirstUnwatched) {
		if ("Watched" === episode.status) {
			appController.viewStack[appController.viewStack.length - 1].scrollPos += $("#" + String(episode.id)).parent().outerHeight();
		} else {
			this.scrollToFirstUnwatched = false;
		}
	}
};

EpisodesController.prototype.listRetrieved = function(episodeList) {
	this.episodeList.items = episodeList;
	this.activate();
};

EpisodesController.prototype.goBack = function() {
	appController.popView(this.listItem);
};

EpisodesController.prototype.viewItem = function(itemIndex) {
	this.origWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
	this.origStatusWarningCount = (this.episodeList.items[itemIndex].statusWarning ? 1 : 0);
	appController.pushView("episode", { listIndex: itemIndex, episode: this.episodeList.items[itemIndex] });
};

EpisodesController.prototype.addItem = function() {
	appController.pushView("episode", { series: this.listItem.series, sequence: this.episodeList.items.length });
};

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
	$("#list li a#" + this.episodeList.items[itemIndex].id).remove();
	this.episodeList.items[itemIndex].remove();
	this.episodeList.items.splice(itemIndex,1);
	this.resequenceItems();
};

EpisodesController.prototype.deleteItems = function() {
	this.episodeList.setAction("delete");
	appController.clearFooter();
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
};

EpisodesController.prototype.resequenceItems = function() {
	var that = this;
	$("#list li a").each(function(index) {
		if ($(this).attr("id") !== that.episodeList.items[index].id) {
			for (var i = 0; i < that.episodeList.items.length; i++) {
				if (that.episodeList.items[i].id === $(this).attr("id")) {
					that.episodeList.items[i].sequence = index;
					that.episodeList.items[i].save();
					break;
				}
			}
		}
	});

	this.episodeList.items = this.episodeList.items.sort(function(a, b) {
		var x = a.sequence;
		var y = b.sequence;
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});

	this.episodeList.refresh();
};

EpisodesController.prototype.editItems = function() {
	this.episodeList.setAction("edit");
	appController.clearFooter();
	$("#list")
		.removeClass()
		.addClass("edit")
		.sortable({
			axis: "y",
			sort: function(e, ui) {
				$(ui.helper).offset({top: e.clientY - 20});
			}
		})
		.addTouch();
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(function() {
				this.resequenceItems();
				this.viewItems();
			}, this),
			style: "blueButton",
			label: "Done"
		}
	};

	appController.setFooter();
};

EpisodesController.prototype.viewItems = function() {
	this.episodeList.setAction("view");
	appController.clearFooter();
	$("#list")
		.removeClass()
		.sortable("destroy")
		.removeTouch();
	this.footer = {
		label: "v" + appController.db.version,
		leftButton: {
			eventHandler: $.proxy(this.editItems, this),
			style: "toolButton",
			label: "Sort"
		},
		rightButton: {
			eventHandler: $.proxy(this.deleteItems, this),
			style: "redButton",
			label: "Delete"
		}
	};

	appController.setFooter();
};
