module("settings-controller", {
	setup: function() {
		this.settingsController = new SettingsController();
	}
});

test("constructor", 1, function() {
	ok(this.settingsController, "Instantiate SettingsController object");
});

test("setup", 12, function() {
	var dataSyncRow = $("<div>")
		.attr("id", "dataSyncRow")
		.hide()
		.appendTo(document.body);

	var aboutRow = $("<div>")
		.attr("id", "aboutRow")
		.hide()
		.appendTo(document.body);

	var recordedReportRow = $("<div>")
		.attr("id", "recordedReportRow")
		.hide()
		.appendTo(document.body);

	var expectedReportRow = $("<div>")
		.attr("id", "expectedReportRow")
		.hide()
		.appendTo(document.body);

	var missedReportRow = $("<div>")
		.attr("id", "missedReportRow")
		.hide()
		.appendTo(document.body);

	var incompleteReportRow = $("<div>")
		.attr("id", "incompleteReportRow")
		.hide()
		.appendTo(document.body);

	this.settingsController.goBack = function() {
		ok(true, "Bind back button event listener");
	};

	this.settingsController.setup();
	dataSyncRow.trigger("click");
	aboutRow.trigger("click");
	recordedReportRow.trigger("click");
	same(appController.viewArgs, { reportName: "All Recorded", dataSource: Series.listByStatus, args: 'Recorded' }, "View arguments");
	expectedReportRow.trigger("click");
	same(appController.viewArgs, { reportName: "All Expected", dataSource: Series.listByStatus, args: 'Expected' }, "View arguments");
	missedReportRow.trigger("click");
	same(appController.viewArgs, { reportName: "All Missed", dataSource: Series.listByStatus, args: 'Missed' }, "View arguments");
	incompleteReportRow.trigger("click");
	same(appController.viewArgs, { reportName: "All Incomplete", dataSource: Series.listByIncomplete, args: null }, "View arguments");
	this.settingsController.header.leftButton.eventHandler();

	dataSyncRow.remove();
	aboutRow.remove();
	recordedReportRow.remove();
	expectedReportRow.remove();
	missedReportRow.remove();
	incompleteReportRow.remove();
});

test("goBack", 1, function() {
	this.settingsController.goBack();
});