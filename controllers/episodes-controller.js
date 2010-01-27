function EpisodesController(listItem) {
  this.listItem = listItem;
}

EpisodesController.prototype.setup = function() {
    this.header = {
        label: this.listItem.series.programName + " : " + this.listItem.series.seriesName,
        leftButton: {
            eventHandler: function(listItem) { return function() {appController.popView(listItem);}.bind(this);}.bind(this)(this.listItem),
            style: "backButton",
            label: (this.listItem.source ? this.listItem.source : "Series")
        },
        rightButton: {
            eventHandler: this.addItem.bind(this),
            style: "toolButton",
            label: "+"
        }
    };

    this.episodeList = new List("list", "views/episodeListTemplate.html", null, [], this.viewItem.bind(this), null, this.deleteItem.bind(this));
    Episode.list(this.listItem.series.id, this.listRetrieved.bind(this));
}

EpisodesController.prototype.activate = function(listItem) {
    if (listItem) {
        var newWatchedCount = ("Watched" === listItem.episode.status ? 1 : 0);
        var newRecordedCount = ("Recorded" === listItem.episode.status ? 1 : 0);
        var newExpectedCount = ("Expected" === listItem.episode.status ? 1 : 0);
        if (listItem.listIndex >= 0) {
            this.episodeList.items[listItem.listIndex] = listItem.episode;
            this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + (newWatchedCount - this.origWatchedCount));
            this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + (newRecordedCount - this.origRecordedCount));
            this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + (newExpectedCount - this.origExpectedCount));
        } else {
            this.episodeList.items.push(listItem.episode);
            this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount + 1);
            this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + newWatchedCount);
            this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + newRecordedCount);
            this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + newExpectedCount);
        }
    }
    this.episodeList.refresh();
    this.viewItems();
}

EpisodesController.prototype.listRetrieved = function(episodeList) {
    this.episodeList.items = episodeList;
    this.activate();
}

EpisodesController.prototype.viewItem = function(itemIndex) {
    this.origWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
    this.origRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
    this.origExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
    appController.pushView("episode", { listIndex: itemIndex, episode: this.episodeList.items[itemIndex] });
}

EpisodesController.prototype.addItem = function() {
    appController.pushView("episode", { series: this.listItem.series });
}

EpisodesController.prototype.deleteItem = function(itemIndex) {
    var newWatchedCount = ("Watched" === this.episodeList.items[itemIndex].status ? 1 : 0);
    var newRecordedCount = ("Recorded" === this.episodeList.items[itemIndex].status ? 1 : 0);
    var newExpectedCount = ("Expected" === this.episodeList.items[itemIndex].status ? 1 : 0);
    this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount - 1);
    this.listItem.series.setWatchedCount(this.listItem.series.watchedCount - newWatchedCount);
    this.listItem.series.setRecordedCount(this.listItem.series.recordedCount - newRecordedCount);
    this.listItem.series.setExpectedCount(this.listItem.series.expectedCount - newExpectedCount);
    this.episodeList.items[itemIndex].remove();
    this.episodeList.items.splice(itemIndex,1);
    this.episodeList.refresh();
}

EpisodesController.prototype.deleteItems = function() {
    appController.clearFooter();
    this.episodeList.setAction("delete");
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

EpisodesController.prototype.editItems = function() {
    appController.clearFooter();
    this.episodeList.setAction("edit");
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

EpisodesController.prototype.viewItems = function() {
    appController.clearFooter();
    this.episodeList.setAction("view");
    $("list").className = "";
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