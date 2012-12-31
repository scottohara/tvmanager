module("unscheduled-controller", {
	setup: function() {
		"use strict";

		this.items = [{}];
		this.unscheduledController = new UnscheduledController();
	}
});

test("constructor", 1, function() {
	"use strict";

	ok(this.unscheduledController, "Instantiate UnscheduledController object");
});

test("setup", 4, function() {
	"use strict";

	var originalList = List;
	List = ListMock;

	var originalEpisode = Episode;
	Episode = EpisodeMock;

	this.unscheduledController.viewItem = function() {
		ok(true, "Bind list view event handler");
	};
	this.unscheduledController.goBack = function() {
		ok(true, "Bind back button event listener");
	};

	this.unscheduledController.setup();
	same(this.unscheduledController.unscheduledList.items, this.items, "List items");
	equals(this.unscheduledController.unscheduledList.action, "view", "List action");
	this.unscheduledController.header.leftButton.eventHandler();
	List = originalList;
	Episode = originalEpisode;
});

test("goBack", 1, function() {
	"use strict";

	this.unscheduledController.goBack();
});

test("viewItem", 2, function() {
	"use strict";

	var index = 0;
	this.unscheduledController.unscheduledList = { items: this.items };
	this.unscheduledController.viewItem(index);
	same(appController.viewArgs, { listIndex: index, episode: this.items[index] }, "View arguments");
});
