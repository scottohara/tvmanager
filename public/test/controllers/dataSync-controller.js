define(
	[
		'models/setting-model',
		'models/sync-model',
		'models/program-model',
		'models/series-model',
		'models/episode-model',
		'controllers/dataSync-controller',
		'controllers/application-controller',
		'test/mocks/jQuery-mock',
		'framework/jshash/md5-min',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(Setting, Sync, Program, Series, Episode, DataSyncController, ApplicationController, jQueryMock, hex_md5, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("dataSync-controller", {
			setup: function() {
				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);

				$("<input>")
					.attr("id", "deviceName")
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "registrationMessage")
					.hide()
					.appendTo(this.sandbox);

				$("<div>")
					.attr("id", "syncControls")
					.hide()
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "lastSyncTime")
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "localChanges")
					.appendTo(this.sandbox);

				var importChangesOnlyRow = $("<div>")
					.attr("id", "importChangesOnlyRow")
					.hide()
					.appendTo(this.sandbox);

				$("<input type='checkbox'>")
					.attr("id", "importChangesOnly")
					.appendTo(importChangesOnlyRow);
				
				var statusRow = $("<div>")
					.attr("id", "statusRow")
					.appendTo(this.sandbox);

				$("<input>")
					.attr("id", "status")
					.appendTo(statusRow);

				var syncErrors = $("<div>")
					.attr("id", "syncErrors")
					.hide()
					.appendTo(this.sandbox);

				$("<ul>")
					.attr("id", "errorList")
					.appendTo(syncErrors);

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

				this.originalSyncError = DataSyncController.prototype.syncError;
				this.dataSyncController = new DataSyncController();
				this.dataSyncController.syncError = function(error, type, message, id) {
					this.syncErrors.push({
						error: error,
						type: type,
						message: message,
						id: id
					});
				};

				this.dataSyncController.device = {
					id: "1",
					name: "test-device",
					imported: false
				};
			},
			teardown: function() {
				this.sandbox.remove();
				appController.db.reset();
			}
		});

		QUnit.test("constructor", 1, function() {
			QUnit.ok(this.dataSyncController, "Instantiate DataSyncController object");
		});

		QUnit.test("setup", 7, function() {
			var registrationRow = $("<div>")
				.attr("id", "registrationRow")
				.appendTo(this.sandbox);

			var importButton = $("<div>")
				.attr("id", "import")
				.appendTo(this.sandbox);

			var exportButton = $("<div>")
				.attr("id", "export")
				.appendTo(this.sandbox);

			Setting.setting.LastSyncTime = new Date(1900, 0, 1, 12, 0, 0);

			this.dataSyncController.dataImport = function() {
				QUnit.ok(true, "Bind import click event listener");
			};

			this.dataSyncController.dataExport = function() {
				QUnit.ok(true, "Bind export click event listener");
			};
			this.dataSyncController.goBack = function() {
				QUnit.ok(true, "Bind back button event listener");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.setup();
			QUnit.equal($("#lastSyncTime").val(), "1-Jan-1900 12:00:00", "Last Sync Time");
			QUnit.ok(!this.dataSyncController.localChanges, "Detect no changes");
			QUnit.equal($("#localChanges").val(), "No changes to be synced", "Changes");
			registrationRow.trigger("click");
			importButton.trigger("click");
			exportButton.trigger("click");
			this.dataSyncController.header.leftButton.eventHandler();
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("goBack", 1, function() {
			this.dataSyncController.goBack();
		});

		QUnit.test("gotLastSyncTime", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.gotLastSyncTime({ settingValue: null });
			QUnit.equal($("#lastSyncTime").val(), "Unknown", "Last Sync Time");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("gotDevice - unregistered", 3, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.gotDevice({}); 
			QUnit.equal($("#deviceName").val(), "< Unregistered >", "Device");
			QUnit.notEqual($("#registrationMessage").css("display"), "none", "Show registration message");
			QUnit.equal($("#syncControls").css("display"), "none", "Hide sync controls");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("gotDevice - registered, not imported", 5, function() {
			var device = {
				settingValue: JSON.stringify(this.dataSyncController.device)
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.gotDevice(device);
			QUnit.equal($("#deviceName").val(), this.dataSyncController.device.name, "Device");
			QUnit.notEqual($("#syncControls").css("display"), "none", "Show sync controls");
			QUnit.equal($("#registrationMessage").css("display"), "none", "Hide registration message");
			QUnit.equal($("#importChangesOnlyRow").css("display"), "none", "Hide import changes only row");
			QUnit.ok(!$("#importChangesOnly").is(":checked"), "Import changes only");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("gotDevice - registered, imported", 2, function() {
			this.dataSyncController.device.imported = true;
			var device = {
				settingValue: JSON.stringify(this.dataSyncController.device)
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.gotDevice(device);
			QUnit.notEqual($("#importChangesOnlyRow").css("display"), "none", "Show import changes only row");
			QUnit.ok($("#importChangesOnly").is(":checked"), "Import changes only");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("checkForLocalChanges - single change", 2, function() {
			var count = 1;
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.checkForLocalChanges(count);
			QUnit.ok(this.dataSyncController.localChanges, "Detect changes");
			QUnit.equal($("#localChanges").val(), count + " change to be synced", "Changes");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("checkForLocalChanges - multiple change", 2, function() {
			var count = 2;
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.checkForLocalChanges(count);
			QUnit.ok(this.dataSyncController.localChanges, "Detect changes");
			QUnit.equal($("#localChanges").val(), count + " changes to be synced", "Changes");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("dataExport - exporting", 2, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.exporting = true;
			this.dataSyncController.dataExport();
			QUnit.ok(this.dataSyncController.exporting, "Export blocked by semaphore");
			QUnit.equal($("#status").val(), "An export is already running", "Status");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("dataExport - not exporting", function() {
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

			QUnit.expect(testParams.length * 5 + 2);

			var i;

			window.confirm = function(message) {
				QUnit.equal(message, "Are you sure you want to export?", "confirm");
				return testParams[i].proceed;
			};

			this.dataSyncController.listRetrieved = $.proxy(function(syncList) {
				QUnit.equal(syncList, this.syncList, "Sync list");
				Sync.syncList = [];
				QUnit.ok(true, "List retrieved");
				this.dataSyncController.callback(true);
			}, this);

			Sync.syncList = this.syncList;

			jQueryMock.setDefaultContext(this.sandbox);
			for (i = 0; i < testParams.length; i++) {
				this.dataSyncController.dataExport();
				QUnit.equal($("#status").val(), testParams[i].status, testParams[i].description + " - Status");
				QUnit.equal($("#statusRow").css("display") === "none", testParams[i].proceed, testParams[i].description + " - Hide status row");
				QUnit.deepEqual(appController.notice.pop(), {
					label: testParams[i].notice,
					leftButton: {
						style: "cautionButton",
						label: "OK"
					}
				}, "Update notice");
				QUnit.ok(!this.dataSyncController.exporting, testParams[i].description + " - Reset semaphore");
			}

			jQueryMock.clearDefaultContext();
			delete window.confirm;
		});

		QUnit.test("dataImport - importing", 2, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.importing = true;
			this.dataSyncController.dataImport();
			QUnit.ok(this.dataSyncController.importing, "Import blocked by semaphore");
			QUnit.equal($("#status").val(), "An import is already running", "Status");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("dataImport - not importing", function() {
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

			QUnit.expect(testParams.length * 5 + 1);

			var i;

			window.confirm = function(message) {
				QUnit.equal(message, "Warning: Local changes have been made. Are you sure you want to import?", "confirm");
				return testParams[i].proceed;
			};

			this.dataSyncController.localChanges = true;
			this.dataSyncController.doImport = function() {
				QUnit.ok(true, "Do import");
				this.callback(true);
			};

			jQueryMock.setDefaultContext(this.sandbox);
			for (i = 0; i < testParams.length; i++) {
				this.dataSyncController.dataImport();
				QUnit.equal($("#status").val(), testParams[i].status, testParams[i].description + " - Status");
				QUnit.equal($("#statusRow").css("display") === "none", testParams[i].proceed, testParams[i].description + " - Hide status row");
				QUnit.deepEqual(appController.notice.pop(), {
					label: testParams[i].notice,
					leftButton: {
						style: "cautionButton",
						label: "OK"
					}
				}, "Update notice");
				QUnit.ok(!this.dataSyncController.importing, testParams[i].description + " - Reset semaphore");
			}

			jQueryMock.clearDefaultContext();
			delete window.confirm;
		});

		QUnit.test("listRetrieved", 6, function() {
			this.dataSyncController.sendChange = $.proxy(function(sync) {
				QUnit.equal(sync, this.syncList[0], "Sync - modified");
				QUnit.ok(true, "Send change");
			}, this);

			this.dataSyncController.sendDelete = $.proxy(function(sync) {
				QUnit.equal(sync, this.syncList[1], "Sync - deleted");
				QUnit.ok(true, "Send delete");
			}, this);

			this.dataSyncController.listRetrieved(this.syncList.slice(0,2));
			QUnit.equal(this.dataSyncController.syncProcessed, 0, "syncProcessed property");
			QUnit.deepEqual(this.dataSyncController.syncErrors, [], "syncErrors property");
		});

		QUnit.asyncTest("sendChange - checksum mismatch", 2, function() {
			var originalHash = hex_md5();
			hex_md5.setHash("\"");

			this.dataSyncController.syncErrors = [];
			this.dataSyncController.changeSent = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Checksum mismatch", "Sync error");
				QUnit.ok(true, "Change sent");
				hex_md5.setHash(originalHash);
				QUnit.start();
			}, this);

			this.dataSyncController.sendChange(this.syncList[0]);
		});

		QUnit.asyncTest("sendChange - ajax fail", 2, function() {
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.syncErrors = [];
			this.dataSyncController.changeSent = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Send error", "Sync error");
				QUnit.ok(true, "Change sent");
				QUnit.start();
			}, this);

			this.dataSyncController.sendChange(this.syncList[0]);
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("sendChange - success", 2, function() {
			this.syncList[0].remove = function() {
				QUnit.ok(true, "Sync removed");
			};

			this.dataSyncController.changeSent = function() {
				QUnit.ok(true, "Change sent");
				QUnit.start();
			};

			this.dataSyncController.sendChange(this.syncList[0]);
		});

		QUnit.asyncTest("sendDelete - ajax fail", 2, function() {
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.syncErrors = [];
			this.dataSyncController.changeSent = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Delete error", "Sync error");
				QUnit.ok(true, "Change sent");
				QUnit.start();
			}, this);

			this.dataSyncController.sendDelete(this.syncList[0]);
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("sendDelete - success", 2, function() {
			this.syncList[0].remove = function() {
				QUnit.ok(true, "Sync removed");
			};

			this.dataSyncController.changeSent = function() {
				QUnit.ok(true, "Change sent");
				QUnit.start();
			};

			this.dataSyncController.sendDelete(this.syncList[0]);
		});

		QUnit.test("changeSent - not finished", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.syncProcessed = 0;
			this.dataSyncController.syncList = this.syncList;
			this.dataSyncController.changeSent();
			QUnit.equal($("#status").val(), "Exported 1 of " + this.syncList.length + " changes", "Status");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("changeSent - finished with errors", 1, function() {
			this.dataSyncController.syncProcessed = 0;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncList = this.syncList;
			this.dataSyncController.syncProcessed = this.syncList.length - 1;

			this.dataSyncController.showErrors = function() {
				QUnit.ok(true, "Show errors");
			};

			this.dataSyncController.syncError("Force failed");
			this.dataSyncController.changeSent();
		});

		QUnit.test("changeSent - finished without errors", 4, function() {
			this.dataSyncController.syncProcessed = 0;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncList = this.syncList;
			this.dataSyncController.syncProcessed = this.syncList.length - 1;

			this.dataSyncController.callback = function(success) {
				QUnit.ok(success, "Invoke callback with true");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.changeSent();
			QUnit.equal($("#status").val(), "Exported " + this.syncList.length + " of " + this.syncList.length + " changes", "Status");
			QUnit.ok($("#errorList").is(":empty"), "Empty error list");
			QUnit.equal($("#syncErrors").css("display"), "none", "Hide sync errors");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("setLastSyncTime", 1, function() {
			var originalDate = Date;
			var fakeDate = new Date(1900, 0, 1, 12, 0, 0);
			Date = function() {
				return fakeDate;
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.setLastSyncTime();
			QUnit.equal($("#lastSyncTime").val(), "1-Jan-1900 12:00:00", "Last Sync Time");
			jQueryMock.clearDefaultContext();
			Date = originalDate;
		});

		QUnit.test("doImport - changes only", 4, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			$("#importChangesOnly").prop("checked", true);
			var changesOnly = $("#importChangesOnly").is(":checked");
			
			this.dataSyncController.importData = $.proxy(function() {
				QUnit.equal(this.importChangesOnly, changesOnly, "Import changes only property");
				QUnit.ok(this.programsReady, "Programs ready");
				QUnit.ok(this.seriesReady, "Series ready");
				QUnit.ok(this.episodesReady, "Episodes ready");
			}, this.dataSyncController);

			this.dataSyncController.doImport();
			jQueryMock.clearDefaultContext();
		});

		QUnit.asyncTest("doImport - delete fail", function() {
			var testParams = ["Program", "Series", "Episode"];
			Program.removed = false;
			Series.removed = false;
			Episode.removed = false;
			this.dataSyncController.syncErrors = [];
			jQueryMock.setDefaultContext(this.sandbox);
			var changesOnly = $("#importChangesOnly").is(":checked");
			jQueryMock.clearDefaultContext();

			QUnit.expect(testParams.length * 3 + 1);

			this.dataSyncController.importDone = $.proxy(function() {
				if (this.programsReady && this.seriesReady && this.episodesReady) {
					QUnit.equal(this.importChangesOnly, changesOnly, "Import changes only property");
					for (var i = 0; i < testParams.length; i++) {
						QUnit.equal(this.syncErrors[i].error, "Delete error", "Sync error");
						QUnit.equal(this.syncErrors[i].type, testParams[i], "Error type");
						QUnit.equal(this.syncErrors[i].message, "Force failed", "Error message");
					}
					QUnit.start();
				}
			}, this.dataSyncController);
			
			this.dataSyncController.doImport();
		});

		QUnit.asyncTest("doImport - success", 2, function() {
			var objectsReceived = [];
			Program.removed = true;
			Series.removed = true;
			Episode.removed = true;
			this.dataSyncController.syncErrors = [];
			jQueryMock.setDefaultContext(this.sandbox);
			var changesOnly = $("#importChangesOnly").is(":checked");
			jQueryMock.clearDefaultContext();
			
			this.dataSyncController.importData = $.proxy(function() {
				if (this.programsReady && this.seriesReady && this.episodesReady) {
					QUnit.equal(this.importChangesOnly, false, "Import changes only property");
					QUnit.deepEqual(this.syncErrors, [], "syncErrors property");
					QUnit.start();
				}
			}, this.dataSyncController);

			this.dataSyncController.doImport();
		});

		QUnit.test("importData - not finished", 2, function() {
			this.dataSyncController.importDone();
			QUnit.equal(this.dataSyncController.objectsToImport, undefined, "objectsToImport property");
			QUnit.equal(this.dataSyncController.objectsImported, undefined, "objectsImported property");
		});

		QUnit.asyncTest("importData - full import, no data", 2, function() {
			this.dataSyncController.importChangesOnly = false;
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.importData = {
				data: [],
				checksum: "test-hash"
			};

			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
				QUnit.equal(this.dataSyncController.syncErrors[0].message, "No data found", "Error message");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("importData - changes only, no data", 1, function() {
			this.dataSyncController.importChangesOnly = true;
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.importData = [];

			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors.length, 0, "Number of errors");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("importData - checksum mismatch", 1, function() {
			var originalHash = hex_md5();
			hex_md5.setHash("\"");
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Checksum mismatch", "Sync error");
				hex_md5.setHash(originalHash);
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
		});

		QUnit.asyncTest("importData - ajax fail", 1, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.syncErrors = [];
			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Receive error", "Sync error");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("importData - save fail", 1, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.objectsToImport = 0;
			this.dataSyncController.objectsImported = 0;
			Program.saved = false;

			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors[0].error, "Save error", "Sync error");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
		});

		QUnit.asyncTest("importData - 304 Not Modified", 1, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.objectsToImport = 0;
			this.dataSyncController.objectsImported = 0;
			$.ajax = jQueryMock.ajax;
			Program.saved = true;

			this.dataSyncController.importDone = $.proxy(function() {
				QUnit.equal(this.dataSyncController.syncErrors.length, 0, "Number of errors");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
		});

		QUnit.asyncTest("importData - success", 3, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.objectsToImport = 0;
			this.dataSyncController.objectsImported = 0;
			this.dataSyncController.importChangesOnly = true;

			var originalProgramRemove = Program.prototype.remove;
			Program.prototype.remove = function() {
				QUnit.ok(true, "Program removed");
			};

			Sync.removedCount = 0;
			var originalSyncRemove = Sync.prototype.remove;
			Sync.prototype.remove = function() {
				Sync.removedCount++;
			};

			this.dataSyncController.importDone = $.proxy(function() {
				Program.prototype.remove = originalProgramRemove;
				Sync.prototype.remove = originalSyncRemove;
				QUnit.equal(this.dataSyncController.objectsImported, Sync.removedCount, "Number of Syncs removed");
				QUnit.equal(this.dataSyncController.syncErrors.length, 0, "Number of errors");
				QUnit.start();
			}, this);

			this.dataSyncController.importData();
		});

		QUnit.asyncTest("removePending - ajax fail", 2, function() {
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.dataSyncController.syncError = $.proxy(function(error, type, message) {
				QUnit.equal(error, "Save error", "Sync error");
				QUnit.equal(type, this.syncList[0].type, "Type");
				QUnit.start();
			}, this);
			
			this.dataSyncController.removePending(this.syncList[0].id, this.syncList[0].type);
			$.ajax = originalAjax;
		});

		QUnit.asyncTest("removePending - success", 1, function() {
			this.dataSyncController.dataImported = function() {
				QUnit.ok(true, "Data imported");
				QUnit.start();
			};
			this.dataSyncController.removePending(this.syncList[0].id, this.syncList[0].type);
		});

		QUnit.test("dataImported", 2, function() {
			this.dataSyncController.objectsToImport = 1;
			this.dataSyncController.objectsImported = 0;
			
			this.dataSyncController.importDone = function() {
				QUnit.ok(true, "Import done");
			};

			this.dataSyncController.dataImported();
			QUnit.equal($("#status").val(), "Imported 1 of 1", "Status");
		});

		QUnit.test("importDone - not finished", 1, function() {
			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.importDone();
			QUnit.equal($("#syncErrors").css("display"), "none", "Hide sync errors");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("importDone - finished with errors", 1, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncError = this.originalSyncError;

			this.dataSyncController.showErrors = function() {
				QUnit.ok(true, "Show errors");
			};

			this.dataSyncController.syncError("Force failed");
			this.dataSyncController.importDone();
		});

		QUnit.test("importDone - delete fail", 1, function() {
			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];

			Sync.removed = false;

			this.dataSyncController.showErrors = function() {
				QUnit.ok(true, "Show errors");
			};

			this.dataSyncController.importDone();
		});

		QUnit.test("importDone - finished without errors", function() {
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

			QUnit.expect(testParams.length * 2);

			this.dataSyncController.programsReady = true;
			this.dataSyncController.seriesReady = true;
			this.dataSyncController.episodesReady = true;
			this.dataSyncController.syncErrors = [];

			Sync.removed = true;

			var i;

			this.dataSyncController.importSuccessful = function() {
				QUnit.ok(true, testParams[i].description + " - Import successful");
				QUnit.equal(this.device.imported, testParams[i].imported, testParams[i].description + " - Device imported property");
			};

			for (i = 0; i < testParams.length; i++) {
				this.dataSyncController.device.imported = false;
				this.dataSyncController.importChangesOnly = testParams[i].changesOnly;
				this.dataSyncController.importDone();
			}
		});

		QUnit.test("importSuccessful", 3, function() {
			this.dataSyncController.callback = function(success) {
				QUnit.ok(success, "Invoke callback with true");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.dataSyncController.importSuccessful();
			QUnit.ok($("#errorList").is(":empty"), "Empty error list");
			QUnit.equal($("#syncErrors").css("display"), "none", "Hide sync errors");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("syncError - with id", 3, function() {
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncError = this.originalSyncError;
			this.dataSyncController.syncError("Test error", "test", "Test message", 1);
			QUnit.equal(this.dataSyncController.syncErrors.length, 1, "Number of errors");
			QUnit.ok(this.dataSyncController.syncErrors[0].is("li"), "syncErrors property type");
			QUnit.deepEqual(this.dataSyncController.syncErrors[0].html(), "Test error<br>Type: test 1<br>Test message", "syncErrors property content");
		});

		QUnit.test("syncError - without id", 3, function() {
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncError = this.originalSyncError;
			this.dataSyncController.syncError("Test error", "test", "Test message");
			QUnit.equal(this.dataSyncController.syncErrors.length, 1, "Number of errors");
			QUnit.ok(this.dataSyncController.syncErrors[0].is("li"), "syncErrors property type");
			QUnit.deepEqual(this.dataSyncController.syncErrors[0].html(), "Test error<br>Type: test<br>Test message", "syncErrors property content");
		});

		QUnit.test("showErrors", 3, function() {
			this.dataSyncController.syncErrors = [];
			this.dataSyncController.syncError = this.originalSyncError;

			this.dataSyncController.callback = function(success) {
				QUnit.ok(!success, "Invoke callback with false");
			};

			jQueryMock.setDefaultContext(this.sandbox);

			this.dataSyncController.syncError("Test error", "test", "Test message");
			this.dataSyncController.showErrors();
			QUnit.ok(!$("#errorList").is(":empty"), "Display error list");
			QUnit.notEqual($("#syncErrors").css("display"), "none", "Show sync errors");
			jQueryMock.clearDefaultContext();
		});
	}
);
