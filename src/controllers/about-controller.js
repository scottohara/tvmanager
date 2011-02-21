var AboutController = function () {

};

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
	Episode.totalCount($.proxy(this.episodeCount, this));

	$("#databaseVersion").val("v" + appController.db.version);
	$("#appVersion").val("v" + appController.appVersion);
	$("#update").bind('click', $.proxy(this.checkForUpdate, this));

	appController.refreshScroller();
};

AboutController.prototype.goBack = function() {
	appController.popView();
};

AboutController.prototype.programCount = function(count) {
	$("#totalPrograms").val(count);
};

AboutController.prototype.seriesCount = function(count) {
	$("#totalSeries").val(count);
};

AboutController.prototype.episodeCount = function(count) {
	this.episodeTotalCount = count;
	Episode.countByStatus("Watched", $.proxy(this.watchedCount, this));
};

AboutController.prototype.watchedCount = function(count) {
	var watchedPercent = Math.round(count / this.episodeTotalCount * 100, 2);
	$("#totalEpisodes").val(this.episodeTotalCount + " (" + watchedPercent + "% watched)");
};

AboutController.prototype.checkForUpdate = function() {
	if (!this.updating) {
		this.updating = true;
		appController.cache.update(this.updateChecked);
		this.updating = false;
	}
};

AboutController.prototype.updateChecked = function(updated, message) {
	appController.showNotice({
		label: message,
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	});
};