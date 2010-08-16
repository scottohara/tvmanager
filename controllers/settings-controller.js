function SettingsController() {

}

SettingsController.prototype.setup = function() {
	this.header = {
		label: "Settings",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Schedule"
		}
	};

	this.activate();
}

SettingsController.prototype.activate = function() {
	$("#dataSyncRow").bind('click', this.viewDataSync);
	$("#aboutRow").bind('click', this.viewAbout);
	$("#recordedReportRow").bind('click', this.viewRecordedReport);
	$("#expectedReportRow").bind('click', this.viewExpectedReport);
	$("#missedReportRow").bind('click', this.viewMissedReport);
	$("#incompleteReportRow").bind('click', this.viewIncompleteReport);

	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

SettingsController.prototype.goBack = function() {
	appController.popView();
}

SettingsController.prototype.viewDataSync = function() {
	appController.pushView("dataSync");
}

SettingsController.prototype.viewAbout = function() {
	appController.pushView("about");
}

SettingsController.prototype.viewRecordedReport = function() {
	appController.pushView("report", { reportName: "All Recorded", dataSource: Series.listByStatus, args: 'Recorded' });
}

SettingsController.prototype.viewExpectedReport = function() {
	appController.pushView("report", { reportName: "All Expected", dataSource: Series.listByStatus, args: 'Expected' });
}

SettingsController.prototype.viewMissedReport = function() {
	appController.pushView("report", { reportName: "All Missed", dataSource: Series.listByStatus, args: 'Missed' });
}

SettingsController.prototype.viewIncompleteReport = function() {
	appController.pushView("report", { reportName: "All Incomplete", dataSource: Series.listByIncomplete, args: null });
}