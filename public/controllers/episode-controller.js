var EpisodeController = function (listItem) {
	if (listItem.listIndex >= 0) {
		this.listItem = listItem;
		this.originalStatus = this.listItem.episode.status;
		this.originalStatusDate = this.listItem.episode.statusDate;
	} else {
		this.listItem = { episode: new Episode(null, "", "", "", false, false, listItem.sequence, listItem.series.id) };
	}
};

EpisodeController.prototype.setup = function() {
	this.header = {
		label: "Add/Edit Episode",
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
    
	$("#episodeName").val(this.listItem.episode.episodeName);
	$("#unverified").prop('checked', this.listItem.episode.unverified);
	$("#unscheduled").prop('checked', this.listItem.episode.unscheduled);

	$("#watched").bind('click', $.proxy(function() { this.setStatus("Watched"); }, this));
	$("#recorded").bind('click', $.proxy(function() { this.setStatus("Recorded"); }, this));
	$("#expected").bind('click', $.proxy(function() { this.setStatus("Expected"); }, this));
	$("#missed").bind('click', $.proxy(function() { this.setStatus("Missed"); }, this));
	$("#statusDate").bind('click', $.proxy(this.getStatusDate, this));
	$("#unscheduled").bind('click', $.proxy(this.toggleStatusDateRow, this));

	var status = this.listItem.episode.status;
	this.listItem.episode.setStatus("");
	this.setStatus(status);

	$("#statusDate").val(this.listItem.episode.statusDate);
};

EpisodeController.prototype.save = function() {
	this.listItem.episode.episodeName = $("#episodeName").val();
	this.listItem.episode.setUnverified($("#unverified").is(':checked'));
	this.listItem.episode.unscheduled = $("#unscheduled").is(':checked');
	this.listItem.episode.save();
	if (isNaN(this.listItem.listIndex) || this.listItem.listIndex < 0) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}
	appController.popView(this.listItem);
};

EpisodeController.prototype.cancel = function() {
	this.listItem.episode.status = this.originalStatus;
	this.listItem.episode.statusDate = this.originalStatusDate;
	appController.popView();
};

EpisodeController.prototype.setStatus = function(status) {
	if (!this.settingStatus) {
		this.settingStatus = true;

		$("#watched").removeClass();
		$("#recorded").removeClass();
		$("#expected").removeClass();
		$("#missed").removeClass();
		$("#unverifiedRow").hide();

		if (this.listItem.episode.status === status) {
			this.listItem.episode.setStatus("");
		} else {
			this.listItem.episode.setStatus(status);
			switch (status) {
				case "Watched":
					$("#watched").addClass("status");
					break;

				case "Recorded":
					$("#recorded").addClass("status");
					$("#unverifiedRow").show();
					break;

				case "Expected":
					$("#expected").addClass("status");
					$("#unverifiedRow").show();
					break;

				case "Missed":
					$("#missed").addClass("status");
					$("#unverifiedRow").show();
					break;
			}
		}
		
		this.toggleStatusDateRow();
		this.settingStatus = false;
	}
};

EpisodeController.prototype.getStatusDate = function() {
	var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };
	var parts = this.listItem.episode.statusDate.split('-');
	if (parts.length < 2) {
		var today = new Date();
		parts[0] = today.getDate();
		parts[1] = months[today.getMonth()];
	} else {
		parts[0] = Number(parts[0]);
	}

	SpinningWheel.addSlot({1: "01", 2: "02", 3: "03", 4: "04", 5: "05", 6: "06", 7: "07", 8: "08", 9: "09", 10: "10", 11: "11", 12: "12",
		13: "13", 14: "14", 15: "15", 16: "16", 17: "17", 18: "18", 19: "19", 20: "20", 21: "21", 22: "22", 23: "23", 24: "24", 25: "25",
		26: "26", 27: "27", 28: "28", 29: "29", 30: "30", 31: "31" }, "right", parts[0]);
	SpinningWheel.addSlot({"Jan": "Jan", "Feb": "Feb", "Mar": "Mar", "Apr": "Apr", "May": "May", "Jun": "Jun", "Jul": "Jul", "Aug": "Aug", "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dec": "Dec" }, null, parts[1]);
	SpinningWheel.setDoneAction($.proxy(this.setStatusDate, this));
	SpinningWheel.open();
	this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));
};

EpisodeController.prototype.setStatusDate = function() {
	this.listItem.episode.setStatusDate(SpinningWheel.getSelectedValues().values.join('-'));
	$("#statusDate").val(this.listItem.episode.statusDate);
	this.swtoucheventproxy = null;
};

EpisodeController.prototype.toggleStatusDateRow = function() {
	$("#statusDateRow").hide();

	if ($("#unscheduled").is(':checked') || "Recorded" === this.listItem.episode.status || "Expected" === this.listItem.episode.status || "Missed" === this.listItem.episode.status) {
		$("#statusDateRow").show();
		if ("" === this.listItem.episode.statusDate) {
			this.getStatusDate();
		}
	}
};
