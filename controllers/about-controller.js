function AboutController() {

}

AboutController.prototype.setup = function() {
	this.header = {
		label: "About",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Settings"
		}
	};

	Program.count(this.programCount);
	Series.count(this.seriesCount);
	Episode.count(this.episodeCount);

	$("#databaseVersion").val("v" + appController.db.version);
	$("#appVersion").val("");
	$("#update").bind('click', $.proxy(this.checkForUpdate, this));


	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

AboutController.prototype.goBack = function() {
	appController.popView();
}

AboutController.prototype.programCount = function(count) {
	$("#totalPrograms").val(count);
}

AboutController.prototype.seriesCount = function(count) {
	$("#totalSeries").val(count);
}

AboutController.prototype.episodeCount = function(count) {
	$("#totalEpisodes").val(count);
}

AboutController.prototype.checkForUpdate = function() {
	if (!this.updating) {
		this.updating = true;
		appController.cache.update(this.updateChecked);
		this.updating = false;
	}
}

AboutController.prototype.updateChecked = function(updated, message) {
	appController.showNotice({
		label: message,
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	});
}