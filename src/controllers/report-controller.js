function ReportController(report) {
	this.report = report;
}

ReportController.prototype.setup = function() {
	this.header = {
		label: this.report.reportName,
		leftButton: {
			eventHandler: function() {appController.popView();},
			style: "backButton",
			label: "Settings"
		}
	};

	this.reportList = new List("list", "views/reportListTemplate.html", null, [], $.proxy(this.viewItem, this));
	this.activate();
}

ReportController.prototype.activate = function() {
	this.report.dataSource($.proxy(this.listRetrieved, this), this.report.args);
}

ReportController.prototype.listRetrieved = function(reportList) {
	this.reportList.items = reportList;
	this.reportList.refresh();
  this.viewItems();
}

ReportController.prototype.viewItem = function(itemIndex) {
	appController.pushView("episodes", { source: "Report", listIndex: itemIndex, series: this.reportList.items[itemIndex] });
}

ReportController.prototype.viewItems = function() {
	appController.clearFooter();
	this.reportList.setAction("view");
	$("#list").removeClass();
	this.footer = {
		label: "v" + appController.db.version
	};

	appController.setFooter();
}