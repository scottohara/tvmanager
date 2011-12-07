var SeriesListController = function (listItem) {
    this.listItem = listItem;
};

SeriesListController.prototype.setup = function() {
    this.header = {
        label: this.listItem.program.programName,
        leftButton: {
            eventHandler: $.proxy(this.goBack, this),
            style: "backButton",
            label: "Programs"
        },
        rightButton: {
            eventHandler: $.proxy(this.addItem, this),
            style: "toolButton",
            label: "+"
        }
    };

    this.seriesList = new List("list", "views/seriesListTemplate.html", null, [], $.proxy(this.viewItem, this), $.proxy(this.editItem, this), $.proxy(this.deleteItem, this));
    Series.listByProgram(this.listItem.program.id, $.proxy(this.listRetrieved, this));
};

SeriesListController.prototype.activate = function(listItem) {
    if (listItem) {
        if (listItem.listIndex >= 0) {
						if (listItem.series.programId !== this.listItem.program.id) {
							this.deleteItem(listItem.listIndex, true);
						} else {
							this.seriesList.items[listItem.listIndex] = listItem.series;
							this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount + (listItem.series.episodeCount - this.origEpisodeCount));
							this.listItem.program.setWatchedCount(this.listItem.program.watchedCount + (listItem.series.watchedCount - this.origWatchedCount));
							this.listItem.program.setRecordedCount(this.listItem.program.recordedCount + (listItem.series.recordedCount - this.origRecordedCount));
							this.listItem.program.setExpectedCount(this.listItem.program.expectedCount + (listItem.series.expectedCount - this.origExpectedCount));
						}
        } else {
            this.seriesList.items.push(listItem.series);
            this.listItem.program.seriesCount++;
        }
    }
    this.seriesList.refresh();
    this.viewItems();
};

SeriesListController.prototype.listRetrieved = function(seriesList) {
    this.seriesList.items = seriesList;
    this.activate();
};

SeriesListController.prototype.goBack = function() {
	appController.popView(this.listItem);
};

SeriesListController.prototype.viewItem = function(itemIndex) {
    this.origEpisodeCount = this.seriesList.items[itemIndex].episodeCount;
    this.origWatchedCount = this.seriesList.items[itemIndex].watchedCount;
    this.origRecordedCount = this.seriesList.items[itemIndex].recordedCount;
    this.origExpectedCount = this.seriesList.items[itemIndex].expectedCount;
    appController.pushView("episodes", { listIndex: itemIndex, series: this.seriesList.items[itemIndex] });
};

SeriesListController.prototype.addItem = function() {
    appController.pushView("series", { program: this.listItem.program });
};

SeriesListController.prototype.editItem = function(itemIndex) {
    this.origEpisodeCount = this.seriesList.items[itemIndex].episodeCount;
    this.origWatchedCount = this.seriesList.items[itemIndex].watchedCount;
    this.origRecordedCount = this.seriesList.items[itemIndex].recordedCount;
    this.origExpectedCount = this.seriesList.items[itemIndex].expectedCount;
    appController.pushView("series", { listIndex: itemIndex, series: this.seriesList.items[itemIndex] });
};

SeriesListController.prototype.deleteItem = function(itemIndex, dontRemove) {
    this.listItem.program.setEpisodeCount(this.listItem.program.episodeCount - this.seriesList.items[itemIndex].episodeCount);
    this.listItem.program.setWatchedCount(this.listItem.program.watchedCount - this.seriesList.items[itemIndex].watchedCount);
    this.listItem.program.setRecordedCount(this.listItem.program.recordedCount - this.seriesList.items[itemIndex].recordedCount);
    this.listItem.program.setExpectedCount(this.listItem.program.expectedCount - this.seriesList.items[itemIndex].expectedCount);
    this.listItem.program.seriesCount--;
		if (!dontRemove) {
			this.seriesList.items[itemIndex].remove();
		}
    this.seriesList.items.splice(itemIndex,1);
    this.seriesList.refresh();
};

SeriesListController.prototype.deleteItems = function() {
    this.seriesList.setAction("delete");
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

SeriesListController.prototype.editItems = function() {
    this.seriesList.setAction("edit");
    appController.clearFooter();
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

SeriesListController.prototype.viewItems = function() {
    this.seriesList.setAction("view");
    appController.clearFooter();
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
};
