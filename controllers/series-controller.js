function SeriesController(listItem) {
	if (listItem.listIndex >= 0) {
		this.listItem = listItem;
		this.originalNowShowing = this.listItem.series.nowShowing;
		this.originalProgramId = this.listItem.series.programId;
	} else {
		this.listItem = { series: new Series(null, "", "", listItem.program.id, listItem.program.programName, 0, 0, 0, 0) };
	}
}

SeriesController.prototype.setup = function() {
	this.header = {
		label: "Add/Edit Series",
		leftButton: {
			eventHandler: this.cancel.bind(this),
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: this.save.bind(this),
			style: "blueButton",
			label: "Save"
		}
	};

	$("seriesName").value = this.listItem.series.seriesName;
	$("nowShowing").value = this.listItem.series.nowShowingDisplay;
	$("nowShowing").addEventListener('click', this.getNowShowing.bind(this));
	$("moveTo").addEventListener('click', this.getProgramId.bind(this));

	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

SeriesController.prototype.save = function() {
	this.listItem.series.seriesName = $("seriesName").value;
	this.listItem.series.save();
	if (!(this.listItem.listIndex >= 0)) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}
	appController.popView(this.listItem);
}

SeriesController.prototype.cancel = function() {
	this.listItem.series.setNowShowing(this.originalNowShowing);
	this.listItem.series.programId = (this.originalProgramId);
	appController.popView();
}

SeriesController.prototype.getNowShowing = function() {
	if (!this.gettingNowShowing) {
		this.gettingNowShowing = true;

		var nowShowing = this.listItem.series.nowShowing;
		if (!nowShowing) {
			nowShowing = 0;
		}

		SpinningWheel.addSlot(Series.NOW_SHOWING, "left", nowShowing);
		SpinningWheel.setDoneAction(this.setNowShowing.bind(this));
		SpinningWheel.open();

		this.gettingNowShowing = false;
	}
}

SeriesController.prototype.setNowShowing = function() {
	this.listItem.series.setNowShowing(SpinningWheel.getSelectedValues().keys[0]);
	$("nowShowing").value = this.listItem.series.nowShowingDisplay;
}

SeriesController.prototype.getProgramId = function() {
	if (!this.gettingProgramId) {
		this.gettingProgramId = true;
		Program.list(this.listRetrieved.bind(this));
	}
}

SeriesController.prototype.listRetrieved = function(programList) {
	var programs = {};
	for (var i = 0; i < programList.length; i++) {
		programs[programList[i].id] = programList[i].programName;
	}

	SpinningWheel.addSlot(programs, "left", this.listItem.series.programId);
	SpinningWheel.setDoneAction(this.setProgramId.bind(this));
	SpinningWheel.open();
	this.gettingProgramId = false;
}

SeriesController.prototype.setProgramId = function() {
	this.listItem.series.programId = Number(SpinningWheel.getSelectedValues().keys[0]);
	$("moveTo").value = SpinningWheel.getSelectedValues().values[0];
}