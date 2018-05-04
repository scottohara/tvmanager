import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import DataSyncController from "controllers/dataSync-controller";
import DataSyncView from "views/dataSync-view.html";
import Episode from "models/episode-model";
import Program from "models/program-model";
import Series from "models/series-model";
import Setting from "models/setting-model";
import Sync from "models/sync-model";
import window from "components/window";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("DataSyncController", () => {
	let dataSyncController;

	beforeEach(() => (dataSyncController = new DataSyncController()));

	describe("object constructor", () => {
		it("should return a DataSyncController instance", () => dataSyncController.should.be.an.instanceOf(DataSyncController));
	});

	describe("view", () => {
		it("should return the data sync view", () => dataSyncController.view.should.equal(DataSyncView));
	});

	describe("setup", () => {
		beforeEach(() => {
			sinon.stub(dataSyncController, "goBack");
			sinon.stub(dataSyncController, "activate");
			dataSyncController.setup();
		});

		it("should set the header label", () => dataSyncController.header.label.should.equal("Import/Export"));

		it("should attach a header left button event handler", () => {
			dataSyncController.header.leftButton.eventHandler();
			dataSyncController.goBack.should.have.been.called;
		});

		it("should set the header left button style", () => dataSyncController.header.leftButton.style.should.equal("backButton"));
		it("should set the header left button label", () => dataSyncController.header.leftButton.label.should.equal("Settings"));

		it("should activate the controller", () => dataSyncController.activate.should.have.been.called);
	});

	describe("activate", () => {
		const lastSyncTime = "1 Jan 2010",
					device = "test-device";

		let registrationRow,
				importButton,
				exportButton,
				localChanges;

		beforeEach(() => {
			sinon.stub(dataSyncController, "viewRegistration");
			sinon.stub(dataSyncController, "dataImport");
			sinon.stub(dataSyncController, "dataExport");
			sinon.stub(dataSyncController, "gotLastSyncTime");
			sinon.stub(dataSyncController, "gotDevice");
			sinon.stub(dataSyncController, "checkForLocalChanges");
			Setting.get.reset();
			Setting.get.withArgs("LastSyncTime").yields(lastSyncTime);
			Setting.get.withArgs("Device").yields(device);

			registrationRow = $("<div>")
				.attr("id", "registrationRow")
				.hide()
				.appendTo(document.body);

			importButton = $("<div>")
				.attr("id", "import")
				.hide()
				.appendTo(document.body);

			exportButton = $("<div>")
				.attr("id", "export")
				.hide()
				.appendTo(document.body);

			localChanges = $("<div>")
				.attr("id", "localChanges")
				.hide()
				.appendTo(document.body);

			Sync.syncList.push("");
			dataSyncController.activate();
		});

		it("should attach a registration click event handler", () => {
			registrationRow.trigger("click");
			dataSyncController.viewRegistration.should.have.been.called;
		});

		it("should attach an import click event handler", () => {
			importButton.trigger("click");
			dataSyncController.dataImport.should.have.been.called;
		});

		it("should attach an export click event handler", () => {
			exportButton.trigger("click");
			dataSyncController.dataExport.should.have.been.called;
		});

		it("should set the initial status message", () => localChanges.val().should.equal("Checking..."));
		it("should get the last sync time", () => dataSyncController.gotLastSyncTime.should.have.been.calledWith(lastSyncTime));
		it("should get the registered device", () => dataSyncController.gotDevice.should.have.been.calledWith(device));
		it("should count how many local changes there are to be synced", () => dataSyncController.checkForLocalChanges.should.have.been.calledWith(1));

		afterEach(() => {
			registrationRow.remove();
			importButton.remove();
			exportButton.remove();
			localChanges.remove();
			Sync.syncList.pop();
		});
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			dataSyncController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewRegistration", () => {
		it("should push the registration view", () => {
			dataSyncController.viewRegistration();
			appController.pushView.should.have.been.calledWith("registration");
		});
	});

	describe("gotLastSyncTime", () => {
		let lastSyncTime;

		beforeEach(() => (lastSyncTime = $("<div>")
			.attr("id", "lastSyncTime")
			.hide()
			.appendTo(document.body)
		));

		describe("with last sync time", () => {
			it("should display the last sync time", () => {
				dataSyncController.gotLastSyncTime({settingValue: new Date(2010, 1, 1, 1, 2, 11)});
				lastSyncTime.val().should.equal("1-Feb-2010 01:02:11");
			});
		});

		describe("without last sync time", () => {
			it("should display unknown", () => {
				dataSyncController.gotLastSyncTime({});
				lastSyncTime.val().should.equal("Unknown");
			});
		});

		afterEach(() => lastSyncTime.remove());
	});

	describe("gotDevice", () => {
		let deviceName,
				syncControls,
				importChangesOnly,
				importChangesOnlyRow,
				registrationMessage;

		beforeEach(() => {
			deviceName = $("<div>")
				.attr("id", "deviceName")
				.hide()
				.appendTo(document.body);

			syncControls = $("<div>")
				.attr("id", "syncControls")
				.hide()
				.appendTo(document.body);

			importChangesOnlyRow = $("<div>")
				.attr("id", "importChangesOnlyRow")
				.hide()
				.appendTo(document.body);

			importChangesOnly = $("<import type='checkbox'>")
				.attr("id", "importChangesOnly")
				.prop("checked", false)
				.hide()
				.appendTo(importChangesOnlyRow);

			registrationMessage = $("<div>")
				.attr("id", "registrationMessage")
				.hide()
				.appendTo(document.body);
		});

		describe("with device", () => {
			let device;

			beforeEach(() => (device = {name: "test-device"}));

			describe("first import", () => {
				beforeEach(() => dataSyncController.gotDevice({settingValue: JSON.stringify(device)}));

				it("should set the device", () => dataSyncController.device.should.deep.equal(device));
				it("should display the device name", () => deviceName.val().should.equal(device.name));
				it("should show the sync controls", () => syncControls.css("display").should.not.equal("none"));
				it("should not check the import changes only checkbox", () => importChangesOnly.prop("checked").should.be.false);
				it("should not show the import changes only row", () => importChangesOnlyRow.css("display").should.equal("none"));
				it("should not show the registration message", () => registrationMessage.css("display").should.equal("none"));
			});

			describe("subsequent import", () => {
				beforeEach(() => {
					device.imported = true;
					dataSyncController.gotDevice({settingValue: JSON.stringify(device)});
				});

				it("should set the device", () => dataSyncController.device.should.deep.equal(device));
				it("should display the device name", () => deviceName.val().should.equal(device.name));
				it("should show the sync controls", () => syncControls.css("display").should.not.equal("none"));
				it("should check the import changes only checkbox", () => importChangesOnly.prop("checked").should.be.true);
				it("should show the import changes only row", () => importChangesOnlyRow.css("display").should.not.equal("none"));
				it("should not show the registration message", () => registrationMessage.css("display").should.equal("none"));
			});
		});

		describe("without device", () => {
			beforeEach(() => dataSyncController.gotDevice({}));

			it("should not set the device", () => (Reflect.undefined === dataSyncController.device).should.be.true);
			it("should display unregistered", () => deviceName.val().should.equal("< Unregistered >"));
			it("should show the registration message", () => registrationMessage.css("display").should.not.equal("none"));
			it("should not show the sync controls", () => syncControls.css("display").should.equal("none"));
			it("should not check the import changes only checkbox", () => importChangesOnly.prop("checked").should.be.false);
			it("should not show the import changes only row", () => importChangesOnlyRow.css("display").should.equal("none"));
		});

		afterEach(() => {
			deviceName.remove();
			syncControls.remove();
			importChangesOnlyRow.remove();
			registrationMessage.remove();
		});
	});

	describe("checkForLocalChanges", () => {
		let localChanges;

		beforeEach(() => (localChanges = $("<div>")
			.attr("id", "localChanges")
			.hide()
			.appendTo(document.body)
		));

		describe("one change", () => {
			beforeEach(() => dataSyncController.checkForLocalChanges(1));

			it("should set the local changes flag", () => dataSyncController.localChanges.should.be.true);
			it("should display the number of changes", () => localChanges.val().should.equal("1 change pending"));
		});

		describe("multiple changes", () => {
			beforeEach(() => dataSyncController.checkForLocalChanges(2));

			it("should set the local changes flag", () => dataSyncController.localChanges.should.be.true);
			it("should display the number of changes", () => localChanges.val().should.equal("2 changes pending"));
		});

		describe("no changes", () => {
			beforeEach(() => dataSyncController.checkForLocalChanges(0));

			it("should not set the local changes flag", () => dataSyncController.localChanges.should.be.false);
			it("should display no pending changes", () => localChanges.val().should.equal("None pending"));
		});

		afterEach(() => localChanges.remove());
	});

	describe("dataExport", () => {
		it("should start an export", () => {
			sinon.stub(dataSyncController, "syncStart");
			dataSyncController.dataExport();
			dataSyncController.syncStart.should.have.been.calledWith("Export", "Are you sure you want to export?", sinon.match.func);
		});
	});

	describe("dataImport", () => {
		beforeEach(() => sinon.stub(dataSyncController, "syncStart"));

		describe("with local changes", () => {
			it("should start an import", () => {
				dataSyncController.localChanges = true;
				dataSyncController.dataImport();
				dataSyncController.syncStart.should.have.been.calledWith("Import", "Warning: Local changes have been made. Are you sure you want to import?", sinon.match.func);
			});
		});

		describe("without local changes", () => {
			it("should start an import", () => {
				dataSyncController.dataImport();
				dataSyncController.syncStart.should.have.been.calledWith("Import", "Are you sure you want to import?", sinon.match.func);
			});
		});
	});

	describe("syncStart", () => {
		let status;

		beforeEach(() => (status = $("<div>")
			.attr("id", "status")
			.hide()
			.appendTo(document.body)
		));

		describe("syncing", () => {
			it("should do nothing", () => {
				dataSyncController.syncing = true;
				dataSyncController.syncStart("Operation");
				status.val().should.equal("An operation is already running");
			});
		});

		describe("not syncing", () => {
			let progress,
					statusRow,
					callback;

			beforeEach(() => {
				sinon.stub(dataSyncController, "syncFinish");

				progress = $("<div>")
					.attr("id", "progress")
					.appendTo(document.body);

				statusRow = $("<div>")
					.attr("id", "statusRow")
					.hide()
					.appendTo(document.body);

				callback = sinon.stub();
			});

			describe("confirmed", () => {
				beforeEach(() => {
					window.confirm.returns(true);
					dataSyncController.syncStart("Operation", "prompt", callback);
				});

				it("should set the syncing flag", () => dataSyncController.syncing.should.be.true);
				it("should hide the progress", () => progress.css("display").should.equal("none"));
				it("should set the status", () => status.val().should.equal("Starting operation"));
				it("should show the status", () => status.css("display").should.not.equal("none"));
				it("should show the status row", () => statusRow.css("display").should.not.equal("none"));
				it("should prompt the user to confirm the operation", () => window.confirm.should.have.been.calledWith("prompt"));
				it("should invoke the sync callback", () => callback.should.have.been.called);
				it("should not finish the sync", () => dataSyncController.syncFinish.should.not.have.been.called);
			});

			describe("cancelled", () => {
				beforeEach(() => {
					window.confirm.returns(false);
					dataSyncController.syncStart("Operation", "prompt");
				});

				it("should set the syncing flag", () => dataSyncController.syncing.should.be.true);
				it("should hide the progress", () => progress.css("display").should.equal("none"));
				it("should show the status", () => status.css("display").should.not.equal("none"));
				it("should show the status row", () => statusRow.css("display").should.not.equal("none"));
				it("should prompt the user to confirm the operation", () => window.confirm.should.have.been.calledWith("prompt"));
				it("should not invoke the sync callback", () => callback.should.not.have.been.called);
				it("should set the status", () => status.val().should.equal("Operation aborted"));
				it("should finish the sync", () => dataSyncController.syncFinish.should.have.been.calledWith("Operation", false));
			});

			afterEach(() => {
				progress.remove();
				statusRow.remove();
			});
		});

		afterEach(() => status.remove());
	});

	describe("syncFinish", () => {
		let statusRow;

		beforeEach(() => (statusRow = $("<div>")
			.attr("id", "statusRow")
			.appendTo(document.body)
		));

		describe("successful", () => {
			beforeEach(() => dataSyncController.syncFinish("Sync", true));

			it("should hide the status row", () => statusRow.css("display").should.equal("none"));

			it("should display a notice to the user", () => appController.showNotice.should.have.been.calledWith({
				label: "Database has been successfully synced.",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should clear the syncing flag", () => dataSyncController.syncing.should.be.false);
		});

		describe("not successful", () => {
			beforeEach(() => dataSyncController.syncFinish("Sync", false));

			it("should not hide the status row", () => statusRow.css("display").should.not.equal("none"));

			it("should display a notice to the user", () => appController.showNotice.should.have.been.calledWith({
				label: "Sync failed.",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should clear the syncing flag", () => dataSyncController.syncing.should.be.false);
		});

		afterEach(() => statusRow.remove());
	});

	describe("doExport", () => {
		it("should get the list of local changes to be synced", () => {
			sinon.stub(dataSyncController, "listRetrieved");
			Sync.syncList.push({});
			dataSyncController.doExport();
			dataSyncController.listRetrieved.should.have.been.calledWith([{}]);
			Sync.syncList.pop();
		});
	});

	describe("listRetrieved", () => {
		let syncList,
				status,
				progress;

		beforeEach(() => {
			status = $("<div>")
				.attr("id", "status")
				.appendTo(document.body);

			progress = $("<progress>")
				.attr("id", "progress")
				.attr("max", 10)
				.val(5)
				.hide()
				.appendTo(document.body);

			syncList = [
				{action: "modified"},
				{action: "modified"},
				{action: "deleted"}
			];

			sinon.stub(dataSyncController, "sendChange");
			sinon.stub(dataSyncController, "sendDelete");
			dataSyncController.syncProcess = 1;
			dataSyncController.syncErrors = ["error"];
			dataSyncController.listRetrieved(syncList);
		});

		it("should reset the number of sync items processed", () => dataSyncController.syncProcessed.should.equal(0));
		it("should reset the sync errors", () => dataSyncController.syncErrors.should.be.empty);
		it("should set the list of changes to be sync", () => dataSyncController.syncList.should.equal(syncList));
		it("should hide the status", () => status.css("display").should.equal("none"));
		it("should reset the progress", () => progress.val().should.equal(0));
		it("should set the progress total", () => progress.attr("max").should.equal("3"));
		it("should show the progress", () => progress.css("display").should.not.equal("none"));

		it("should send any changes", () => {
			dataSyncController.sendChange.callCount.should.equal(2);
			dataSyncController.sendChange.should.have.been.calledWith({action: "modified"});
		});

		it("should send any deletes", () => {
			dataSyncController.sendDelete.callCount.should.equal(1);
			dataSyncController.sendDelete.should.have.been.calledWith({action: "deleted"});
		});

		afterEach(() => {
			status.remove();
			progress.remove();
		});
	});

	describe("sendChange", () => {
		let fakeServer,
				sync;

		beforeEach(() => {
			fakeServer = sinon.fakeServer.create();
			fakeServer.respondImmediately = true;
			sinon.stub(dataSyncController, "changeSent");
			sinon.stub(dataSyncController, "syncError");
			dataSyncController.device = {id: "test-device"};
		});

		["Program", "Series", "Episode"].forEach(type => {
			describe(type, () => {
				beforeEach(() => (sync = {
					type,
					id: 1,
					remove: sinon.stub()
				}));

				describe("success", () => {
					describe("hash match", () => {
						beforeEach(() => {
							fakeServer.respondWith("POST", "/documents", request => {
								request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
								request.requestBody.should.equal(JSON.stringify({type}));
								request.respond(200, {Etag: request.requestHeaders["Content-MD5"]});
							});

							dataSyncController.sendChange(sync);
						});

						it("should remove the sync record", () => sync.remove.should.have.been.called);
						it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
						it("should mark the change as sent", () => dataSyncController.changeSent.should.have.been.called);
					});

					describe("hash mismatch", () => {
						beforeEach(() => {
							fakeServer.respondWith("POST", "/documents", request => {
								request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
								request.requestBody.should.equal(JSON.stringify({type}));
								request.respond(200, {Etag: "bad-hash"});
							});

							dataSyncController.sendChange(sync);
						});

						it("should not remove the sync record", () => sync.remove.should.not.have.been.called);
						it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Checksum mismatch", type, "Expected: test-hash, got: bad-hash", 1));
						it("should mark the change as sent", () => dataSyncController.changeSent.should.have.been.called);
					});
				});

				describe("error", () => {
					beforeEach(() => {
						fakeServer.respondWith("POST", "/documents", request => {
							request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
							request.requestBody.should.equal(JSON.stringify({type}));
							request.respond(500, null, "Force failed");
						});

						dataSyncController.sendChange(sync);
					});

					it("should not remove the sync record", () => sync.remove.should.not.have.been.called);
					it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Send error", type, "error, 500 (Internal Server Error)", 1));
					it("should mark the change as sent", () => dataSyncController.changeSent.should.have.been.called);
				});
			});
		});

		afterEach(() => fakeServer.restore());
	});

	describe("sendDelete", () => {
		let fakeServer,
				sync;

		beforeEach(() => {
			fakeServer = sinon.fakeServer.create();
			fakeServer.respondImmediately = true;

			sync = {
				id: 1,
				type: "type",
				remove: sinon.stub()
			};

			sinon.stub(dataSyncController, "changeSent");
			sinon.stub(dataSyncController, "syncError");
			dataSyncController.device = {id: "test-device"};
		});

		describe("success", () => {
			beforeEach(() => {
				fakeServer.respondWith("DELETE", "/documents/1", request => {
					request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
					request.respond(200);
				});

				dataSyncController.sendDelete(sync);
			});

			it("should remove the sync record", () => sync.remove.should.have.been.called);
			it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
			it("should mark the delete as sent", () => dataSyncController.changeSent.should.have.been.called);
		});

		describe("error", () => {
			beforeEach(() => {
				fakeServer.respondWith("DELETE", "/documents/1", request => {
					request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
					request.respond(500, null, "Force failed");
				});

				dataSyncController.sendDelete(sync);
			});

			it("should not remove the sync record", () => sync.remove.should.not.have.been.called);
			it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Delete error", "type", "error, 500 (Internal Server Error)", 1));
			it("should mark the delete as sent", () => dataSyncController.changeSent.should.have.been.called);
		});

		afterEach(() => fakeServer.restore());
	});

	describe("changeSent", () => {
		let progress,
				syncErrors;

		beforeEach(() => {
			progress = $("<progress>")
				.attr("id", "progress")
				.attr("max", 3)
				.hide()
				.appendTo(document.body);

			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.appendTo(document.body);

			sinon.stub(dataSyncController, "setLastSyncTime");
			sinon.stub(dataSyncController, "checkForLocalChanges");
			sinon.stub(dataSyncController, "syncFinish");
			sinon.stub(dataSyncController, "showErrors");
			dataSyncController.syncProcessed = 0;
		});

		describe("not finished", () => {
			beforeEach(() => {
				dataSyncController.syncList = [{}, {}];
				dataSyncController.changeSent();
			});

			it("should increment the number of sync items processed", () => dataSyncController.syncProcessed.should.equal(1));
			it("should update the progress", () => progress.val().should.equal(1));
			it("should not update the last sync time", () => dataSyncController.setLastSyncTime.should.not.have.been.called);
			it("should not count how many local changes there are to be synced", () => dataSyncController.checkForLocalChanges.should.not.have.been.called);
			it("should not finish the sync", () => dataSyncController.syncFinish.should.not.have.been.called);
			it("should not show any errors", () => dataSyncController.showErrors.should.not.have.been.called);
		});

		describe("finished", () => {
			beforeEach(() => {
				Sync.syncList.push({});
				dataSyncController.syncList = [{}];
			});

			describe("without errors", () => {
				beforeEach(() => {
					dataSyncController.syncErrors = [];
					dataSyncController.changeSent();
				});

				it("should increment the number of sync items processed", () => dataSyncController.syncProcessed.should.equal(1));
				it("should update the progress", () => progress.val().should.equal(1));
				it("should update the last sync time", () => dataSyncController.setLastSyncTime.should.have.been.called);
				it("should count how many local changes there are to be synced", () => dataSyncController.checkForLocalChanges.should.have.been.calledWith(1));
				it("should hide the sync errors", () => syncErrors.css("display").should.equal("none"));
				it("should finish the sync", () => dataSyncController.syncFinish.should.have.been.calledWith("Export", true));
				it("should not show any errors", () => dataSyncController.showErrors.should.not.have.been.called);
			});

			describe("with errors", () => {
				beforeEach(() => {
					dataSyncController.syncErrors = [{}];
					dataSyncController.changeSent();
				});

				it("should increment the number of sync items processed", () => dataSyncController.syncProcessed.should.equal(1));
				it("should update the progress", () => progress.val().should.equal(1));
				it("should update the last sync time", () => dataSyncController.setLastSyncTime.should.have.been.called);
				it("should count how many local changes there are to be synced", () => dataSyncController.checkForLocalChanges.should.have.been.calledWith(1));
				it("should not hide the sync errors", () => syncErrors.css("display").should.not.equal("none"));
				it("should not finish the sync", () => dataSyncController.syncFinish.should.not.have.been.called);
				it("should show any errors", () => dataSyncController.showErrors.should.have.been.calledWith("Export"));
			});

			afterEach(() => Sync.syncList.pop());
		});

		afterEach(() => {
			progress.remove();
			syncErrors.remove();
		});
	});

	describe("setLastSyncTime", () => {
		let lastSyncTime;

		beforeEach(() => {
			const clock = sinon.useFakeTimers();

			lastSyncTime = new Date();
			sinon.stub(dataSyncController, "gotLastSyncTime");
			dataSyncController.setLastSyncTime();
			clock.restore();
		});

		it("should save the last sync time", () => Setting.prototype.save.should.have.been.called);

		it("should display the last sync time", () => dataSyncController.gotLastSyncTime.should.have.been.calledWith(sinon.match({
			settingName: "LastSyncTime",
			settingValue: lastSyncTime
		})));
	});

	describe("doImport", () => {
		let importChangesOnly;

		beforeEach(() => {
			importChangesOnly = $("<input type='checkbox'>")
				.attr("id", "importChangesOnly")
				.hide()
				.appendTo(document.body);

			sinon.stub(dataSyncController, "importData");
			sinon.stub(dataSyncController, "syncError");
			sinon.stub(dataSyncController, "importDone");
			dataSyncController.programsReady = false;
			dataSyncController.seriesReady = false;
			dataSyncController.episodesReady = false;
		});

		describe("fast import", () => {
			beforeEach(() => {
				importChangesOnly.prop("checked", true);
				dataSyncController.doImport();
			});

			it("should reset the sync errors", () => dataSyncController.syncErrors.should.be.empty);
			it("should check if fast import is selected", () => dataSyncController.importChangesOnly.should.be.true);

			it("should mark all models as ready", () => {
				dataSyncController.programsReady.should.be.true;
				dataSyncController.seriesReady.should.be.true;
				dataSyncController.episodesReady.should.be.true;
			});

			it("should start the import", () => dataSyncController.importData.should.have.been.calledOnce);
			it("should not add any errors to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
			it("should not mark the import as done", () => dataSyncController.importDone.should.not.have.been.called);
		});

		describe("full import", () => {
			beforeEach(() => importChangesOnly.prop("checked", false));

			describe("with errors", () => {
				beforeEach(() => {
					Program.removeAllFail();
					Series.removeAllFail();
					Episode.removeAllFail();
					dataSyncController.doImport();
				});

				it("should reset the sync errors", () => dataSyncController.syncErrors.should.be.empty);
				it("should check if fast import is selected", () => dataSyncController.importChangesOnly.should.be.false);
				it("should attempt to delete all existing programs", () => Program.removeAll.should.have.been.called);
				it("should attempt to delete all existing series", () => Series.removeAll.should.have.been.called);
				it("should attempt to delete all existing episodes", () => Episode.removeAll.should.have.been.called);

				it("should mark all models as ready", () => {
					dataSyncController.programsReady.should.be.true;
					dataSyncController.seriesReady.should.be.true;
					dataSyncController.episodesReady.should.be.true;
				});

				it("should add 3 errors to the errors list", () => {
					dataSyncController.syncError.callCount.should.equal(3);
					dataSyncController.syncError.should.have.been.calledWith("Delete error", "Program", "Force failed");
					dataSyncController.syncError.should.have.been.calledWith("Delete error", "Series", "Force failed");
					dataSyncController.syncError.should.have.been.calledWith("Delete error", "Episode", "Force failed");
				});

				it("should mark the import as done", () => dataSyncController.importDone.should.have.been.calledThrice);
			});

			describe("without errors", () => {
				beforeEach(() => {
					Program.removeAllOK();
					Series.removeAllOK();
					Episode.removeAllOK();
					dataSyncController.doImport();
				});

				it("should reset the sync errors", () => dataSyncController.syncErrors.should.be.empty);
				it("should check if fast import is selected", () => dataSyncController.importChangesOnly.should.be.false);
				it("should attempt to delete all existing programs", () => Program.removeAll.should.have.been.called);
				it("should attempt to delete all existing series", () => Series.removeAll.should.have.been.called);
				it("should attempt to delete all existing episodes", () => Episode.removeAll.should.have.been.called);

				it("should mark all models as ready", () => {
					dataSyncController.programsReady.should.be.true;
					dataSyncController.seriesReady.should.be.true;
					dataSyncController.episodesReady.should.be.true;
				});

				it("should start the import", () => dataSyncController.importData.should.have.been.calledThrice);
			});
		});

		afterEach(() => importChangesOnly.remove());
	});

	describe("importData", () => {
		beforeEach(() => {
			dataSyncController.objectsToImport = 1;
			dataSyncController.objectsImported = 1;
		});

		describe("models not ready", () => {
			it("should do nothing", () => {
				dataSyncController.programsReady = false;
				dataSyncController.importData();
				dataSyncController.objectsToImport.should.equal(1);
				dataSyncController.objectsImported.should.equal(1);
			});
		});

		describe("models ready", () => {
			const testParams = [
				{
					description: "fast import",
					importChangesOnly: true,
					resource: "pending"
				},
				{
					description: "full import",
					importChangesOnly: false,
					resource: "all"
				}
			];

			let fakeServer;

			beforeEach(() => {
				fakeServer = sinon.fakeServer.create();
				fakeServer.respondImmediately = true;
				sinon.stub(dataSyncController, "syncError");
				sinon.stub(dataSyncController, "importDone");
				sinon.stub(dataSyncController, "getImportData").callsFake(data => ({importJson: data.data, returnedHash: data.checksum}));
				dataSyncController.device = {id: "test-device"};
				dataSyncController.programsReady = true;
				dataSyncController.seriesReady = true;
				dataSyncController.episodesReady = true;
			});

			testParams.forEach(params => {
				describe(params.description, () => {
					beforeEach(() => (dataSyncController.importChangesOnly = params.importChangesOnly));

					describe("success", () => {
						describe("hash match", () => {
							describe("with data", () => {
								let status,
										progress;

								beforeEach(() => {
									fakeServer.respondWith("GET", `/documents/${params.resource}`, request => {
										request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
										request.respond(200, null, JSON.stringify({data: [{}, {}], checksum: "test-hash"}));
									});

									status = $("<div>")
										.attr("id", "status")
										.hide()
										.appendTo(document.body);

									progress = $("<progress>")
										.attr("id", "progress")
										.hide()
										.appendTo(document.body);

									sinon.stub(dataSyncController, "importObject");
									dataSyncController.importData();
								});

								it("should reset the number of objects imported", () => dataSyncController.objectsImported.should.equal(0));
								it("should set the number of objects to import", () => dataSyncController.objectsToImport.should.equal(2));
								it("should hide the status", () => status.css("display").should.equal("none"));
								it("should reset the progress", () => progress.val().should.equal(0));
								it("should set the progress total", () => progress.attr("max").should.equal("2"));
								it("should show the progress", () => progress.css("display").should.not.equal("none"));
								it("should process each object to import", () => dataSyncController.importObject.should.have.been.calledTwice);

								afterEach(() => {
									status.remove();
									progress.remove();
								});
							});

							describe("no data", () => {
								beforeEach(() => {
									fakeServer.respondWith("GET", `/documents/${params.resource}`, request => {
										request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
										request.respond(200, null, JSON.stringify({data: [], checksum: "test-hash"}));
									});

									dataSyncController.importData();
								});

								it("should reset the number of objects to import", () => dataSyncController.objectsToImport.should.equal(0));
								it("should reset the number of objects imported", () => dataSyncController.objectsImported.should.equal(0));

								if (params.importChangesOnly) {
									it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
								} else {
									it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Receive error", "Sync", "No data found"));
								}

								it("should mark the import as done", () => dataSyncController.importDone.should.have.been.called);
							});
						});

						describe("hash mismatch", () => {
							beforeEach(() => {
								fakeServer.respondWith("GET", `/documents/${params.resource}`, request => {
									request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
									request.respond(200, null, JSON.stringify({checksum: "bad-hash"}));
								});

								dataSyncController.importData();
							});

							it("should reset the number of objects to import", () => dataSyncController.objectsToImport.should.equal(0));
							it("should reset the number of objects imported", () => dataSyncController.objectsImported.should.equal(0));
							it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Checksum mismatch", "Sync", "Expected: test-hash, got: bad-hash"));
							it("should mark the import as done", () => dataSyncController.importDone.should.have.been.called);
						});
					});

					describe("error", () => {
						beforeEach(() => {
							fakeServer.respondWith("GET", `/documents/${params.resource}`, request => {
								request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
								request.respond(500, null, "Force failed");
							});

							dataSyncController.importData();
						});

						it("should reset the number of objects to import", () => dataSyncController.objectsToImport.should.equal(0));
						it("should reset the number of objects imported", () => dataSyncController.objectsImported.should.equal(0));
						it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Receive error", "Sync", "error, 500 (Internal Server Error)"));
						it("should mark the import as done", () => dataSyncController.importDone.should.have.been.called);
					});
				});
			});

			afterEach(() => fakeServer.restore());
		});
	});

	describe("getImportData", () => {
		const data = {},
					checksum = "test-hash",
					testParams = [
						{
							description: "200 OK, fast import",
							importChangesOnly: true,
							data,
							jqXHR: {getResponseHeader: sinon.stub().withArgs("Etag").returns("\"test-hash")}
						},
						{
							description: "200 OK, full import",
							importChangesOnly: false,
							data: {data, checksum}
						},
						{
							description: "304 Not Modified, fast import",
							importChangesOnly: true,
							jqXHR: {
								responseText: JSON.stringify(data),
								getResponseHeader: sinon.stub().withArgs("Etag").returns("\"test-hash")
							}
						},
						{
							description: "304 Not Modified, full import",
							importChangesOnly: false,
							jqXHR: {responseText: JSON.stringify({data, checksum})}
						}
					];

		testParams.forEach(params => {
			describe(params.description, () => {
				let result;

				beforeEach(() => {
					dataSyncController.importChangesOnly = params.importChangesOnly;
					result = dataSyncController.getImportData(params.data, params.jqXHR);
				});

				it("should return the object JSON", () => result.importJson.should.deep.equal(data));
				it("should return the checksum", () => result.returnedHash.should.equal(checksum));
			});
		});
	});

	describe("importObject", () => {
		const testParams = [
			{
				model: Program,
				doc: {
					type: "Program"
				},
				isPending: Reflect.undefined
			},
			{
				model: Series,
				doc: {
					type: "Series",
					pending: ["other-device"]
				},
				isPending: false
			},
			{
				model: Episode,
				doc: {
					type: "Episode",
					pending: ["test-device"]
				},
				isPending: true
			}
		];

		let callback;

		beforeEach(() => {
			dataSyncController.device = {id: "test-device"};
			callback = sinon.stub();
			sinon.stub(dataSyncController, "saveCallback").returns(callback);
		});

		testParams.forEach(params => {
			describe(params.doc.type, () => {
				beforeEach(() => (params.doc.id = 1));

				describe("deleted", () => {
					beforeEach(() => {
						params.doc.isDeleted = true;
						dataSyncController.importObject({doc: params.doc});
					});

					it("should create an instance from the JSON", () => params.model.fromJson.should.have.been.calledWith(params.doc));
					it("should remove the object", () => params.model.prototype.remove.should.have.been.called);
					it("should get the callback", () => dataSyncController.saveCallback.should.have.been.calledWith(params.doc.type, params.isPending));
					it("should invoke the callback", () => callback.should.have.been.calledWith(params.doc.id));
				});

				describe("created or updated", () => {
					beforeEach(() => {
						params.doc.isDeleted = false;
						dataSyncController.importObject({doc: params.doc});
					});

					it("should create an instance from the JSON", () => params.model.fromJson.should.have.been.calledWith(params.doc));
					it("should get the callback", () => dataSyncController.saveCallback.should.have.been.calledWith(params.doc.type, params.isPending));
					it("should save the object", () => params.model.prototype.save.should.have.been.calledWith(callback));
				});
			});
		});
	});

	describe("saveCallback", () => {
		let callback;

		beforeEach(() => {
			sinon.stub(dataSyncController, "dataImported");
			sinon.stub(dataSyncController, "removePending");
			sinon.stub(dataSyncController, "syncError");
			Sync.reset();
			callback = dataSyncController.saveCallback("type", true);
		});

		it("should return a function", () => callback.should.be.a("function"));

		describe("id supplied", () => {
			describe("pending", () => {
				describe("fast import", () => {
					beforeEach(() => {
						dataSyncController.importChangesOnly = true;
						callback(1);
					});

					it("should clear any sync record for the imported object", () => {
						Sync.syncList.pop().should.deep.equal({type: "type", id: 1});
						Sync.prototype.remove.should.have.been.called;
					});

					it("should clear the pending status for the imported object", () => dataSyncController.removePending.should.have.been.calledWith(1, "type"));
					it("should return early", () => dataSyncController.dataImported.should.not.have.been.called);
					it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
				});

				describe("full import", () => {
					beforeEach(() => {
						dataSyncController.importChangesOnly = false;
						callback(1);
					});

					it("should not clear any sync record for the imported object", () => {
						Sync.syncList.should.be.empty;
						Sync.prototype.remove.should.not.have.been.called;
					});

					it("should clear the pending status for the imported object", () => dataSyncController.removePending.should.have.been.calledWith(1, "type"));
					it("should return early", () => dataSyncController.dataImported.should.not.have.been.called);
					it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
				});
			});

			describe("not pending", () => {
				beforeEach(() => (callback = dataSyncController.saveCallback("type", false)));

				describe("fast import", () => {
					beforeEach(() => {
						dataSyncController.importChangesOnly = true;
						callback(1);
					});

					it("should clear any sync record for the imported object", () => {
						Sync.syncList.pop().should.deep.equal({type: "type", id: 1});
						Sync.prototype.remove.should.have.been.called;
					});

					it("should not clear the pending status for the imported object", () => dataSyncController.removePending.should.not.have.been.called);
					it("should not return early", () => dataSyncController.dataImported.should.have.been.called);
					it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
				});

				describe("full import", () => {
					beforeEach(() => {
						dataSyncController.importChangesOnly = false;
						callback(1);
					});

					it("should not clear any sync record for the imported object", () => {
						Sync.syncList.should.be.empty;
						Sync.prototype.remove.should.not.have.been.called;
					});

					it("should not clear the pending status for the imported object", () => dataSyncController.removePending.should.not.have.been.called);
					it("should not return early", () => dataSyncController.dataImported.should.have.been.called);
					it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
				});
			});
		});

		describe("no id supplied", () => {
			beforeEach(() => callback());

			it("should not clear any sync record for the imported object", () => {
				Sync.syncList.should.be.empty;
				Sync.prototype.remove.should.not.have.been.called;
			});

			it("should not clear the pending status for the imported object", () => dataSyncController.removePending.should.not.have.been.called);
			it("should not return early", () => dataSyncController.dataImported.should.have.been.called);
			it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Save error", "type", "Error saving type"));
		});
	});

	describe("removePending", () => {
		let fakeServer;

		beforeEach(() => {
			fakeServer = sinon.fakeServer.create();
			fakeServer.respondImmediately = true;

			sinon.stub(dataSyncController, "syncError");
			sinon.stub(dataSyncController, "dataImported");
			dataSyncController.device = {id: "test-device"};
		});

		describe("success", () => {
			beforeEach(() => {
				fakeServer.respondWith("DELETE", "/documents/1/pending", request => {
					request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
					request.respond(200);
				});

				dataSyncController.removePending(1, "type");
			});

			it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
			it("should continue processing", () => dataSyncController.dataImported.should.have.been.called);
		});

		describe("error", () => {
			beforeEach(() => {
				fakeServer.respondWith("DELETE", "/documents/1/pending", request => {
					request.requestHeaders["X-DEVICE-ID"].should.equal("test-device");
					request.respond(500, null, "Force failed");
				});

				dataSyncController.removePending(1, "type");
			});

			it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Save error", "type", "Error saving type"));
			it("should continue processing", () => dataSyncController.dataImported.should.have.been.called);
		});

		afterEach(() => fakeServer.restore());
	});

	describe("dataImported", () => {
		let progress;

		beforeEach(() => {
			sinon.stub(dataSyncController, "importDone");

			progress = $("<progress>")
				.attr("id", "progress")
				.hide()
				.appendTo(document.body);

			dataSyncController.objectsToImport = 2;
		});

		describe("not finished", () => {
			beforeEach(() => {
				dataSyncController.objectsImported = 0;
				dataSyncController.dataImported();
			});

			it("should increment the number of objects imported", () => dataSyncController.objectsImported.should.equal(1));
			it("should update the import progress", () => progress.val().should.equal(1));
			it("should not finalise the import", () => dataSyncController.importDone.should.not.have.been.called);
		});

		describe("finished", () => {
			beforeEach(() => {
				dataSyncController.objectsImported = 1;
				progress.attr("max", 3);
				dataSyncController.dataImported();
			});

			it("should increment the number of objects imported", () => dataSyncController.objectsImported.should.equal(2));
			it("should update the import progress", () => progress.val().should.equal(2));
			it("should not finalise the import", () => dataSyncController.importDone.should.have.been.called);
		});

		afterEach(() => progress.remove());
	});

	describe("importDone", () => {
		beforeEach(() => {
			sinon.stub(dataSyncController, "showErrors");
			sinon.stub(dataSyncController, "importSuccessful");
		});

		describe("models not ready", () => {
			it("should do nothing", () => {
				dataSyncController.programsReady = false;
				dataSyncController.importDone();
				dataSyncController.showErrors.should.not.have.been.called;
			});
		});

		describe("models ready", () => {
			beforeEach(() => {
				dataSyncController.programsReady = true;
				dataSyncController.seriesReady = true;
				dataSyncController.episodesReady = true;
			});

			describe("with errors", () => {
				beforeEach(() => {
					dataSyncController.syncErrors = [{}];
					dataSyncController.importDone();
				});

				it("should not mark the import as successful", () => dataSyncController.importSuccessful.should.not.have.been.called);
				it("should not clear all pending local changes", () => Sync.removeAll.should.not.have.been.called);
				it("should show the errors", () => dataSyncController.showErrors.should.have.been.calledWith("Import"));
			});

			describe("without errors", () => {
				beforeEach(() => (dataSyncController.syncErrors = []));

				describe("fast import", () => {
					beforeEach(() => {
						dataSyncController.importChangesOnly = true;
						dataSyncController.importDone();
					});

					it("should mark the import as successful", () => dataSyncController.importSuccessful.should.have.been.called);
					it("should not clear all pending local changes", () => Sync.removeAll.should.not.have.been.called);
					it("should not show any errors", () => dataSyncController.showErrors.should.not.have.been.called);
				});

				describe("full import", () => {
					beforeEach(() => (dataSyncController.importChangesOnly = false));

					describe("initial import", () => {
						beforeEach(() => {
							dataSyncController.device = {imported: false};
							dataSyncController.importDone();
						});

						it("should mark the device as having imported", () => {
							dataSyncController.device.imported.should.be.true;
							Setting.setting.should.deep.equal({name: "Device", value: JSON.stringify({imported: true})});
							Setting.prototype.save.should.have.been.called;
						});

						it("should clear all pending local changes", () => Sync.removeAll.should.have.been.calledWith(sinon.match.func));
						it("should not show any errors", () => dataSyncController.showErrors.should.not.have.been.called);
					});

					describe("subsequent import", () => {
						beforeEach(() => {
							Setting.prototype.save.reset();
							dataSyncController.device = {imported: true};
							dataSyncController.importDone();
						});

						it("should not mark the device as having imported", () => Setting.prototype.save.should.not.have.been.called);
						it("should clear all pending local changes", () => Sync.removeAll.should.have.been.calledWith(sinon.match.func));
						it("should not show any errors", () => dataSyncController.showErrors.should.not.have.been.called);
					});
				});
			});
		});
	});

	describe("pendingChangesCleared", () => {
		beforeEach(() => {
			sinon.stub(dataSyncController, "syncError");
			sinon.stub(dataSyncController, "showErrors");
			sinon.stub(dataSyncController, "importSuccessful");
		});

		describe("with error", () => {
			beforeEach(() => dataSyncController.pendingChangesCleared("error"));

			it("should add an error to the errors list", () => dataSyncController.syncError.should.have.been.calledWith("Delete error", "Sync", "error"));
			it("should show the errors", () => dataSyncController.showErrors.should.have.been.calledWith("Import"));
			it("should not mark the import as successful", () => dataSyncController.importSuccessful.should.not.have.been.called);
		});

		describe("without error", () => {
			beforeEach(() => dataSyncController.pendingChangesCleared());

			it("should not add an error to the errors list", () => dataSyncController.syncError.should.not.have.been.called);
			it("should not show the errors", () => dataSyncController.showErrors.should.not.have.been.called);
			it("should mark the import as successful", () => dataSyncController.importSuccessful.should.have.been.called);
		});
	});

	describe("importSuccessful", () => {
		let syncErrors;

		beforeEach(() => {
			sinon.stub(dataSyncController, "setLastSyncTime");
			sinon.stub(dataSyncController, "checkForLocalChanges");
			sinon.stub(dataSyncController, "syncFinish");
			Sync.syncList.push("");

			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.appendTo(document.body);

			dataSyncController.importSuccessful();
		});

		it("should update the last sync time", () => dataSyncController.setLastSyncTime.should.have.been.called);
		it("should update the number of local changes to be synced", () => dataSyncController.checkForLocalChanges.should.have.been.calledWith(1));
		it("should hide the errors container", () => syncErrors.css("display").should.equal("none"));
		it("should finish the sync", () => dataSyncController.syncFinish.should.have.been.calledWith("Import", true));

		afterEach(() => {
			syncErrors.remove();
			Sync.syncList.pop();
		});
	});

	describe("syncError", () => {
		beforeEach(() => (dataSyncController.syncErrors = []));

		describe("with id", () => {
			it("should append the error to the list", () => {
				dataSyncController.syncError("error", "type", "message", "id");
				const error = dataSyncController.syncErrors.pop();

				error.prop("tagName").should.equal("LI");
				error.html().should.equal("error<br>Type: type id<br>message");
			});
		});

		describe("without id", () => {
			it("should append the error to the list", () => {
				dataSyncController.syncError("error", "type", "message");
				const error = dataSyncController.syncErrors.pop();

				error.prop("tagName").should.equal("LI");
				error.html().should.equal("error<br>Type: type<br>message");
			});
		});
	});

	describe("showErrors", () => {
		let syncErrors,
				errorList;

		beforeEach(() => {
			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.hide()
				.appendTo(document.body);

			errorList = $("<div>")
				.attr("id", "errorList")
				.append($("<div>").attr("id", "oldError"))
				.css("position", "absolute")
				.offset({top: 20})
				.appendTo(syncErrors);

			sinon.stub(dataSyncController, "syncFinish");
			dataSyncController.syncErrors = $("<div>").attr("id", "newError");
			window.innerHeight = 50;
			dataSyncController.showErrors("Operation");
		});

		it("should clear any old errors", () => errorList.children("#oldError").length.should.equal(0));
		it("should add any new errors", () => errorList.children("#newError").length.should.equal(1));
		it("should display the errors container", () => syncErrors.css("display").should.not.equal("none"));
		it("should update the list height", () => errorList.height().should.equal(20));
		it("should finish the sync", () => dataSyncController.syncFinish.should.have.been.calledWith("Operation", false));

		afterEach(() => syncErrors.remove());
	});
});