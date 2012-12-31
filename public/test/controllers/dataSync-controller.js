module("dataSync-controller", {
	setup: function() {
		"use strict";

		this.deviceName = $("<input>")
			.attr("id", "deviceName")
			.hide()
			.appendTo(document.body);

		this.registrationMessage = $("<div>")
			.attr("id", "registrationMessage")
			.hide()
			.appendTo(document.body);

		this.syncControls = $("<div>")
			.attr("id", "syncControls")
			.hide()
			.appendTo(document.body);

		this.lastSyncTime = $("<input>")
			.attr("id", "lastSyncTime")
			.hide()
			.appendTo(document.body);

		this.localChanges = $("<input>")
			.attr("id", "localChanges")
			.hide()
			.appendTo(document.body);

		this.importChangesOnlyRow = $("<div>")
			.attr("id", "importChangesOnlyRow")
			.hide()
			.appendTo(document.body);

		this.importChangesOnly = $("<input type='checkbox'>")
			.attr("id", "importChangesOnly")
			.hide()
			.appendTo(this.importChangesOnlyRow);
		
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
			if (this.importData) {
				options.success.apply(options.context, [
					this.importData,
					200,
					{
						getResponseHeader: function() { return "test-hash"; } 
					}
				]);
			} else {
				options.error.apply(options.context, [{
					status: "404",
					statusText: "Not found"
				}, "Force failed"]);
			}
				
			if (options.complete) {
				options.complete();
			}
		}, this);

		this.originalSetting = Setting;
		Setting = SettingMock;

		this.originalSyncList = Sync.list;
		Sync.list = SyncMock.list;

		this.originalSyncCount = Sync.count;
		Sync.count = SyncMock.count;

		this.originalSyncRemoveAll = Sync.removeAll;
		Sync.removeAll = SyncMock.removeAll;

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
		this.dataSyncController.device = {
			id: "1",
			name: "test-device",
			imported: false
		};
	},
	teardown: function() {
		"use strict";

		this.deviceName.remove();
		this.registrationMessage.remove();
		this.syncControls.remove();
		this.lastSyncTime.remove();
		this.localChanges.remove();
		this.importChangesOnlyRow.remove();
		this.importChangesOnly.remove();
		this.statusRow.remove();
		this.status.remove();
		this.syncErrors.remove();
		this.errorList.remove();
		Setting = this.originalSetting;
		Sync.list = this.originalSyncList;
		Sync.count = this.originalSyncCount;
		Sync.removeAll = this.originalSyncRemoveAll;
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
	"use strict";

	ok(this.dataSyncController, "Instantiate DataSyncController object");
});

test("setup", 7, function() {
	"use strict";

	var registrationRow = $("<div>")
		.attr("id", "registrationRow")
		.hide()
		.appendTo(document.body);

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
	registrationRow.trigger("click");
	importButton.trigger("click");
	exportButton.trigger("click");
	this.dataSyncController.header.leftButton.eventHandler();

	registrationRow.remove();
	importButton.remove();
	exportButton.remove();
});

test("goBack", 1, function() {
	"use strict";

	this.dataSyncController.goBack();
});

test("gotLastSyncTime", 1, function() {
	"use strict";

	this.dataSyncController.gotLastSyncTime({ settingValue: null });
	equals(this.lastSyncTime.val(), "Unknown", "Last Sync Time");
});

test("gotDevice - unregistered", 3, function() {
	"use strict";

	this.dataSyncController.gotDevice({}); 
	equals(this.deviceName.val(), "< Unregistered >", "Device");
	ok(!$("#registrationMessage").is(":hidden"), "Show registration message");
	ok($("#syncControls").is(":hidden"), "Hide sync controls");
});

test("gotDevice - registered, not imported", 5, function() {
	"use strict";

	var device = {
		settingValue: JSON.stringify(this.dataSyncController.device)
	};

	this.dataSyncController.gotDevice(device);
	equals(this.deviceName.val(), this.dataSyncController.device.name, "Device");
	ok(!$("#syncControls").is(":hidden"), "Show sync controls");
	ok($("#registrationMessage").is(":hidden"), "Hide registration message");
	ok($("#importChangesOnlyRow").is(":hidden"), "Hide import changes only row");
	ok(!$("#importChangesOnly").is(":checked"), "Import changes only");
});

test("gotDevice - registered, imported", 2, function() {
	"use strict";

	this.dataSyncController.device.imported = true;
	var device = {
		settingValue: JSON.stringify(this.dataSyncController.device)
	};

	this.dataSyncController.gotDevice(device);
	ok(!$("#importChangesOnlyRow").is(":hidden"), "Show import changes only row");
	ok($("#importChangesOnly").is(":checked"), "Import changes only");
});

test("checkForLocalChanges - single change", 2, function() {
	"use strict";

	var count = 1;
	this.dataSyncController.checkForLocalChanges(count);
	ok(this.dataSyncController.localChanges, "Detect changes");
	equals(this.localChanges.val(), count + " change to be synced", "Changes");
});

test("checkForLocalChanges - multiple change", 2, function() {
	"use strict";

	var count = 2;
	this.dataSyncController.checkForLocalChanges(count);
	ok(this.dataSyncController.localChanges, "Detect changes");
	equals(this.localChanges.val(), count + " changes to be synced", "Changes");
});

test("dataExport - exporting", 2, function() {
	"use strict";

	this.dataSyncController.exporting = true;
	this.dataSyncController.dataExport();
	ok(this.dataSyncController.exporting, "Export blocked by semaphore");
	equals(this.status.val(), "An export is already running", "Status");
});

test("dataExport - not exporting", function() {
	"use strict";

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
	"use strict";

	this.dataSyncController.importing = true;
	this.dataSyncController.dataImport();
	ok(this.dataSyncController.importing, "Import blocked by semaphore");
	equals(this.status.val(), "An import is already running", "Status");
});

test("dataImport - not importing", function() {
	"use strict";

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
	"use strict";

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

asyncTest("sendChange - checksum mismatch", 2, function() {
	"use strict";

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
	"use strict";

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
	"use strict";

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
	"use strict";

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
	"use strict";

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
	"use strict";

	this.dataSyncController.syncProcessed = 0;
	this.dataSyncController.syncList = this.syncList;
	this.dataSyncController.changeSent();
	equals(this.status.val(), "Exported 1 of " + this.syncList.length + " changes", "Status");
});

test("changeSent - finished with errors", 1, function() {
	"use strict";

	this.dataSyncController.syncProcessed = 0;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.syncList = this.syncList;
	this.dataSyncController.syncProcessed = this.syncList.length - 1;

	this.dataSyncController.showErrors = function() {
		ok(true, "Show errors");
	};

	this.dataSyncController.syncError("Force failed");
	this.dataSyncController.changeSent();
});

test("changeSent - finished without errors", 4, function() {
	"use strict";

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
	"use strict";

	var originalDate = Date;
	var fakeDate = new Date(1900, 0, 1, 12, 0, 0);
	Date = function() {
		return fakeDate;
	};

	this.dataSyncController.setLastSyncTime();
	equals(this.lastSyncTime.val(), "1-Jan-1900 12:00:00", "Last Sync Time");
	Date = originalDate;
});

test("doImport - changes only", 4, function() {
	"use strict";

	this.importChangesOnly.prop("checked", true);
	var changesOnly = this.importChangesOnly.is(":checked");
	
	this.dataSyncController.importData = $.proxy(function() {
		equals(this.importChangesOnly, changesOnly, "Import changes only property");
		ok(this.programsReady, "Programs ready");
		ok(this.seriesReady, "Series ready");
		ok(this.episodesReady, "Episodes ready");
	}, this.dataSyncController);

	this.dataSyncController.doImport();
});

asyncTest("doImport - delete fail", function() {
	"use strict";

	var testParams = ["Program", "Series", "Episode"];
	ProgramMock.removed = false;
	SeriesMock.removed = false;
	EpisodeMock.removed = false;
	this.dataSyncController.syncErrors = [];
	var changesOnly = this.importChangesOnly.is(":checked");

	expect(testParams.length * 3 + 1);

	this.dataSyncController.importDone = $.proxy(function() {
		if (this.programsReady && this.seriesReady && this.episodesReady) {
			equals(this.importChangesOnly, changesOnly, "Import changes only property");
			for (var i = 0; i < testParams.length; i++) {
				equals(this.syncErrors[i].error, "Delete error", "Sync error");
				equals(this.syncErrors[i].type, testParams[i], "Error type");
				equals(this.syncErrors[i].message, "Force failed", "Error message");
			}
			start();
		}
	}, this.dataSyncController);
	
	this.dataSyncController.doImport();
});

asyncTest("doImport - success", 2, function() {
	"use strict";

	var objectsReceived = [];
	ProgramMock.removed = true;
	SeriesMock.removed = true;
	EpisodeMock.removed = true;
	this.dataSyncController.syncErrors = [];
	var changesOnly = this.importChangesOnly.is(":checked");
	
	this.dataSyncController.importData = $.proxy(function() {
		if (this.programsReady && this.seriesReady && this.episodesReady) {
			equals(this.importChangesOnly, false, "Import changes only property");
			same(this.syncErrors, [], "syncErrors property");
			start();
		}
	}, this.dataSyncController);

	this.dataSyncController.doImport();
});

test("importData - not finished", 2, function() {
	"use strict";

	this.dataSyncController.importDone();
	equals(this.dataSyncController.objectsToImport, undefined, "objectsToImport property");
	equals(this.dataSyncController.objectsImported, undefined, "objectsImported property");
});

asyncTest("importData - full import, no data", 2, function() {
	"use strict";

	this.dataSyncController.importChangesOnly = false;
	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.importData = [];

	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.importDone = $.proxy(function() {
		hex_md5 = originalMD5;
		equals(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
		equals(this.dataSyncController.syncErrors[0].message, "No data found", "Error message");
		start();
	}, this);

	this.dataSyncController.importData();
	$.ajax = originalAjax;
});

asyncTest("importData - changes only, no data", 1, function() {
	"use strict";

	this.dataSyncController.importChangesOnly = true;
	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.importData = [];

	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.importDone = $.proxy(function() {
		hex_md5 = originalMD5;
		equals(this.dataSyncController.syncErrors.length, 0, "Number of errors");
		start();
	}, this);

	this.dataSyncController.importData();
	$.ajax = originalAjax;
});

// Test quarantined until Heroku timeout issue resolved
/*
asyncTest("importData - checksum mismatch", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.importDone = $.proxy(function() {
		equals(this.dataSyncController.syncErrors[0].error, "Checksum mismatch", "Sync error");
		start();
	}, this);

	this.dataSyncController.importData();
});
*/

asyncTest("importData - ajax fail", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.syncErrors = [];
	this.dataSyncController.importDone = $.proxy(function() {
		equals(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
		start();
	}, this);

	this.dataSyncController.importData();
	$.ajax = originalAjax;
});

asyncTest("importData - save fail", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = 0;
	this.dataSyncController.objectsImported = 0;

	ProgramMock.saved = false;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.importDone = $.proxy(function() {
		hex_md5 = originalMD5;
		equals(this.dataSyncController.syncErrors[0].error, "Save error", "Sync error");
		start();
	}, this);

	this.dataSyncController.importData();
});

asyncTest("importData - 304 Not Modified", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = 0;
	this.dataSyncController.objectsImported = 0;
	$.ajax = jQueryMock.ajax;

	ProgramMock.saved = true;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	this.dataSyncController.importDone = $.proxy(function() {
		hex_md5 = originalMD5;
		equals(this.dataSyncController.syncErrors.length, 0, "Number of errors");
		start();
	}, this);

	this.dataSyncController.importData();
});

asyncTest("importData - success", 3, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	this.dataSyncController.objectsToImport = 0;
	this.dataSyncController.objectsImported = 0;
	this.dataSyncController.importChangesOnly = true;

	var originalMD5 = hex_md5;
	hex_md5 = function(data) {
		return "test-hash";
	};

	var originalProgramRemove = Program.prototype.remove;
	Program.prototype.remove = function() {
		ok(true, "Program removed");
	};

	SyncMock.removedCount = 0;
	var originalSyncRemove = Sync.prototype.remove;
	Sync.prototype.remove = function() {
		SyncMock.removedCount++;
	};

	this.dataSyncController.importDone = $.proxy(function() {
		hex_md5 = originalMD5;
		Program.prototype.remove = originalProgramRemove;
		Sync.prototype.remove = originalSyncRemove;
		equals(this.dataSyncController.objectsImported, SyncMock.removedCount, "Number of Syncs removed");
		equals(this.dataSyncController.syncErrors.length, 0, "Number of errors");
		start();
	}, this);

	this.dataSyncController.importData();
});

asyncTest("removePending - ajax fail", 2, function() {
	"use strict";

	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.dataSyncController.syncError = $.proxy(function(error, type, message) {
		equals(error, "Save error", "Sync error");
		equals(type, this.syncList[0].type, "Type");
		start();
	}, this);
	
	this.dataSyncController.removePending(this.syncList[0].id, this.syncList[0].type);
	$.ajax = originalAjax;
});

asyncTest("removePending - success", 1, function() {
	"use strict";

	this.dataSyncController.dataImported = function() {
		ok(true, "Data imported");
		start();
	};
	this.dataSyncController.removePending(this.syncList[0].id, this.syncList[0].type);
});

test("dataImported", 2, function() {
	"use strict";

	this.dataSyncController.objectsToImport = 1;
	this.dataSyncController.objectsImported = 0;
	
	this.dataSyncController.importDone = function() {
		ok(true, "Import done");
	};

	this.dataSyncController.dataImported();
	equals(this.status.val(), "Imported 1 of 1", "Status");
});

test("importDone - not finished", 1, function() {
	"use strict";

	this.dataSyncController.importDone();
	ok(!$("#syncErrors").is(":hidden"), "Show sync errors");
});

test("importDone - finished with errors", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;

	this.dataSyncController.showErrors = function() {
		ok(true, "Show errors");
	};

	this.dataSyncController.syncError("Force failed");
	this.dataSyncController.importDone();
});

test("importDone - delete fail", 1, function() {
	"use strict";

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];

	SyncMock.removed = false;

	this.dataSyncController.showErrors = function() {
		ok(true, "Show errors");
	};

	this.dataSyncController.importDone();
});

test("importDone - finished without errors", function() {
	"use strict";

	var testParams = [
		{
			description: "full import",
			changesOnly: false,
			imported: true
		},
		{
			description: "import changes only",
			changesOnly: true,
			imported: false
		}
	];

	expect(testParams.length * 2);

	this.dataSyncController.programsReady = true;
	this.dataSyncController.seriesReady = true;
	this.dataSyncController.episodesReady = true;
	this.dataSyncController.syncErrors = [];

	SyncMock.removed = true;

	var i;

	this.dataSyncController.importSuccessful = function() {
		ok(true, testParams[i].description + " - Import successful");
		equals(this.device.imported, testParams[i].imported, testParams[i].description + " - Device imported property");
	};

	for (i = 0; i < testParams.length; i++) {
		this.dataSyncController.device.imported = false;
		this.dataSyncController.importChangesOnly = testParams[i].changesOnly;
		this.dataSyncController.importDone();
	}
});

test("importSuccessful", 3, function() {
	"use strict";

	this.dataSyncController.callback = function(success) {
		ok(success, "Invoke callback with true");
	};

	this.dataSyncController.importSuccessful();
	ok($("#errorList").is(":empty"), "Empty error list");
	ok($("#syncErrors").is(":hidden"), "Hide sync errors");
});

test("syncError - with id", 3, function() {
	"use strict";

	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;
	this.dataSyncController.syncError("Test error", "test", "Test message", 1);
	equals(this.dataSyncController.syncErrors.length, 1, "Number of errors");
	ok(this.dataSyncController.syncErrors[0].is("li"), "syncErrors property type");
	same(this.dataSyncController.syncErrors[0].html(), "Test error<br>Type: test 1<br>Test message", "syncErrors property content");
});

test("syncError - without id", 3, function() {
	"use strict";

	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;
	this.dataSyncController.syncError("Test error", "test", "Test message");
	equals(this.dataSyncController.syncErrors.length, 1, "Number of errors");
	ok(this.dataSyncController.syncErrors[0].is("li"), "syncErrors property type");
	same(this.dataSyncController.syncErrors[0].html(), "Test error<br>Type: test<br>Test message", "syncErrors property content");
});

test("showErrors", 3, function() {
	"use strict";

	this.dataSyncController.syncErrors = [];
	DataSyncController.prototype.syncError = this.originalSyncError;

	this.dataSyncController.callback = function(success) {
		ok(!success, "Invoke callback with false");
	};

	this.dataSyncController.syncError("Test error", "test", "Test message");
	this.dataSyncController.showErrors();
	ok(!$("#errorList").is(":empty"), "Display error list");
	ok(!$("#syncErrors").is(":hidden"), "Show sync errors");
});
