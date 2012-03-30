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

		this.syncErrors = $("<div>")
			.attr("id", "syncErrors")
			.css("visibility", "hidden")
			.appendTo(document.body);

		this.errorList = $("<ul>")
			.attr("id", "errorList")
			.appendTo(this.syncErrors);

		this.syncList = [
			{
				type: "Program",
				id: "1",
				action: "modified"
			},
			{
				type: "Series",
				id: "2",
				action: "deleted"
			},
			{
				type: "Episode",
				id: "3",
				action: "modified"
			}
		];

		this.ajaxMock = $.proxy(function(options) {
			options.error.apply(options.context, [{
				status: "404",
				statusText: "Not found"
			}, "Force failed"]);
				
			if (options.complete) {
				options.complete();
			}
		}, this);

		this.originalSetting = Setting;
		Setting = SettingMock;

		this.originalSync = Sync;
		Sync = SyncMock;

		this.originalProgramSave = Program.prototype.save;
		Program.prototype.save = ProgramMock.save;

		this.originalProgramFind = Program.find;
		Program.find = ProgramMock.find;

		this.originalProgramRemoveAll = Program.removeAll;
		Program.removeAll = ProgramMock.removeAll;

		this.originalSeriesSave = Series.prototype.save;
		Series.prototype.save = SeriesMock.save;

		this.originalSeriesRemoveAll = Series.removeAll;
		Series.removeAll = SeriesMock.removeAll;

		this.originalSeriesFind = Series.find;
		Series.find = SeriesMock.find;

		this.originalEpisodeSave = Episode.prototype.save;
		Episode.prototype.save = EpisodeMock.save;

		this.originalEpisodeRemoveAll = Episode.removeAll;
		Episode.removeAll = EpisodeMock.removeAll;

		this.originalSyncError = DataSyncController.prototype.syncError;
		DataSyncController.prototype.syncError = function(error, type, message, id) {
			this.syncErrors.push({
				error: error,
				type: type,
				message: message,
				id: id
			});
		};

		appController.db = new DatabaseMock();

		this.dataSyncController = new DataSyncController();
	},
	teardown: function() {
		this.lastSyncTime.remove();
		this.localChanges.remove();
		this.statusRow.remove();
		this.status.remove();
		this.syncErrors.remove();
		this.errorList.remove();
		Setting = this.originalSetting;
		Sync = this.originalSync;
		Program.prototype.save = this.originalProgramSave;
		Program.find = this.originalProgramFind;
		Program.removeAll = this.originalProgramRemoveAll;
		Series.prototype.save = this.originalSeriesSave;
		Series.find = this.originalSeriesFind;
		Series.removeAll = this.originalSeriesRemoveAll;
		Episode.prototype.save = this.originalEpisodeSave;
		Episode.removeAll = this.originalEpisodeRemoveAll;
		ProgramMock.programJson = [];
		SeriesMock.seriesJson = [];
		EpisodeMock.episodeJson = [];
		DataSyncController.prototype.syncError = this.originalSyncError;
	}
});

test("constructor", 1, function() {
	ok(this.dataSyncController, "Instantiate DataSyncController object");
});

test("setup", 6, function() {
	var importButton = $("<div>")
		.attr("id", "import")
		.hide()
		.appendTo(document.body);

	var exportButton = $("<div>")
		.attr("id", "export")
		.hide()
		.appendTo(document.body);

	Setting.setting.LastSyncTime = new Date(1900, 0, 1, 12, 0, 0);

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
	equals(this.lastSyncTime.val(), "1-Jan-1900 12:00:00", "Last Sync Time");
	ok(!this.dataSyncController.localChanges, "Detect no changes");
	equals(this.localChanges.val(), "No changes to be synced", "Changes");
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

test("checkForLocalChanges - single change", 2, function() {
	var count = 1;
	this.dataSyncController.checkForLocalChanges(count);
	ok(this.dataSyncController.localChanges, "Detect changes");
	equals(this.localChanges.val(), count + " change to be synced", "Changes");
});

test("checkForLocalChanges - multiple change", 2, function() {
	var count = 2;
	this.dataSyncController.checkForLocalChanges(count);
	ok(this.dataSyncController.localChanges, "Detect changes");
	equals(this.localChanges.val(), count + " changes to be synced", "Changes");
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

	this.dataSyncController.listRetrieved = $.proxy(function(syncList) {
		equals(syncList, this.syncList, "Sync list");
		ok(true, "List retrieved");
		this.dataSyncController.callback(true);
	}, this);

	SyncMock.syncList = this.syncList;

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

test("listRetrieved", 6, function() {
	this.dataSyncController.sendChange = $.proxy(function(sync) {
		equals(sync, this.syncList[0], "Sync - modified");
		ok(true, "Send change");
	}, this);

	this.dataSyncController.sendDelete = $.proxy(function(sync) {
		equals(sync, this.syncList[1], "Sync - deleted");
		ok(true, "Send delete");
	}, this);

	this.dataSyncController.listRetrieved(this.syncList.slice(0,2));
	equals(this.dataSyncController.syncProcessed, 0, "syncProcessed property");
	same(this.dataSyncController.syncErrors, [], "syncErrors property");
});

test("getResourceName", function() {
	var testParams = [
		{
			description: "program",
			type: "Program",
			resource: "programs"
		},
		{
			description: "series",
			type: "Series",
			resource: "series"
		}
	];

	expect(testParams.length);

	for (var i = 0; i < testParams.length; i++) {
		equals(this.dataSyncController.getResourceName(testParams[i].type), testParams[i].resource, testParams[i].description + " - resource");
	}
});

asyncTest("sendChange - checksum mismatch", 2, function() {
	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "\"";
	};

	this.dataSyncController.syncErrors = [];
	this.dataSyncController.changeSent = $.proxy(function() {
		equals(this.dataSyncController.syncErrors[0].error, "Checksum mismatch", "Sync error");
		ok(true, "Change sent");
		hex_md5 = originalMD5;
		start();
	}, this);

	this.dataSyncController.sendChange(this.syncList[0]);
});

asyncTest("sendChange - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.syncErrors = [];
	this.dataSyncController.changeSent = $.proxy(function() {
		equals(this.dataSyncController.syncErrors[0].error, "Send error", "Sync error");
		ok(true, "Change sent");
		start();
	}, this);

	this.dataSyncController.sendChange(this.syncList[0]);
	$.ajax = originalAjax;
});

asyncTest("sendChange - success", 2, function() {
	this.syncList[0].remove = function() {
		ok(true, "Sync removed");
	};

	this.dataSyncController.changeSent = function() {
		ok(true, "Change sent");
		start();
	};

	this.dataSyncController.sendChange(this.syncList[0]);
});

asyncTest("sendDelete - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.syncErrors = [];
	this.dataSyncController.changeSent = $.proxy(function() {
		equals(this.dataSyncController.syncErrors[0].error, "Delete error", "Sync error");
		ok(true, "Change sent");
		start();
	}, this);

	this.dataSyncController.sendDelete(this.syncList[0]);
	$.ajax = originalAjax;
});

asyncTest("sendDelete - success", 2, function() {
	this.syncList[0].remove = function() {
		ok(true, "Sync removed");
	};

	this.dataSyncController.changeSent = function() {
		ok(true, "Change sent");
		start();
	};

	this.dataSyncController.sendDelete(this.syncList[0]);
});

test("changeSent - not finished", 1, function() {
	this.dataSyncController.syncProcessed = 0;
	this.dataSyncController.syncList = this.syncList;
	this.dataSyncController.changeSent();
	equals(this.status.val(), "Exported 1 of " + this.syncList.length + " changes", "Status");
});

test("changeSent - finished with errors", 4, function() {
	this.dataSyncController.syncProcessed = 0;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.syncList = this.syncList;
	this.dataSyncController.syncProcessed = this.syncList.length - 1;
	DataSyncController.prototype.syncError = this.originalSyncError;

	this.dataSyncController.callback = function(success) {
		ok(!success, "Invoke callback with false");
	};

	this.dataSyncController.syncError("Force failed");
	this.dataSyncController.changeSent();
	equals(this.status.val(), "Exported " + this.syncList.length + " of " + this.syncList.length + " changes", "Status");
	ok(!$("#errorList").is(":empty"), "Display error list");
	ok(!$("#syncErrors").is(":hidden"), "Show sync errors");
});

test("changeSent - finished without errors", 4, function() {
	this.dataSyncController.syncProcessed = 0;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.syncList = this.syncList;
	this.dataSyncController.syncProcessed = this.syncList.length - 1;

	this.dataSyncController.callback = function(success) {
		ok(success, "Invoke callback with true");
	};

	this.dataSyncController.changeSent();
	equals(this.status.val(), "Exported " + this.syncList.length + " of " + this.syncList.length + " changes", "Status");
	ok($("#errorList").is(":empty"), "Empty error list");
	ok($("#syncErrors").is(":hidden"), "Hide sync errors");
});

test("setLastSyncTime", 1, function() {
	var originalDate = Date;
	var fakeDate = new Date(1900, 0, 1, 12, 0, 0);
	Date = function() {
		return fakeDate;
	};

	this.dataSyncController.setLastSyncTime();
	equals(this.lastSyncTime.val(), "1-Jan-1900 12:00:00", "Last Sync Time");
	Date = originalDate;
});

test("doImport - delete Sync fail", 5, function() {
	SyncMock.removed = false;
	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;

	this.dataSyncController.callback = function(success) {
		ok(!success, "Invoke callback with false");
	};

	this.dataSyncController.doImport();
	equals(this.dataSyncController.syncErrors.length, 1, "Number of errors");
	same(this.dataSyncController.syncErrors[0].html(), "Delete error<br>Type: Sync<br>Force failed", "syncErrors property");
	ok(!$("#errorList").is(":empty"), "Display error list");
	ok(!$("#syncErrors").is(":hidden"), "Show sync errors");
});

test("doImport - success", 5, function() {
	var objectsReceived = [];
	SyncMock.removed = true;
	
	this.dataSyncController.receiveObjects = function(type) {
		objectsReceived.push(type);
	};

	this.dataSyncController.doImport();
	same(this.dataSyncController.objectsToImport, {Program: 0, Series: 0, Episode: 0}, "objectsToImport property");
	same(this.dataSyncController.objectsImported, {Program: -1, Series: -1, Episode: -1}, "objectsImported property");
	equals(this.dataSyncController.syncProcessed, 0, "syncProcessed property");
	same(this.dataSyncController.syncErrors, [], "syncErrors property");
	same(objectsReceived, ["Program", "Series", "Episode"], "syncErrors property");
});

asyncTest("receiveObjects - no data", 3, function() {
	var resource = "Resource";
	this.dataSyncController.syncErrors = [];

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.objectReceived = $.proxy(function(type) {
		hex_md5 = originalMD5;
		equals(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
		equals(this.dataSyncController.syncErrors[0].message, "No resources found", "Error message");
		equals(type, resource, "Object received");
		start();
	}, this);

	this.dataSyncController.receiveObjects(resource);
});

asyncTest("receiveObjects - checksum mismatch", 2, function() {
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectReceived = $.proxy(function(type) {
		equals(this.dataSyncController.syncErrors[0].error, "Checksum mismatch", "Sync error");
		equals(type, this.syncList[0].type, "Object received");
		start();
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[0].type);
});

asyncTest("receiveObjects - ajax fail", 2, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectReceived = $.proxy(function(type) {
		equals(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
		equals(type, this.syncList[0].type, "Object received");
		start();
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[0].type);
	$.ajax = originalAjax;
});

asyncTest("receiveObjects - delete fail", 2, function() {
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = { Program: 0 };
	this.dataSyncController.objectsImported = { Program: -1 };

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	ProgramMock.removed = false;

	this.dataSyncController.objectReceived = $.proxy(function(type) {
		this.dataSyncController.objectsImported[type]++;
		if (this.dataSyncController.objectsImported[type] === this.dataSyncController.objectsToImport[type]) {
			hex_md5 = originalMD5;
			equals(this.dataSyncController.syncErrors[0].error, "Delete error", "Sync error");
			equals(type, this.syncList[0].type, "Object received");
			start();
		}
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[0].type);
});

asyncTest("receiveObjects - save fail", 2, function() {
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = { Program: 0 };
	this.dataSyncController.objectsImported = { Program: -1 };

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	ProgramMock.removed = true;

	this.dataSyncController.objectReceived = $.proxy(function(type) {
		this.dataSyncController.objectsImported[type]++;
		if (this.dataSyncController.objectsImported[type] === this.dataSyncController.objectsToImport[type]) {
			hex_md5 = originalMD5;
			equals(this.dataSyncController.syncErrors[0].error, "Save error", "Sync error");
			equals(type, this.syncList[0].type, "Object received");
			start();
		}
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[0].type);
});

asyncTest("receiveObjects - 304 Not Modified", 2, function() {
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = { Series: 0 };
	this.dataSyncController.objectsImported = { Series: -1 };
	$.ajax = jQueryMock.ajax;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.objectReceived = $.proxy(function(type) {
		this.dataSyncController.objectsImported[type]++;
		if (this.dataSyncController.objectsImported[type] === this.dataSyncController.objectsToImport[type]) {
			hex_md5 = originalMD5;
			equals(this.dataSyncController.syncErrors.length, 0, "Number of errors");
			equals(type, this.syncList[1].type, "Object received");
			start();
		}
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[1].type);
});

asyncTest("receiveObjects - success", 2, function() {
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = { Episode: 0 };
	this.dataSyncController.objectsImported = { Episode: -1 };

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.objectReceived = $.proxy(function(type) {
		this.dataSyncController.objectsImported[type]++;
		if (this.dataSyncController.objectsImported[type] === this.dataSyncController.objectsToImport[type]) {
			hex_md5 = originalMD5;
			equals(this.dataSyncController.syncErrors.length, 0, "Number of errors");
			equals(type, this.syncList[2].type, "Object received");
			start();
		}
	}, this);

	this.dataSyncController.receiveObjects(this.syncList[2].type);
});

test("objectReceived - not finished", 1, function() {
	this.dataSyncController.objectsToImport = {
		Program: 1,
		Series: 1,
		Episode: 1
	};

	this.dataSyncController.objectsImported = {
		Program: -1,
		Series: 1,
		Episode: 1
	};
	this.dataSyncController.objectReceived(this.syncList[0].type);
	equals(this.status.val(), "Imported 0 of " + this.dataSyncController.objectsToImport[this.syncList[0].type] + " " + this.syncList[0].type, "Status");
});

test("objectReceived - finished with errors", 4, function() {
	this.dataSyncController.objectsToImport = {
		Program: 1,
		Series: 1,
		Episode: 1
	};

	this.dataSyncController.objectsImported = {
		Program: 0,
		Series: 1,
		Episode: 1
	};
	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;

	this.dataSyncController.callback = function(success) {
		ok(!success, "Invoke callback with false");
	};

	this.dataSyncController.syncError("Force failed");
	this.dataSyncController.objectReceived(this.syncList[0].type);
	equals(this.status.val(), "Imported " + this.dataSyncController.objectsToImport[this.syncList[0].type] + " of " + this.dataSyncController.objectsToImport[this.syncList[0].type] + " " + this.syncList[0].type, "Status");
	ok(!$("#errorList").is(":empty"), "Display error list");
	ok(!$("#syncErrors").is(":hidden"), "Show sync errors");
});

test("objectReceived - finished without errors", 4, function() {
	this.dataSyncController.objectsToImport = {
		Program: 1,
		Series: 1,
		Episode: 1
	};

	this.dataSyncController.objectsImported = {
		Program: 0,
		Series: 1,
		Episode: 1
	};
	this.dataSyncController.syncErrors = [];

	this.dataSyncController.callback = function(success) {
		ok(success, "Invoke callback with true");
	};

	this.dataSyncController.objectReceived(this.syncList[0].type);
	equals(this.status.val(), "Imported " + this.dataSyncController.objectsToImport[this.syncList[0].type] + " of " + this.dataSyncController.objectsToImport[this.syncList[0].type] + " " + this.syncList[0].type, "Status");
	ok($("#errorList").is(":empty"), "Empty error list");
	ok($("#syncErrors").is(":hidden"), "Hide sync errors");
});

test("syncError - with id", 1, function() {
	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;
	this.dataSyncController.syncError("Test error", "test", "Test message", 1);
	same(this.dataSyncController.syncErrors, [$("<li>").html("Test error<br/>Type: test 1<br/>Test message")], "syncErrors property");
});

test("syncError - without id", 1, function() {
	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;
	this.dataSyncController.syncError("Test error", "test", "Test message");
	same(this.dataSyncController.syncErrors, [$("<li>").html("Test error<br/>Type: test<br/>Test message")], "syncErrors property");
});
