module("episode-controller", {
	setup: function() {
		this.listItem = {
			listIndex: 0,
			episode: {
				episodeName: "test-episode",
				status: "Watched",
				statusDate: "01-Jan",
				unverified: false,
				unscheduled: false,
				save: function() {
					ok(true, "Save episode");
				},
				setStatus: function(status) {
					this.status = status;
				},
				setStatusDate: function(statusDate) {
					this.statusDate = statusDate;
				},
				setUnverified: function(unverified) {
					this.unverified = unverified;
				}
			}
		};

		this.episodeName = $("<input>")
			.attr("id", "episodeName")
			.hide()
			.appendTo(document.body);

		this.watched = $("<div>")
			.attr("id", "watched")
			.hide()
			.appendTo(document.body);

		this.recorded = $("<div>")
			.attr("id", "recorded")
			.hide()
			.appendTo(document.body);

		this.expected = $("<div>")
			.attr("id", "expected")
			.hide()
			.appendTo(document.body);

		this.missed = $("<div>")
			.attr("id", "missed")
			.hide()
			.appendTo(document.body);

		this.statusDate = $("<input>")
			.attr("id", "statusDate")
			.hide()
			.appendTo(document.body);

		this.unverified = $("<input type='checkbox'>")
			.attr("id", "unverified")
			.hide()
			.appendTo(document.body);

		this.unscheduled = $("<input type='checkbox'>")
			.attr("id", "unscheduled")
			.hide()
			.appendTo(document.body);

		this.swWrapper = $("<div>")
			.attr("id", "sw-wrapper")
			.hide()
			.appendTo(document.body);

		this.originalSpinningWheel = SpinningWheel;
		SpinningWheel = SpinningWheelMock;

		this.episodeController = new EpisodeController(this.listItem);
	},
	teardown: function() {
		this.episodeName.remove();
		this.watched.remove();
		this.recorded.remove();
		this.expected.remove();
		this.missed.remove();
		this.statusDate.remove();
		this.unverified.remove();
		this.unscheduled.remove();
		this.swWrapper.remove();
		SpinningWheel.slots = [];
		SpinningWheel = this.originalSpinningWheel;
	}
});

test("constructor - update", 4, function() {
	ok(this.episodeController, "Instantiate EpisodeController object");
	same(this.episodeController.listItem, this.listItem, "listItem property");
	equals(this.episodeController.originalStatus, this.listItem.episode.status, "originalStatus property");
	equals(this.episodeController.originalStatusDate, this.listItem.episode.statusDate, "originalStatusDate property");
});

test("constructor - add", 2, function() {
	var series = { id: 1 };
	var sequence = 1;

	var listItem = {
		episode: new Episode(null, "", "", "", false, false, sequence, series.id)
	};

	this.episodeController = new EpisodeController({
		series: series,
		sequence: sequence
	});
	
	ok(this.episodeController, "Instantiate EpisodeController object");
	same(this.episodeController.listItem, listItem, "listItem property");
});

test("setup", 14, function() {
	this.episodeController.cancel = function() {
		ok(true, "Bind back button event handler");
	};
	this.episodeController.save = function() {
		ok(true, "Bind save button event handler");
	};
	this.episodeController.setStatus = function(status) {
		ok(true, "Bind " + status + " click event listener");
	};
	this.episodeController.getStatusDate = function() {
		ok(true, "Bind status date click event listener");
	};
	this.episodeController.toggleStatusDateRow = function() {
		ok(true, "Bind unscheduled click event listener");
	};

	this.episodeController.setup();
	this.episodeController.header.leftButton.eventHandler();
	this.episodeController.header.rightButton.eventHandler();
	equals(this.episodeName.val(), this.listItem.episode.episodeName, "Episode name");
	equals(this.unverified.is(":checked"), this.listItem.episode.unverified, "Unverified");
	equals(this.unscheduled.is(":checked"), this.listItem.episode.unscheduled, "Unscheduled");
	this.watched.trigger("click");
	this.recorded.trigger("click");
	this.expected.trigger("click");
	this.missed.trigger("click");
	this.statusDate.trigger("click");
	this.unscheduled.trigger("click");
	equals(this.statusDate.val(), this.listItem.episode.statusDate, "Status date");
});

test("save", 6, function() {
	var episodeName = "test-episode-2";
	var unverified = true;
	var unscheduled = true;
	this.episodeName.val(episodeName);
	this.unverified.attr("checked", unverified);
	this.unscheduled.attr("checked", unscheduled);
	appController.viewStack = [
		{ scrollPos: 0 },
		{ scrollPos: 0 }
	];
	this.episodeController.listItem.listIndex = -1;
	this.episodeController.save();
	equals(this.episodeController.listItem.episode.episodeName, episodeName, "listItem.episode.episodeName property");
	equals(this.episodeController.listItem.episode.unverified, unverified, "listItem.episode.unverified property");
	equals(this.episodeController.listItem.episode.unscheduled, unscheduled, "listItem.episode.unscheduled property");
	equals(appController.viewStack[0].scrollPos, -1, "Scroll position");
});

test("cancel", 3, function() {
	this.episodeController.listItem.episode.status = "Recorded";
	this.episodeController.listItem.episode.statusDate = "02-Jan";
	this.episodeController.cancel();
	equals(this.episodeController.listItem.episode.status, this.listItem.episode.status, "listItem.episode.status property");
	equals(this.episodeController.listItem.episode.statusDate, this.listItem.episode.statusDate, "listItem.episode.statusDate property");
});

test("setStatus - setting", 1, function() {
	this.episodeController.settingStatus = true;
	this.episodeController.setStatus();
	ok(this.episodeController.settingStatus, "Blocked by semaphore");
});

test("setStatus", function() {
	var testParams = [
		{
			description: "unset",
			unverifiedVisible: false
		},
		{
			description: "Watched",
			status: "Watched",
			button: this.watched,
			unverifiedVisible: false
		},
		{
			description: "Recorded",
			status: "Recorded",
			button: this.recorded,
			unverifiedVisible: true
		},
		{
			description: "Expected",
			status: "Expected",
			button: this.expected,
			unverifiedVisible: true
		},
		{
			description: "Missed",
			status: "Missed",
			button: this.missed,
			unverifiedVisible: true
		}
	];

	this.episodeController.toggleStatusDateRow = function() {
	};

	var unverifiedRow = $("<div>")
		.attr("id", "unverifiedRow")
		.hide()
		.appendTo(document.body);

	expect(testParams.length * 3);
	for (var i = 0; i < testParams.length; i++) {
		if (!testParams[i].status) {
			testParams[i].status = this.episodeController.listItem.episode.status;
			testParams[i].expectedStatus = "";
		} else {
			this.episodeController.listItem.episode.status = "";
			testParams[i].expectedStatus = testParams[i].status;
		}
		this.episodeController.setStatus(testParams[i].status);
		equals(this.episodeController.listItem.episode.status, testParams[i].expectedStatus, testParams[i].description + " - listItem.episode.status property");
		if (testParams[i].button) {
			ok(testParams[i].button.hasClass("status"), testParams[i].description + " - Toggle button style");
		}
		equals(!unverifiedRow.is(":hidden"), testParams[i].unverifiedVisible, testParams[i].description + " - Unverified row visible");
	}

	ok(!this.episodeController.settingStatus, "Reset semaphore");
	unverifiedRow.remove();
});

test("getStatusDate - without date", 3, function() {
	var originalDate = Date;
	var fakeDate = new Date(1900, 1, 2, 12, 0, 0);
	Date = function() {
		return fakeDate;
	};

	this.episodeController.listItem.episode.statusDate = "";
	this.episodeController.setStatusDate = function() {
		ok(true, "Set done action callback");
	};

	this.episodeController.getStatusDate();
	equals(SpinningWheel.slots[0], 2, "Slot 1 value");
	equals(SpinningWheel.slots[1], "Feb", "Slot 2 value");
	Date = originalDate;
});

test("getStatusDate - with date", 3, function() {
	this.episodeController.setStatusDate = function() {
		ok(true, "Set done action callback");
	};

	this.episodeController.getStatusDate();
	equals(SpinningWheel.slots[0], 1, "Slot 1 value");
	equals(SpinningWheel.slots[1], "Jan", "Slot 2 value");
});

test("setStatusDate", 2, function() {
	var statusDateDay = "02";
	var statusDateMonth = "Feb";
	SpinningWheel.selectedValues.values = [statusDateDay, statusDateMonth];
	this.episodeController.setStatusDate();
	equals(this.episodeController.listItem.episode.statusDate, statusDateDay + "-" + statusDateMonth, "listItem.episode.statusDate property");
	equals(this.statusDate.val(), statusDateDay + "-" + statusDateMonth, "Now showing");
});

test("toggleStatusDateRow", function() {
	var testParams = [
		{
			description: "hidden",
			unscheduled: false,
			status: "Watched",
			visible: false
		},
		{
			description: "unscheduled",
			unscheduled: true,
			status: "Watched",
			statusDate: "",
			visible: true
		},
		{
			description: "recorded",
			unscheduled: false,
			status: "Recorded",
			visible: true
		},
		{
			description: "expected",
			unscheduled: false,
			status: "Expected",
			visible: true
		},
		{
			description: "missed",
			unscheduled: false,
			status: "Missed",
			visible: true
		}
	];

	var statusDateRow = $("<div>")
		.attr("id", "statusDateRow")
		.hide()
		.appendTo(document.body);

	var i;

	this.episodeController.getStatusDate = function() {
		ok(true, testParams[i].description + " - Show spinning wheel");
	};

	expect(testParams.length + 1);
	for (i = 0; i < testParams.length; i++) {
		this.unscheduled.attr("checked", testParams[i].unscheduled);
		this.episodeController.listItem.episode.status = testParams[i].status;
		if ("undefined" !== testParams[i].statusDate) {
			this.episodeController.listItem.episode.statusDate = testParams[i].statusDate;
		}
		this.episodeController.toggleStatusDateRow();
		equals(!statusDateRow.is(":hidden"), testParams[i].visible, testParams[i].description + " - Status date row visible");
	}

	statusDateRow.remove();
});