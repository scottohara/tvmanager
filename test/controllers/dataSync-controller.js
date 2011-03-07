module("dataSync-controller", {
	setup: function() {
		this.lastSyncTime = $("<input>")
			.attr("id", "lastSyncTime")
			.hide()
			.appendTo(document.body);

		this.localChanges = $("<input>")
			.attr("id", "localChanges")
			.hide()
			.appendTo(document.body);

		this.statusRow = $("<div>")
			.attr("id", "statusRow")
			.css("visibility", "hidden")
			.appendTo(document.body);

		this.status = $("<input>")
			.attr("id", "status")
			.hide()
			.appendTo(this.statusRow);

		this.lastSyncHash = "";

		this.ajaxMock = $.proxy(function(options) {
			if (this.importData) {
				options.success.apply(options.context, [this.importData]);
			} else {
				options.error.apply(options.context, [{
					status: "404",
					statusText: "Not found"
				}, "Force failed"]);
			}
		}, this);

		this.originalSetting = Setting;
		Setting = SettingMock;

		this.originalProgramSave = Program.prototype.save;
		Program.prototype.save = ProgramMock.save;

		this.originalSeriesSave = Series.prototype.save;
		Series.prototype.save = SeriesMock.save;

		this.originalEpisodeSave = Episode.prototype.save;
		Episode.prototype.save = EpisodeMock.save;

		appController.db = new DatabaseMock();

		this.originalToJson = DataSyncController.prototype.toJson;
		DataSyncController.prototype.toJson = $.proxy(function(statusBarAction, callback) {
			this.dataSyncController.statusBarAction = statusBarAction;
			callback({json: {}, hash: this.lastSyncHash});
		}, this);

		this.dataSyncController = new DataSyncController();
	},
	teardown: function() {
		this.lastSyncTime.remove();
		this.localChanges.remove();
		this.status.remove();
		Setting = this.originalSetting;
		Program.prototype.save = this.originalProgramSave;
		Series.prototype.save = this.originalSeriesSave;
		Episode.prototype.save = this.originalEpisodeSave;
		DataSyncController.prototype.toJson = this.originalToJson;
		ProgramMock.programJson = [];
		SeriesMock.seriesJson = [];
		EpisodeMock.episodeJson = [];
	}
});

test("constructor", 1, function() {
	ok(this.dataSyncController, "Instantiate DataSyncController object");
});

test("setup", 8, function() {
	var importButton = $("<div>")
		.attr("id", "import")
		.hide()
		.appendTo(document.body);

	var exportButton = $("<div>")
		.attr("id", "export")
		.hide()
		.appendTo(document.body);

	Setting.setting.LastSyncTime = new Date(1900, 0, 1, 12, 0, 0);
	Setting.setting.LastSyncHash = this.lastSyncHash;

	this.dataSyncController.dataImport = function() {
		ok(true, "Bind import click event listener");
	};

	this.dataSyncController.dataExport = function() {
		ok(true, "Bind export click event listener");
	};
	this.dataSyncController.goBack = function() {
		ok(true, "Bind back button event listener");
	};

	this.dataSyncController.setup();
	equals(this.lastSyncTime.val(), "1-Jan-1900 12:00:00", "Last Sync");
	equals(this.dataSyncController.lastSyncHash.settingValue, this.lastSyncHash, "lastSyncHash property");
	ok(!this.dataSyncController.localChanges, "Detect no changes");
	equals(this.localChanges.val(), "No changes since last sync", "Changes");
	importButton.trigger("click");
	exportButton.trigger("click");
	this.dataSyncController.header.leftButton.eventHandler();

	importButton.remove();
	exportButton.remove();
});

test("goBack", 1, function() {
	this.dataSyncController.goBack();
});

test("gotLastSyncTime", 1, function() {
	this.dataSyncController.gotLastSyncTime({ settingValue: null });
	equals(this.lastSyncTime.val(), "Unknown", "Last Sync Time");
});

test("gotLastSyncHash", 1, function() {
	this.dataSyncController.gotLastSyncHash();
	equals(this.localChanges.val(), "Unknown", "Changes");
});

test("checkForLocalChanges - no data", 2, function() {
	this.dataSyncController.lastSyncHash = { settingValue: this.lastSyncHash };
	this.dataSyncController.checkForLocalChanges();
	ok(!this.dataSyncController.localChanges, "Detect no changes");
	equals(this.localChanges.val(), "No data", "Changes");
});

test("checkForLocalChanges - with data", 2, function() {
	this.dataSyncController.lastSyncHash = { settingValue: this.lastSyncHash };
	this.dataSyncController.checkForLocalChanges({ hash: "test" });
	ok(this.dataSyncController.localChanges, "Detect changes");
	equals(this.localChanges.val(), "Data changed since last sync", "Changes");
});

test("dataExport - exporting", 2, function() {
	this.dataSyncController.exporting = true;
	this.dataSyncController.dataExport();
	ok(this.dataSyncController.exporting, "Export blocked by semaphore");
	equals(this.status.val(), "An export is already running", "Status");
});

test("dataExport - not exporting", function() {
	var testParams = [
		{
			description: "abort",
			proceed: false,
			status: "Export aborted",
			notice: "Export failed."
		},
		{
			description: "export",
			proceed: true,
			status: "Starting export",
			notice: "Database has been successfully exported."
		}
	];

	expect(testParams.length * 5 + 2);

	var i;

	var originalConfirm = window.confirm;
	window.confirm = function(message) {
		equals(message, "Are you sure you want to export?", "confirm");
		return testParams[i].proceed;
	};

	this.dataSyncController.doExport = function() {
		equals(this.statusBarAction, "Exported", "Status bar action");
		ok(true, "Do export");
		this.callback(true);
	};

	for (i = 0; i < testParams.length; i++) {
		this.dataSyncController.dataExport();
		equals(this.status.val(), testParams[i].status, testParams[i].description + " - Status");
		equals($("#statusRow").is(":hidden"), testParams[i].proceed, testParams[i].description + " - Hide status row");
		same(appController.notice.pop(), {
			label: testParams[i].notice,
			leftButton: {
				style: "redButton",
				label: "OK"
			}
		}, "Update notice");
		ok(!this.dataSyncController.exporting, testParams[i].description + " - Reset semaphore");
	}

	window.confirm = originalConfirm;
});

test("dataImport - importing", 2, function() {
	this.dataSyncController.importing = true;
	this.dataSyncController.dataImport();
	ok(this.dataSyncController.importing, "Import blocked by semaphore");
	equals(this.status.val(), "An import is already running", "Status");
});

test("dataImport - not importing", function() {
	var testParams = [
		{
			description: "abort",
			proceed: false,
			status: "Import aborted",
			notice: "Import failed."
		},
		{
			description: "import",
			proceed: true,
			status: "Starting import",
			notice: "Database has been successfully imported."
		}
	];

	expect(testParams.length * 5 + 1);

	var i;

	var originalConfirm = window.confirm;
	window.confirm = function(message) {
		equals(message, "Warning: Local changes have been made. Are you sure you want to import?", "confirm");
		return testParams[i].proceed;
	};

	this.dataSyncController.localChanges = true;
	this.dataSyncController.doImport = function() {
		ok(true, "Do import");
		this.callback(true);
	};

	for (i = 0; i < testParams.length; i++) {
		this.dataSyncController.dataImport();
		equals(this.status.val(), testParams[i].status, testParams[i].description + " - Status");
		equals($("#statusRow").is(":hidden"), testParams[i].proceed, testParams[i].description + " - Hide status row");
		same(appController.notice.pop(), {
			label: testParams[i].notice,
			leftButton: {
				style: "redButton",
				label: "OK"
			}
		}, "Update notice");
		ok(!this.dataSyncController.importing, testParams[i].description + " - Reset semaphore");
	}

	window.confirm = originalConfirm;
});

asyncTest("toJson", function() {
	var statusBarAction = "Testing";
	var programs = [
		{
			name: "test-program-1"
		},
		{
			name: "test-program-2"
		}
	];

	var json = JSON.stringify({
		databaseVersion: appController.db.version,
		programs: programs
	});

	var testParams = [
		{
			description: "no programs",
			programs: [],
			status: "",
			result: undefined
		},
		{
			description: "with programs",
			programs: programs,
			status: "Calculating checksum",
			result: {
				json: json,
				hash: json
			}
		}
	];

	var originalProgram = Program;
	Program = ProgramMock;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return data;
	};

	this.dataSyncController.toJson = this.originalToJson;
	var that = this;
	var programsCompleted = 0;

	expect(testParams.length * 2);

	var exportData = function(index) {
		return function(data) {
			same(data, testParams[index].result, testParams[index].description + " - Export data");
			equals(that.status.val(), testParams[index].status, testParams[index].description + " - Status");
			programsCompleted++;
			if (programsCompleted === testParams.length) {
				Program = originalProgram;
				hex_md5 = originalMD5;
				start();
			}
		};
	};

	for (var i = 0; i < testParams.length; i++) {
		Program.programs = testParams[i].programs;
		this.dataSyncController.toJson(statusBarAction, exportData(i));
	}
});

test("verifyData - no programs", 2, function() {
	this.dataSyncController.callback = function(success) {
		ok(!success, "Invoke callback with false");
	};

	this.dataSyncController.verifyData();
	equals(this.status.val(), "Verify failed: No programs found", "Status");
});

test("verifyData - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Verify failed: Force failed, 404 (Not found)", "Status");
	}, this);

	this.dataSyncController.verifyData({ hash: "" });
	$.ajax = originalAjax;
});

asyncTest("verifyData - checksum mismatch", 2, function() {
	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Verify failed: Checksum mismatch", "Status");
		start();
	}, this);

	this.dataSyncController.verifyData({ hash: "" });
});

asyncTest("verifyData - success", 3, function() {
	var originalDate = Date;
	var fakeDate = new Date(1900, 0, 1, 12, 0, 0);
	Date = function() {
		return fakeDate;
	};

	this.dataSyncController.callback = $.proxy(function(success) {
		Date = originalDate;
		ok(success, "Invoke callback with true");
		equals(this.status.val(), "Verify complete", "Status");
		equals(this.lastSyncTime.val(), "1-Jan-1900 12:00:00", "Last Sync");
		start();
	}, this);

	this.dataSyncController.verifyData({ hash: "test-hash" });
});

asyncTest("verifyData - 304 Not Modified", 1, function() {
	$.ajax = jQueryMock.ajax;
	this.dataSyncController.callback = $.proxy(function(success) {
		ok(success, "Invoke callback with true");
		start();
	}, this);

	this.dataSyncController.verifyData({ hash: "test-hash" });
});

test("doExport - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Export failed: Force failed, 404 (Not found)", "Status");
	}, this);

	this.dataSyncController.doExport({ json: "test-data" });
	$.ajax = originalAjax;
});

asyncTest("doExport - success", 2, function() {
	var testData = { json: "test-data" };

	this.dataSyncController.verifyData = $.proxy(function(data) {
		equals(this.status.val(), "Sent data to server", "Status");
		same(data, testData, "Data");
		start();
	}, this);

	this.dataSyncController.doExport(testData);
});

test("doImport - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Import failed: Force failed, 404 (Not found)", "Status");
	}, this);

	this.dataSyncController.doImport();
	$.ajax = originalAjax;
});

test("doImport - incorrect version", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.importData = { "databaseVersion": "1.1" };

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Can't import v1.1 file into v1.0 database", "Status");
	}, this);

	this.dataSyncController.doImport();
	$.ajax = originalAjax;
});

test("doImport - no programs", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.importData = {
		"databaseVersion": "1.0",
		"programs": []
	};

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Import failed: No programs found", "Status");
	}, this);

	this.dataSyncController.doImport();
	$.ajax = originalAjax;
});

asyncTest("doImport - delete Episode fail", 4, function() {
	appController.db.failAt("DELETE FROM Episode");

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(appController.db.commands.length, 1, "Number of SQL commands");
		ok(!appController.db.commit, "Rollback transaction");
		equals(this.status.val(), "Import failed: Force failed", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});

asyncTest("doImport - delete Series fail", 4, function() {
	appController.db.failAt("DELETE FROM Series");

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(appController.db.commands.length, 2, "Number of SQL commands");
		ok(!appController.db.commit, "Rollback transaction");
		equals(this.status.val(), "Import failed: Force failed", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});

asyncTest("doImport - delete Program fail", 4, function() {
	appController.db.failAt("DELETE FROM Program");

	this.dataSyncController.callback = $.proxy(function(success) {
		ok(!success, "Invoke callback with false");
		equals(appController.db.commands.length, 3, "Number of SQL commands");
		ok(!appController.db.commit, "Rollback transaction");
		equals(this.status.val(), "Import failed: Force failed", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});

asyncTest("doImport - save Program fail", 2, function() {
	ProgramMock.saved = false;
	this.dataSyncController.callback = $.proxy(function(success) {
		ProgramMock.saved = true;
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Error saving program: test-program-1", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});

test("doImport - no series", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.importData = {
		"databaseVersion": "1.0",
		"programs": [
			{
				"programName": "test-program",
				"seriesList": []
			}
		]
	};

	this.dataSyncController.verifyData = $.proxy(function(data) {
		equals(this.status.val(), "Imported 1 of 1", "Status");
		equals(this.dataSyncController.statusBarAction, "Verifiying", "Status bar action");
	}, this);

	this.dataSyncController.doImport();
	$.ajax = originalAjax;
});

asyncTest("doImport - save Series fail", 2, function() {
	SeriesMock.saved = false;
	this.dataSyncController.callback = $.proxy(function(success) {
		SeriesMock.saved = true;
		ok(!success, "Invoke callback with false");
		equals(this.status.val(), "Error saving series: test-series-1", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});

asyncTest("doImport - success", 5, function() {
	this.dataSyncController.verifyData = $.proxy(function(data) {
		equals(this.status.val(), "Imported 2 of 2", "Status");
		equals(this.dataSyncController.statusBarAction, "Verifiying", "Status bar action");
		same(ProgramMock.programJson, [
			{
				"programName": "test-program-1",
				"seriesList": []
			},
			{
				"programName": "test-program-2",
				"seriesList": []
			}
		], "Programs");
		same(SeriesMock.seriesJson, [
			{
				"seriesName": "test-series-1",
				"nowShowing": null,
				"episodes": []
			},
			{
				"seriesName": "test-series-2",
				"nowShowing": "1",
				"episodes": []
			},
			{
				"seriesName": "test-series-3",
				"nowShowing": "2",
				"episodes": []
			},
			{
				"seriesName": "test-series-4",
				"nowShowing": "3",
				"episodes": []
			}
		], "Series");
		same(EpisodeMock.episodeJson, [
			{
				"episodeName": "test-episode-1",
				"status": "Watched",
				"statusDate": "",
				"unverified": "",
				"unscheduled": "",
				"sequence": 1
			},
			{
				"episodeName": "test-episode-2",
				"status": "Recorded",
				"statusDate": "01-Jan",
				"unverified": "true",
				"unscheduled": "",
				"sequence": 2
			},
			{
				"episodeName": "test-episode-3",
				"status": "Expected",
				"statusDate": "02-Jan",
				"unverified": "true",
				"unscheduled": "true",
				"sequence": 1
			},
			{
				"episodeName": "test-episode-4",
				"status": "Missed",
				"statusDate": "03-Jan",
				"unverified": "",
				"unscheduled": "",
				"sequence": 2
			},
			{
				"episodeName": "test-episode-5",
				"status": "Watched",
				"statusDate": "",
				"unverified": "",
				"unscheduled": "",
				"sequence": 1
			},
			{
				"episodeName": "test-episode-6",
				"status": "Recorded",
				"statusDate": "01-Jan",
				"unverified": "true",
				"unscheduled": "",
				"sequence": 2
			},
			{
				"episodeName": "test-episode-7",
				"status": "Expected",
				"statusDate": "02-Jan",
				"unverified": "true",
				"unscheduled": "true",
				"sequence": 1
			},
			{
				"episodeName": "test-episode-8",
				"status": "Missed",
				"statusDate": "03-Jan",
				"unverified": "",
				"unscheduled": "",
				"sequence": 2
			}
		], "Episodes");
		start();
	}, this);

	this.dataSyncController.doImport();
});

asyncTest("doImport - 304 Not Modified", 1, function() {
	$.ajax = jQueryMock.ajax;

	this.dataSyncController.verifyData = $.proxy(function(data) {
		equals(this.status.val(), "Imported 2 of 2", "Status");
		start();
	}, this);

	this.dataSyncController.doImport();
});