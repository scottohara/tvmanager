module("report-controller", {
	setup: function() {
		this.args = "test-args";

		this.items = [
			"test-item-1",
			"test-item-2"
		];

		this.report = {
			reportName: "test-report",
			dataSource: $.proxy(function(callback, args) {
				equals(args, this.args, "data source arguments");
				callback(this.items);
			}, this),
			args: this.args
		};

		this.reportController = new ReportController(this.report);
	}
});

test("constructor", 2, function() {
	ok(this.reportController, "Instantiate ReportController object");
	same(this.reportController.report, this.report, "report property");
});

test("setup", 6, function() {
	var originalList = List;
	List = ListMock;

	this.reportController.viewItem = function() {
		ok(true, "Bind list view event handler");
	};
	this.reportController.goBack = function() {
		ok(true, "Bind back button event listener");
	};

	this.reportController.setup();
	equals(this.reportController.header.label, this.report.reportName, "Header label");
	this.reportController.header.leftButton.eventHandler();
	same(this.reportController.reportList.items, this.items, "List items");
	equals(this.reportController.reportList.action, "view", "List action");
	List = originalList;
});

test("goBack", 1, function() {
	this.reportController.goBack();
});

test("viewItem", 2, function() {
	var index = 1;
	this.reportController.reportList = { items: this.items };
	this.reportController.viewItem(index);
	same(appController.viewArgs, { source: "Report", listIndex: index, series: this.items[index] }, "View arguments");
});