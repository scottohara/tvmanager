module("series-controller", {
	setup: function() {
		this.listItem = {
			listIndex: 0,
			series: {
				seriesName: "test-series",
				nowShowing: null,
				nowShowingDisplay: "Not Showing",
				programId: 1,
				save: function() {
					ok(true, "Save series");
				},
				setNowShowing: function(nowShowing) {
					this.nowShowing = nowShowing;
					this.nowShowingDisplay = Series.NOW_SHOWING[this.nowShowing];
				}
			}
		};

		this.seriesName = $("<input>")
			.attr("id", "seriesName")
			.hide()
			.appendTo(document.body);

		this.nowShowing = $("<input>")
			.attr("id", "nowShowing")
			.hide()
			.appendTo(document.body);

		this.moveTo = $("<input>")
			.attr("id", "moveTo")
			.hide()
			.appendTo(document.body);

		this.swWrapper = $("<div>")
			.attr("id", "sw-wrapper")
			.hide()
			.appendTo(document.body);

		this.originalSpinningWheel = SpinningWheel;
		SpinningWheel = SpinningWheelMock;

		this.seriesController = new SeriesController(this.listItem);
	},
	teardown: function() {
		this.seriesName.remove();
		this.nowShowing.remove();
		this.moveTo.remove();
		this.swWrapper.remove();
		SpinningWheel.slots = [];
		SpinningWheel = this.originalSpinningWheel;
	}
});

test("constructor - update", 4, function() {
	ok(this.seriesController, "Instantiate SeriesController object");
	same(this.seriesController.listItem, this.listItem, "listItem property");
	equals(this.seriesController.originalNowShowing, this.listItem.series.nowShowing, "originalNowShowing property");
	equals(this.seriesController.originalProgramId, this.listItem.series.programId, "originalProgramId property");
});

test("constructor - add", 2, function() {
	var program = {
		id: 1,
		programName: "test-program"
	};

	var listItem = {
		series: new Series(null, "", "", program.id, program.programName, 0, 0, 0, 0, 0, 0)
	};

	this.seriesController = new SeriesController({ program: program });
	ok(this.seriesController, "Instantiate SeriesController object");
	same(this.seriesController.listItem, listItem, "listItem property");
});

test("setup", 7, function() {
	this.seriesController.cancel = function() {
		ok(true, "Bind back button event handler");
	};
	this.seriesController.save = function() {
		ok(true, "Bind save button event handler");
	};
	this.seriesController.getNowShowing = function() {
		ok(true, "Bind now showing click event listener");
	};
	this.seriesController.getProgramId = function() {
		ok(true, "Bind move to click event listener");
	};

	this.seriesController.setup();
	this.seriesController.header.leftButton.eventHandler();
	this.seriesController.header.rightButton.eventHandler();
	equals(this.seriesName.val(), this.listItem.series.seriesName, "Series name");
	equals(this.nowShowing.val(), this.listItem.series.nowShowingDisplay, "Now showing");
	this.nowShowing.trigger("click");
	this.moveTo.trigger("click");
});

test("save", 4, function() {
	var seriesName = "test-series-2";
	this.seriesName.val(seriesName);
	appController.viewStack = [
		{ scrollPos: 0 },
		{ scrollPos: 0 }
	];
	this.seriesController.listItem.listIndex = -1;
	this.seriesController.save();
	equals(this.seriesController.listItem.series.seriesName, seriesName, "listItem.series.seriesName property");
	equals(appController.viewStack[0].scrollPos, -1, "Scroll position");
});

test("cancel", 3, function() {
	this.seriesController.listItem.series.nowShowing = 2;
	this.seriesController.listItem.series.programId = 2;
	this.seriesController.cancel();
	equals(this.seriesController.listItem.series.nowShowing, this.listItem.series.nowShowing, "listItem.series.nowShowing property");
	equals(this.seriesController.listItem.series.programId, this.listItem.series.programId, "listItem.series.programId property");
});

test("getNowShowing - getting", 1, function() {
	this.seriesController.gettingNowShowing = true;
	this.seriesController.getNowShowing();
	ok(this.seriesController.gettingNowShowing, "Blocked by semaphore");
});

test("getNowShowing - not getting", 3, function() {
	this.seriesController.setNowShowing = function() {
		ok(true, "Set done action callback");
	};

	this.seriesController.getNowShowing();
	equals(SpinningWheel.slots[0], 0, "Selected value");
	ok(!this.seriesController.gettingNowShowing, "Reset semaphore");
});

test("setNowShowing", 2, function() {
	var nowShowing = 1;
	var nowShowingDisplay = "Mondays";
	SpinningWheel.selectedValues.keys = [nowShowing];
	SpinningWheel.selectedValues.values = [nowShowingDisplay];
	this.seriesController.setNowShowing();
	equals(this.seriesController.listItem.series.nowShowing, nowShowing, "listItem.series.nowShowing property");
	equals(this.nowShowing.val(), nowShowingDisplay, "Now showing");
});

test("getProgramId - getting", 1, function() {
	this.seriesController.gettingProgramId = true;
	this.seriesController.getProgramId();
	ok(this.seriesController.gettingProgramId, "Blocked by semaphore");
});

test("getProgramId - not getting", 3, function() {
	this.seriesController.setProgramId = function() {
		ok(true, "Set done action callback");
	};

	var originalProgram = Program;
	Program = ProgramMock;
	Program.programs = [{
		id: 1,
		programName: "test-program-1"
	}];

	this.seriesController.getProgramId();
	equals(SpinningWheel.slots[0], this.listItem.series.programId, "Selected value");
	ok(!this.seriesController.gettingProgramId, "Reset semaphore");
	Program = originalProgram;
});

test("setProgramId", 2, function() {
	var programId = 2;
	var programName = "test-program-2";
	SpinningWheel.selectedValues.keys = [programId];
	SpinningWheel.selectedValues.values = [programName];
	this.seriesController.setProgramId();
	equals(this.seriesController.listItem.series.programId, programId, "listItem.series.nowShowing property");
	equals(this.moveTo.val(), programName, "Move to");
});