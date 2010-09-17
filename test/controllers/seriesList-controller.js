module("seriesList-controller", {
	setup: function() {
		this.listItem = {
			program: {
				id: 1,
				programName: "test-program",
				seriesCount: 1,
				episodeCount: 6,
				watchedCount: 2,
				recordedCount: 2,
				expectedCount: 2,
				setEpisodeCount: function(count) {
					this.episodeCount = count;
				},
				setWatchedCount: function(count) {
					this.watchedCount = count;
				},
				setRecordedCount: function(count) {
					this.recordedCount = count;
				},
				setExpectedCount: function(count) {
					this.expectedCount = count;
				}
			}
		};
		this.items = [{
			seriesName: "test-series",
			programId: 1,
			episodeCount: 3,
			watchedCount: 1,
			recordedCount: 1,
			expectedCount: 1,
			remove: function() {
				ok(true, "Remove series");
			}
		}];
		this.originalSeries = Series;
		Series = SeriesMock;
		Series.series = this.items;
		this.seriesListController = new SeriesListController(this.listItem);
	},
	teardown: function() {
		Series = this.originalSeries;
	}
});

test("constructor", 2, function() {
	ok(this.seriesListController, "Instantiate SeriesListController object");
	same(this.seriesListController.listItem, this.listItem, "listItem property");
});

test("setup", 10, function() {
	var originalList = List;
	List = ListMock;

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.seriesListController.viewItem = function() {
		ok(true, "Bind list view event handler");
	};
	this.seriesListController.editItem = function() {
		ok(true, "Bind list edit event handler");
	};
	this.seriesListController.deleteItem = function() {
		ok(true, "Bind list delete event handler");
	};
	this.seriesListController.goBack = function() {
		ok(true, "Bind back button event handler");
	};
	this.seriesListController.addItem = function() {
		ok(true, "Bind add action event handler");
	};
	this.seriesListController.editItems = function() {
		ok(true, "Bind edit action event handler");
	};
	this.seriesListController.deleteItems = function() {
		ok(true, "Bind delete action event handler");
	};

	this.seriesListController.setup();
	equals(this.seriesListController.header.label, this.listItem.program.programName, "Header label");
	this.seriesListController.header.leftButton.eventHandler();
	this.seriesListController.header.rightButton.eventHandler();
	same(this.seriesListController.seriesList.items, this.items, "List items");
	equals(this.seriesListController.seriesList.action, "view", "List action");
	this.seriesListController.footer.leftButton.eventHandler();
	this.seriesListController.footer.rightButton.eventHandler();
	list.remove();
	List = originalList;
});

test("goBack", 1, function() {
	this.seriesListController.goBack();
});

test("activate - move", 2, function() {
	var listItem = {
		listIndex: 0,
		series: {
			programId: 2
		}
	};

	this.seriesListController.deleteItem = function(index, dontRemove) {
		equals(index, listItem.listIndex, "List index to delete");
		ok(dontRemove, "Skip database delete");
	};

	this.seriesListController.seriesList = new ListMock(null, null, null, this.items);
	this.seriesListController.activate(listItem);
});

test("activate - update", 5, function() {
	var listItem = {
		listIndex: 0,
		series: {
			seriesName: "test-series-2",
			programId: 1,
			episodeCount: 4,
			watchedCount: 2,
			recordedCount: 0,
			expectedCount: 2
		}
	};

	var origEpisodeCount = this.listItem.program.episodeCount;
	var origWatchedCount = this.listItem.program.watchedCount;
	var origRecordedCount = this.listItem.program.recordedCount;
	var origExpectedCount = this.listItem.program.expectedCount;

	var itemsCopy = JSON.parse(JSON.stringify(this.items));
	this.seriesListController.seriesList = new ListMock(null, null, null, JSON.parse(JSON.stringify(this.items)));
	this.seriesListController.origEpisodeCount = this.items[0].episodeCount;
	this.seriesListController.origWatchedCount = this.items[0].watchedCount;
	this.seriesListController.origRecordedCount = this.items[0].recordedCount;
	this.seriesListController.origExpectedCount = this.items[0].expectedCount;
	this.seriesListController.activate(listItem);
	itemsCopy[0].seriesName = listItem.series.seriesName;
	itemsCopy[0].episodeCount = listItem.series.episodeCount;
	itemsCopy[0].watchedCount = listItem.series.watchedCount;
	itemsCopy[0].recordedCount = listItem.series.recordedCount;
	itemsCopy[0].expectedCount = listItem.series.expectedCount;
	same(this.seriesListController.seriesList.items, itemsCopy, "List items");
	equals(this.seriesListController.listItem.program.episodeCount, origEpisodeCount + 1, "listItem.program.episodeCount property");
	equals(this.seriesListController.listItem.program.watchedCount, origWatchedCount + 1, "listItem.program.watchedCount property");
	equals(this.seriesListController.listItem.program.recordedCount, origRecordedCount - 1, "listItem.program.recordedCount property");
	equals(this.seriesListController.listItem.program.expectedCount, origExpectedCount + 1, "listItem.program.expectedCount property");
});

test("activate - add", 2, function() {
	var listItem = {
		listIndex: -1,
		series: {
			seriesName: "test-series-2"
		}
	};

	var origSeriesCount = this.listItem.program.seriesCount;
	var itemsCopy = JSON.parse(JSON.stringify(this.items));
	this.seriesListController.seriesList = new ListMock(null, null, null, JSON.parse(JSON.stringify(this.items)));
	this.seriesListController.activate(listItem);
	itemsCopy[1] = listItem.series;
	same(this.seriesListController.seriesList.items, itemsCopy, "List items");
	equals(this.seriesListController.listItem.program.seriesCount, origSeriesCount + 1, "listItem.program.seriesCount property");
});

test("viewItem", 6, function() {
	var index = 0;
	this.seriesListController.seriesList = { items: this.items };
	this.seriesListController.viewItem(index);
	equals(this.seriesListController.origEpisodeCount, this.items[index].episodeCount, "episodeCount property");
	equals(this.seriesListController.origWatchedCount, this.items[index].watchedCount, "watchedCount property");
	equals(this.seriesListController.origRecordedCount, this.items[index].recordedCount, "recordedCount property");
	equals(this.seriesListController.origExpectedCount, this.items[index].expectedCount, "expectedCount property");
	same(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
});

test("addItem", 2, function() {
	this.seriesListController.addItem(this.listItem.program);
	same(appController.viewArgs, { program: this.listItem.program }, "View arguments");
});

test("editItem", 6, function() {
	var index = 0;
	this.seriesListController.seriesList = { items: this.items };
	this.seriesListController.editItem(index);
	equals(this.seriesListController.origEpisodeCount, this.items[index].episodeCount, "episodeCount property");
	equals(this.seriesListController.origWatchedCount, this.items[index].watchedCount, "watchedCount property");
	equals(this.seriesListController.origRecordedCount, this.items[index].recordedCount, "recordedCount property");
	equals(this.seriesListController.origExpectedCount, this.items[index].expectedCount, "expectedCount property");
	same(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
});

test("deleteItem", 7, function() {
	var index = 0;
	this.seriesListController.seriesList = new ListMock(null, null, null, this.items);

	var origEpisodeCount = this.listItem.program.episodeCount;
	var origWatchedCount = this.listItem.program.watchedCount;
	var origRecordedCount = this.listItem.program.recordedCount;
	var origExpectedCount = this.listItem.program.expectedCount;
	var origSeriesCount = this.listItem.program.seriesCount;

	this.seriesListController.deleteItem(index, false);
	equals(this.seriesListController.listItem.program.episodeCount, origEpisodeCount - 3, "listItem.program.episodeCount property");
	equals(this.seriesListController.listItem.program.watchedCount, origWatchedCount - 1, "listItem.program.watchedCount property");
	equals(this.seriesListController.listItem.program.recordedCount, origRecordedCount - 1, "listItem.program.recordedCount property");
	equals(this.seriesListController.listItem.program.expectedCount, origExpectedCount - 1, "listItem.program.expectedCount property");
	equals(this.seriesListController.listItem.program.seriesCount, origSeriesCount - 1, "listItem.program.seriesCount property");
	same(this.seriesListController.seriesList.items, this.items.slice(1), "List items");
});

test("deleteItems", 3, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.seriesListController.viewItems = function() {
		ok(true, "Bind done action event handler");
	};

	this.seriesListController.seriesList = new ListMock();

	this.seriesListController.deleteItems();
	equals(this.seriesListController.seriesList.action, "delete", "List action");
	ok($("#list").hasClass("delete"), "Set list delete style");
	this.seriesListController.footer.rightButton.eventHandler();
	list.remove();
});

test("editItems", 3, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.seriesListController.viewItems = function() {
		ok(true, "Bind done action event handler");
	};

	this.seriesListController.seriesList = new ListMock();

	this.seriesListController.editItems();
	equals(this.seriesListController.seriesList.action, "edit", "List action");
	ok($("#list").hasClass("edit"), "Set list edit style");
	this.seriesListController.footer.leftButton.eventHandler();
	list.remove();
});