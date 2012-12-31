module("schedule-controller", {
	setup: function() {
		"use strict";

		this.items = [
			{
				programName: "test-program-2",
				seriesName: "test-series",
				nowShowing: 1,
				recordedCount: 0,
				expectedCount: 0
			},
			{
				programName: "test-program-3",
				seriesName: "test-series",
				nowShowing: 1,
				recordedCount: 0,
				expectedCount: 0
			},
			{
				programName: "test-program-1",
				seriesName: "test-series",
				nowShowing: null,
				recordedCount: 0,
				expectedCount: 0
			}
		];
		this.scheduleController = new ScheduleController();
	}
});

test("constructor", 1, function() {
	"use strict";

	ok(this.scheduleController, "Instantiate ScheduleController object");
});

test("setup", 8, function() {
	"use strict";

	var originalList = List;
	List = ListMock;

	var originalSeries = Series;
	Series = SeriesMock;
	Series.series = this.items;

	this.scheduleController.viewItem = function() {
		ok(true, "Bind list view event handler");
	};
	this.scheduleController.editItem = function() {
		ok(true, "Bind list edit event handler");
	};
	this.scheduleController.editItems = function() {
		ok(true, "Bind edit action event handler");
	};
	this.scheduleController.viewUnscheduled = function() {
		ok(true, "Bind view unscheduled event handler");
	};
	this.scheduleController.viewPrograms = function() {
		ok(true, "Bind view programs event handler");
	};
	this.scheduleController.viewSettings = function() {
		ok(true, "Bind view settings event handler");
	};

	this.scheduleController.setup();
	same(this.scheduleController.scheduleList.items, this.items, "List items");
	equals(this.scheduleController.scheduleList.action, "view", "List action");
	this.scheduleController.header.leftButton.eventHandler();
	this.scheduleController.header.rightButton.eventHandler();
	this.scheduleController.footer.leftButton.eventHandler();
	this.scheduleController.footer.rightButton.eventHandler();
	List = originalList;
	Series = originalSeries;
});

test("activate - item not in schedule", 1, function() {
	"use strict";

	var listItem = {
		listIndex: 0,
		series: {
			nowShowing: null,
			recordedCount: 0,
			expectedCount: 0
		}
	};

	this.scheduleController.scheduleList = new ListMock(null, null, null, this.items.slice(0));
	this.scheduleController.activate(listItem);
	same(this.scheduleController.scheduleList.items, this.items.slice(1), "List items");
});

test("activate - item in schedule", function() {
	"use strict";

	var testParams = [
		{
			description: "series name change",
			listItem: {
				listIndex: 0,
				series: {
					programName: "test-program-4",
					seriesName: "test-series-2",
					nowShowing: 1,
					recordedCount: 0,
					expectedCount: 0
				}
			}
		},
		{
			description: "now showing change",
			listItem: {
				listIndex: 0,
				series: {
					programName: "test-program-2",
					seriesName: "test-series",
					nowShowing: 2,
					recordedCount: 0,
					expectedCount: 0
				}
			}
		}
	];

	expect(testParams.length);
	for (var i = 0; i < testParams.length; i++) {
		var itemsCopy = JSON.parse(JSON.stringify(this.items));
		this.scheduleController.scheduleList = new ListMock(null, null, null, JSON.parse(JSON.stringify(this.items)));
		this.scheduleController.origSeriesName = this.items[0].seriesName;
		this.scheduleController.origNowShowing = this.items[0].nowShowing;
		this.scheduleController.activate(testParams[i].listItem);
		itemsCopy[0].programName = "test-program-3";
		itemsCopy[1] = testParams[i].listItem.series;
		same(this.scheduleController.scheduleList.items, itemsCopy, testParams[i].description + " - List items");
	}
});

test("viewItem", 2, function() {
	"use strict";

	var index = 0;
	this.scheduleController.scheduleList = { items: this.items };
	this.scheduleController.viewItem(index);
	same(appController.viewArgs, { source: "Schedule", listIndex: index, series: this.items[index] }, "View arguments");
});

test("viewUnscheduled", 1, function() {
	"use strict";

	this.scheduleController.viewUnscheduled();
});

test("viewPrograms", 1, function() {
	"use strict";

	this.scheduleController.viewPrograms();
});

test("viewSettings", 1, function() {
	"use strict";

	this.scheduleController.viewSettings();
});

test("editItem", 4, function() {
	"use strict";

	var index = 0;
	this.scheduleController.scheduleList = { items: this.items };
	this.scheduleController.editItem(index);
	equals(this.scheduleController.origSeriesName, this.items[index].seriesName, "origSeriesName property");
	equals(this.scheduleController.origNowShowing, this.items[index].nowShowing, "origNowShowing property");
	same(appController.viewArgs, { listIndex: index, series: this.items[index] }, "View arguments");
});

test("editItems", 3, function() {
	"use strict";

	var list = $("<ul>")
		.attr("id", "list")
		.hide()
		.appendTo(document.body);

	this.scheduleController.viewItems = function() {
		ok(true, "Bind done action event handler");
	};

	this.scheduleController.scheduleList = new ListMock();

	this.scheduleController.editItems();
	equals(this.scheduleController.scheduleList.action, "edit", "List action");
	ok($("#list").hasClass("edit"), "Set list edit style");
	this.scheduleController.footer.leftButton.eventHandler();
	list.remove();
});
