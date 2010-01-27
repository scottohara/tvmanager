function SeriesListController(listItem) {
    this.listItem = listItem;
}

SeriesListController.prototype.setup = function() {
    this.header = {
        label: this.listItem.program.programName,
        leftButton: {
            eventHandler: function(listItem) { return function() {appController.popView(listItem);}.bind(this);}.bind(this)(this.listItem),
            style: "backButton",
            label: "Programs"
        },
        rightButton: {
            eventHandler: this.addItem.bind(this),
            style: "toolButton",
            label: "+"
        }
    };

    this.seriesList = new List("list", "views/seriesListTemplate.html", null, [], this.viewItem.bind(this), this.editItem.bind(this), this.deleteItem.bind(this));
    Series.listByProgram(this.listItem.program.id, this.listRetrieved.bind(this));
}

SeriesListController.prototype.activate = function(listItem) {
    if (listItem) {
        if (listItem.listIndex >= 0) {
            this.seriesList.items[listItem.listIndex] = listItem.series;
            this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount + (listItem.series.episodeCount - this.origEpisodeCount));
            this.listItem.program.setWatchedCount(this.listItem.program.watchedCount + (listItem.series.watchedCount - this.origWatchedCount));
            this.listItem.program.setRecordedCount(this.listItem.program.recordedCount + (listItem.series.recordedCount - this.origRecordedCount));
            this.listItem.program.setExpectedCount(this.listItem.program.expectedCount + (listItem.series.expectedCount - this.origExpectedCount));
        } else {
            this.seriesList.items.push(listItem.series);
            this.listItem.program.seriesCount++;
        }
    }
    this.seriesList.refresh();
    this.viewItems();
}

SeriesListController.prototype.listRetrieved = function(seriesList) {
    this.seriesList.items = seriesList;
    this.activate();
}

SeriesListController.prototype.viewItem = function(itemIndex) {
    this.origEpisodeCount = this.seriesList.items[itemIndex].episodeCount;
    this.origWatchedCount = this.seriesList.items[itemIndex].watchedCount;
    this.origRecordedCount = this.seriesList.items[itemIndex].recordedCount;
    this.origExpectedCount = this.seriesList.items[itemIndex].expectedCount;
    appController.pushView("episodes", { listIndex: itemIndex, series: this.seriesList.items[itemIndex] });
}

SeriesListController.prototype.addItem = function() {
    appController.pushView("series", { program: this.listItem.program });
}

SeriesListController.prototype.editItem = function(itemIndex) {
    appController.pushView("series", { listIndex: itemIndex, series: this.seriesList.items[itemIndex] });
}

SeriesListController.prototype.deleteItem = function(itemIndex) {
    this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount - this.seriesList.items[itemIndex].episodeCount);
    this.listItem.program.setWatchedCount(this.listItem.program.watchedCount - this.seriesList.items[itemIndex].watchedCount);
    this.listItem.program.setRecordedCount(this.listItem.program.recordedCount - this.seriesList.items[itemIndex].recordedCount);
    this.listItem.program.setExpectedCount(this.listItem.program.expectedCount - this.seriesList.items[itemIndex].expectedCount);
    this.listItem.program.seriesCount--;
    this.seriesList.items[itemIndex].remove();
    this.seriesList.items.splice(itemIndex,1);
    this.seriesList.refresh();
}

SeriesListController.prototype.deleteItems = function() {
    appController.clearFooter();
    this.seriesList.setAction("delete");
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

SeriesListController.prototype.editItems = function() {
    appController.clearFooter();
    this.seriesList.setAction("edit");
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

SeriesListController.prototype.viewItems = function() {
    appController.clearFooter();
    this.seriesList.setAction("view");
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