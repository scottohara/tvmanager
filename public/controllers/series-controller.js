var SeriesController = function (listItem) {
	if (listItem.listIndex >= 0) {
		this.listItem = listItem;
		this.originalNowShowing = this.listItem.series.nowShowing;
		this.originalProgramId = this.listItem.series.programId;
	} else {
		this.listItem = { series: new Series(null, "", "", listItem.program.id, listItem.program.programName, 0, 0, 0, 0, 0, 0) };
	}
};

SeriesController.prototype.setup = function() {
	this.header = {
		label: "Add/Edit Series",
		leftButton: {
			eventHandler: $.proxy(this.cancel, this),
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: $.proxy(this.save, this),
			style: "blueButton",
			label: "Save"
		}
	};

	$("#seriesName").val(this.listItem.series.seriesName);
	$("#nowShowing").val(this.listItem.series.nowShowingDisplay);
	$("#nowShowing").bind('click', $.proxy(this.getNowShowing, this));
	$("#moveTo").bind('click', $.proxy(this.getProgramId, this));
};

SeriesController.prototype.save = function() {
	this.listItem.series.seriesName = $("#seriesName").val();
	this.listItem.series.save();
	if (isNaN(this.listItem.listIndex) || this.listItem.listIndex < 0) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}
	appController.popView(this.listItem);
};

SeriesController.prototype.cancel = function() {
	this.listItem.series.setNowShowing(this.originalNowShowing);
	this.listItem.series.programId = (this.originalProgramId);
	appController.popView();
};

SeriesController.prototype.getNowShowing = function() {
	if (!this.gettingNowShowing) {
		this.gettingNowShowing = true;

		var nowShowing = this.listItem.series.nowShowing;
		if (!nowShowing) {
			nowShowing = 0;
		}

		SpinningWheel.addSlot(Series.NOW_SHOWING, "left", nowShowing);
		SpinningWheel.setDoneAction($.proxy(this.setNowShowing, this));
		SpinningWheel.open();
		this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));
		this.gettingNowShowing = false;
	}
};

SeriesController.prototype.setNowShowing = function() {
	this.listItem.series.setNowShowing(SpinningWheel.getSelectedValues().keys[0]);
	$("#nowShowing").val(this.listItem.series.nowShowingDisplay);
	this.swtoucheventproxy = null;
};

SeriesController.prototype.getProgramId = function() {
	if (!this.gettingProgramId) {
		this.gettingProgramId = true;
		Program.list($.proxy(this.listRetrieved, this));
	}
};

SeriesController.prototype.listRetrieved = function(programList) {
	var programs = {};
	for (var i = 0; i < programList.length; i++) {
		programs[programList[i].id] = programList[i].programName;
	}

	SpinningWheel.addSlot(programs, "left", this.listItem.series.programId);
	SpinningWheel.setDoneAction($.proxy(this.setProgramId, this));
	SpinningWheel.open();
	this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));
	this.gettingProgramId = false;
};

SeriesController.prototype.setProgramId = function() {
	this.listItem.series.programId = SpinningWheel.getSelectedValues().keys[0];
	$("#moveTo").val(SpinningWheel.getSelectedValues().values[0]);
	this.swtoucheventproxy = null;
};
