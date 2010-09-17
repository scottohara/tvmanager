module("episodes-controller", {
	setup: function() {
		this.listItem = {
			source: "test-source",
			series: {
				id: 1,
				seriesName: "test-series",
				programName: "test-program",
				episodeCount: 6,
				watchedCount: 2,
				recordedCount: 2,
				expectedCount: 2,
				statusWarningCount: 2,
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
				},
				setStatusWarning: function(count) {
					this.statusWarningCount = count;
				}
			}
		};
		this.items = [{
			id: 1,
			episodeName: "test-episode",
			status: "Watched",
			statusWarning: "warning",
			remove: function() {
				ok(true, "Remove episode");
			}
		}];
		this.originalEpisode = Episode;
		Episode = EpisodeMock;
		Episode.episodes = this.items;
		this.episodesController = new EpisodesController(this.listItem);
	},
	teardown: function() {
		Episode = this.originalEpisode;
	}
});

test("constructor", 3, function() {
	ok(this.episodesController, "Instantiate EpisodesController object");
	same(this.episodesController.listItem, this.listItem, "listItem property");
	ok(this.episodesController.scrollToFirstUnwatched, "scrollToFirstUnwatched property");
});

test("setup", 11, function() {
	var originalList = List;
	List = ListMock;

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.episodesController.viewItem = function() {
		ok(true, "Bind list view event handler")
	};
	this.episodesController.deleteItem = function() {
		ok(true, "Bind list delete event handler")
	};
	this.episodesController.onPopulateListItem = function() {
		ok(true, "Bind list populate event handler")
	};
	this.episodesController.goBack = function() {
		ok(true, "Bind back button event handler")
	};
	this.episodesController.addItem = function() {
		ok(true, "Bind add action event handler")
	};
	this.episodesController.editItems = function() {
		ok(true, "Bind edit action event handler")
	};
	this.episodesController.deleteItems = function() {
		ok(true, "Bind delete action event handler")
	};

	this.episodesController.setup();
	equals(this.episodesController.header.label, this.listItem.series.programName + " : " + this.listItem.series.seriesName, "Header label");
	equals(this.episodesController.header.leftButton.label, this.listItem.source, "Back button label");
	this.episodesController.header.leftButton.eventHandler();
	this.episodesController.header.rightButton.eventHandler();
	same(this.episodesController.episodeList.items, this.items, "List items");
	equals(this.episodesController.episodeList.action, "view", "List action");
	this.episodesController.footer.leftButton.eventHandler();
	this.episodesController.footer.rightButton.eventHandler();
	list.remove();
	List = originalList;
});

test("goBack", 1, function() {
	this.episodesController.goBack();
});

test("activate", function() {
	var testParams = [
		{
			description: "update",
			addEpisodes: 0,
			addWatched: -1,
			addRecorded: 1,
			addExpected: 0,
			addStatusWarning: 0,
			listItem: {
				listIndex: 0,
				episode: {
					episodeName: "test-episode-2",
					status: "Recorded"
				}
			}
		},
		{
			description: "add",
			addEpisodes: 1,
			addWatched: 0,
			addRecorded: 0,
			addExpected: 1,
			addStatusWarning: 1,
			listItem: {
				listIndex: -1,
				episode: {
					episodeName: "test-episode-2",
					status: "Expected",
					statusWarning: "warning"
				}
			}
		}
	];

	expect(testParams.length * 6);
	for (var i = 0; i < testParams.length; i++) {
		var origEpisodeCount = this.listItem.series.episodeCount;
		var origWatchedCount = this.listItem.series.watchedCount;
		var origRecordedCount = this.listItem.series.recordedCount;
		var origExpectedCount = this.listItem.series.expectedCount;
		var origStatusWarningCount = this.listItem.series.statusWarningCount;
		var itemsCopy = JSON.parse(JSON.stringify(this.items));
		this.episodesController.episodeList = new ListMock(null, null, null, JSON.parse(JSON.stringify(this.items)));
		this.episodesController.origWatchedCount = 1;
		this.episodesController.origRecordedCount = 0;
		this.episodesController.origExpectedCount = 0;
		this.episodesController.origStatusWarningCount = 0;
		this.episodesController.activate(testParams[i].listItem);
		itemsCopy[testParams[i].listItem.listIndex * -1] = testParams[i].listItem.episode;
		same(this.episodesController.episodeList.items, itemsCopy, testParams[i].description + " - List items");
		equals(this.episodesController.listItem.series.episodeCount, origEpisodeCount + testParams[i].addEpisodes, testParams[i].description + " - listItem.series.episodeCount property");
		equals(this.episodesController.listItem.series.watchedCount, origWatchedCount + testParams[i].addWatched, testParams[i].description + " - listItem.series.watchedCount property");
		equals(this.episodesController.listItem.series.recordedCount, origRecordedCount + testParams[i].addRecorded, testParams[i].description + " - listItem.series.recordedCount property");
		equals(this.episodesController.listItem.series.expectedCount, origExpectedCount + testParams[i].addExpected, testParams[i].description + " - listItem.series.expectedCount property");
		equals(this.episodesController.listItem.series.statusWarningCount, origStatusWarningCount + testParams[i].addStatusWarning, testParams[i].description + " - listItem.series.statusWarningCount property");
	}
});

test("onPopulateListItem", 1, function() {
	var testParams = [
		{
			description: "watched",
			status: "Watched",
			scrollPos: -1,
			scrollToFirstUnwatched: true
		},
		{
			description: "not watched",
			status: "",
			scrollPos: 0,
			scrollToFirstUnwatched: false
		}
	];

	var listItem = $("<li>")
		.outerHeight(1)
		.hide()
		.appendTo(document.body);

	$("<a>")
		.attr("id", "test-episode")
		.hide()
		.appendTo(listItem);

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		appController.viewStack = [{ scrollPos: 0 }];
		this.episodesController.onPopulateListItem({
			id: "test-episode",
			status: testParams[i].status
		});
		equals(appController.viewStack[0].scrollPos, testParams[i].scrollPos, testParams[i].description + " - Scroll position");
		equals(this.episodesController.scrollToFirstUnwatched, testParams[i].scrollToFirstUnwatched, testParams[i].description + " - scrollToFirstUnwathced property");
	}
	listItem.remove();
});

test("viewItem", 6, function() {
	var index = 0;
	this.episodesController.episodeList = { items: this.items };
	this.episodesController.viewItem(index);
	equals(this.episodesController.origWatchedCount, 1, "watchedCount property");
	equals(this.episodesController.origRecordedCount, 0, "recordedCount property");
	equals(this.episodesController.origExpectedCount, 0, "expectedCount property");
	equals(this.episodesController.origStatusWarningCount, 1, "statusWarningCount property");
	same(appController.viewArgs, { listIndex: index, episode: this.items[index] }, "View arguments");
});

test("addItem", 2, function() {
	this.episodesController.episodeList = { items: this.items };
	this.episodesController.addItem();
	same(appController.viewArgs, { series: this.listItem.series, sequence: this.items.length }, "View arguments");
});

test("deleteItem", 8, function() {
	var index = 0;

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	$("<a>")
		.attr("id", this.items[index].id)
		.hide()
		.appendTo($("<li>")
			.hide()
			.appendTo(list));

	this.episodesController.episodeList = new ListMock(null, null, null, this.items);

	var origEpisodeCount = this.listItem.series.episodeCount;
	var origWatchedCount = this.listItem.series.watchedCount;
	var origRecordedCount = this.listItem.series.recordedCount;
	var origExpectedCount = this.listItem.series.expectedCount;
	var origStatusWarningCount = this.listItem.series.statusWarningCount;

	this.episodesController.deleteItem(index);
	equals(this.episodesController.listItem.series.episodeCount, origEpisodeCount - 1, "listItem.series.episodeCount property");
	equals(this.episodesController.listItem.series.watchedCount, origWatchedCount - 1, "listItem.series.watchedCount property");
	equals(this.episodesController.listItem.series.recordedCount, origRecordedCount, "listItem.series.recordedCount property");
	equals(this.episodesController.listItem.series.expectedCount, origExpectedCount, "listItem.series.expectedCount property");
	equals(this.episodesController.listItem.series.statusWarningCount, origStatusWarningCount - 1, "listItem.series.statusWarningCount property");
	same(this.episodesController.episodeList.items, this.items.slice(1), "List items");
	equals($("#list li a").length, 0, "Remove list item from DOM");
});

test("deleteItems", 3, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.episodesController.viewItems = function() {
		ok(true, "Bind done action event handler")
	};

	this.episodesController.episodeList = new ListMock();

	this.episodesController.deleteItems();
	equals(this.episodesController.episodeList.action, "delete", "List action");
	ok($("#list").hasClass("delete"), "Set list delete style");
	this.episodesController.footer.rightButton.eventHandler();
	list.remove();
});

test("requenceItems", function() {
	var save = function() {
		ok(true, "Save episode " + this.sequence);
	};

	var items = [
		{
			id: "test-episode-1",
			sequence: 1,
			save: save
		},
		{
			id: "test-episode-2",
			sequence: 2,
			save: save
		},
		{
			id: "test-episode-3",
			sequence: 3,
			save: save
		}
	];

	var sortedItems = [
		items[1],
		items[0],
		items[2],
	];

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	for (var i = 0; i < items.length; i++) {
		$("<a>")
			.attr("id", sortedItems[i].id)
			.hide()
			.appendTo($("<li>")
				.hide()
				.appendTo(list));
	}

	this.episodesController.episodeList = new ListMock(null, null, null, items);
	expect(items.length);
	this.episodesController.resequenceItems();
	same(this.episodesController.episodeList.items, sortedItems, "List items");
	list.remove();
});

test("editItems", 4, function() {
	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.episodesController.resequenceItems = function() {
	};
	this.episodesController.viewItems = function() {
		ok(true, "Bind done action event handler")
	};

	this.episodesController.episodeList = new ListMock();
	appController.viewStack = [{ scrollPos: 0 }];
	appController.scroller.y = 1;
	this.episodesController.editItems();
	equals(this.episodesController.episodeList.action, "edit", "List action");
	ok($("#list").hasClass("edit"), "Set list edit style");
	equals(appController.viewStack[0].scrollPos, 1, "Scroll position");
	this.episodesController.footer.leftButton.eventHandler();
	list.remove();
});