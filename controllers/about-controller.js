function AboutController() {

}

AboutController.prototype.setup = function() {
	this.header = {
		label: "About",
		leftButton: {
			eventHandler: this.goBack.bind(this),
			style: "backButton",
			label: "Settings"
		}
	};

	Program.count(this.programCount.bind(this));
	Series.count(this.seriesCount.bind(this));
	Episode.count(this.episodeCount.bind(this));

	$("databaseVersion").value = "v" + db.version;
	$("appVersion").value = "";
	$("update").addEventListener('click', this.checkForUpdate.bind(this));


	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

AboutController.prototype.goBack = function() {
	appController.popView();
}

AboutController.prototype.programCount = function(count) {
	$("totalPrograms").value = count;
}

AboutController.prototype.seriesCount = function(count) {
	$("totalSeries").value = count;
}

AboutController.prototype.episodeCount = function(count) {
	$("totalEpisodes").value = count;
}

AboutController.prototype.checkForUpdate = function() {
	if (!this.updating) {
		this.updating = true;
		appController.cache.update(this.updateChecked.bind(this));
		this.updating = false;
	}
}

AboutController.prototype.updateChecked = function(updated, message) {
	appController.showNotice({
		label: message,
		leftButton: {
			eventHandler: appController.hideNotice.bind(this),
			style: "redButton",
			label: "OK"
		}
	});
}