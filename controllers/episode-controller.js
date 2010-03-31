function EpisodeController(listItem) {
	if (listItem.listIndex >= 0) {
		this.listItem = listItem;
		this.originalStatus = this.listItem.episode.status;
		this.originalStatusDate = this.listItem.episode.statusDate;
	} else {
		this.listItem = { episode: new Episode(null, "", "", "", false, false, listItem.series.id) };
	}
}

EpisodeController.prototype.setup = function() {
	this.header = {
		label: "Add/Edit Episode",
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
    
	$("episodeName").value = this.listItem.episode.episodeName;
	$("unverified").checked = this.listItem.episode.unverified;
	$("unscheduled").checked = this.listItem.episode.unscheduled;

	$("watched").addEventListener('click', function() { this.setStatus("Watched") }.bind(this));
	$("recorded").addEventListener('click', function() { this.setStatus("Recorded") }.bind(this));
	$("expected").addEventListener('click', function() { this.setStatus("Expected") }.bind(this));
	$("missed").addEventListener('click', function() { this.setStatus("Missed") }.bind(this));
	$("statusDate").addEventListener('click', this.getStatusDate.bind(this));
	$("unscheduled").addEventListener('click', this.toggleStatusDateRow.bind(this));

	var status = this.listItem.episode.status;
	this.listItem.episode.setStatus("");
	this.setStatus(status);

	$("statusDate").value = this.listItem.episode.statusDate;

	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

EpisodeController.prototype.save = function() {
	this.listItem.episode.episodeName = $("episodeName").value;
	this.listItem.episode.setUnverified($("unverified").checked);
	this.listItem.episode.unscheduled = $("unscheduled").checked;
	this.listItem.episode.save();
	if (!(this.listItem.listIndex >= 0)) {
		appController.viewStack[appController.viewStack.length - 2].scrollPos = -1;
	}
	appController.popView(this.listItem);
}

EpisodeController.prototype.cancel = function() {
	this.listItem.episode.status = this.originalStatus;
	this.listItem.episode.statusDate = this.originalStatusDate;
	appController.popView();
}

EpisodeController.prototype.setStatus = function(status) {
	if (!this.settingStatus) {
		this.settingStatus = true;

		$("watched").className = "";
		$("recorded").className = "";
		$("expected").className = "";
		$("missed").className = "";
		$("unverifiedRow").style.display = "none";

		if (this.listItem.episode.status === status) {
			this.listItem.episode.setStatus("");
		} else {
			this.listItem.episode.setStatus(status);
			switch (status) {
				case "Watched":
					$("watched").className = "status";
					break;

				case "Recorded":
					$("recorded").className = "status";
					$("unverifiedRow").style.display = "block";
					break;

				case "Expected":
					$("expected").className = "status";
					$("unverifiedRow").style.display = "block";
					break;

				case "Missed":
					$("missed").className = "status";
					$("unverifiedRow").style.display = "block";
					break;
			}
		}
		
		this.toggleStatusDateRow();
		this.settingStatus = false;
	}
}

EpisodeController.prototype.getStatusDate = function() {
	var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" }
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
	SpinningWheel.setDoneAction(this.setStatusDate.bind(this));
	SpinningWheel.open();
}

EpisodeController.prototype.setStatusDate = function() {
	this.listItem.episode.setStatusDate(SpinningWheel.getSelectedValues().values.join('-'));
	$("statusDate").value = this.listItem.episode.statusDate;
}

EpisodeController.prototype.toggleStatusDateRow = function() {
	$("statusDateRow").style.display = "none";

	if ($("unscheduled").checked || "Recorded" === this.listItem.episode.status || "Expected" === this.listItem.episode.status || "Watched" === this.listItem.episode.status) {
		$("statusDateRow").style.display = "block";
		if ("" === this.listItem.episode.statusDate) {
			this.getStatusDate();
		}
	}
}