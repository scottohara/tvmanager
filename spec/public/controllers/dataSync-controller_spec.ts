import {
	Device,
	FullImport,
	ImportData,
	ImportDoc,
	ImportObject,
	NavButton
} from "controllers";
import {
	Model,
	ModelType,
	SerializedModel
} from "models";
import sinon, {
	SinonFakeTimers,
	SinonMatcher,
	SinonStub
} from "sinon";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import DataSyncController from "controllers/dataSync-controller";
import DataSyncView from "views/dataSync-view.html";
import EpisodeMock from "mocks/episode-model-mock";
import ProgramMock from "mocks/program-model-mock";
import SeriesMock from "mocks/series-model-mock";
import SettingMock from "mocks/setting-model-mock";
import SyncMock from "mocks/sync-model-mock";
import WindowMock from "mocks/window-mock";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("DataSyncController", (): void => {
	let dataSyncController: DataSyncController;

	beforeEach((): DataSyncController => (dataSyncController = new DataSyncController()));

	describe("object constructor", (): void => {
		it("should return a DataSyncController instance", (): Chai.Assertion => dataSyncController.should.be.an.instanceOf(DataSyncController));
	});

	describe("view", (): void => {
		it("should return the data sync view", (): Chai.Assertion => dataSyncController.view.should.equal(DataSyncView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "goBack" as keyof DataSyncController);
			sinon.stub(dataSyncController, "activate");
			await dataSyncController.setup();
			leftButton = dataSyncController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(dataSyncController.header.label).should.equal("Import/Export"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			dataSyncController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Settings"));

		it("should activate the controller", (): Chai.Assertion => dataSyncController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		const lastSyncTime: SettingMock = new SettingMock("LastSyncTime", "1 Jan 2010"),
					device: SettingMock = new SettingMock("Device", "test-device");

		let registrationRow: JQuery,
				importButton: JQuery,
				exportButton: JQuery,
				localChanges: JQuery;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "viewRegistration" as keyof DataSyncController);
			sinon.stub(dataSyncController, "dataImport" as keyof DataSyncController);
			sinon.stub(dataSyncController, "dataExport" as keyof DataSyncController);
			sinon.stub(dataSyncController, "gotLastSyncTime" as keyof DataSyncController);
			sinon.stub(dataSyncController, "gotDevice" as keyof DataSyncController);
			sinon.stub(dataSyncController, "checkForLocalChanges" as keyof DataSyncController);
			SettingMock.get.reset();
			SettingMock.get.withArgs("LastSyncTime").returns(lastSyncTime);
			SettingMock.get.withArgs("Device").returns(device);

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

			SyncMock.syncList = [new SyncMock(null, null)];
			await dataSyncController.activate();
		});

		it("should attach a registration click event handler", (): void => {
			registrationRow.trigger("click");
			dataSyncController["viewRegistration"].should.have.been.called;
		});

		it("should attach an import click event handler", (): void => {
			importButton.trigger("click");
			dataSyncController["dataImport"].should.have.been.called;
		});

		it("should attach an export click event handler", (): void => {
			exportButton.trigger("click");
			dataSyncController["dataExport"].should.have.been.called;
		});

		it("should set the initial status message", (): Chai.Assertion => String(localChanges.val()).should.equal("Checking..."));
		it("should get the last sync time", (): Chai.Assertion => dataSyncController["gotLastSyncTime"].should.have.been.calledWith(lastSyncTime));
		it("should get the registered device", (): Chai.Assertion => dataSyncController["gotDevice"].should.have.been.calledWith(device));
		it("should count how many local changes there are to be synced", (): Chai.Assertion => dataSyncController["checkForLocalChanges"].should.have.been.calledWith(1));

		afterEach((): void => {
			registrationRow.remove();
			importButton.remove();
			exportButton.remove();
			localChanges.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await dataSyncController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewRegistration", (): void => {
		it("should push the registration view", async (): Promise<void> => {
			await dataSyncController["viewRegistration"]();
			appController.pushView.should.have.been.calledWith("registration");
		});
	});

	describe("gotLastSyncTime", (): void => {
		let lastSyncTime: JQuery;

		beforeEach((): JQuery => (lastSyncTime = $("<div>")
			.attr("id", "lastSyncTime")
			.hide()
			.appendTo(document.body)
		));

		describe("with last sync time", (): void => {
			it("should display the last sync time", (): void => {
				const settingValue = "1-Feb-2010 01:02:11";

				dataSyncController["gotLastSyncTime"](new SettingMock(undefined, settingValue));
				String(lastSyncTime.val()).should.equal(settingValue);
			});
		});

		describe("without last sync time", (): void => {
			it("should display unknown", (): void => {
				dataSyncController["gotLastSyncTime"](new SettingMock());
				String(lastSyncTime.val()).should.equal("Unknown");
			});
		});

		afterEach((): JQuery => lastSyncTime.remove());
	});

	describe("gotDevice", (): void => {
		let deviceName: JQuery,
				syncControls: JQuery,
				importChangesOnly: JQuery,
				importChangesOnlyRow: JQuery,
				registrationMessage: JQuery;

		beforeEach((): void => {
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

		describe("with device", (): void => {
			let device: Device;

			beforeEach((): Device => (device = { id: "1", name: "test-device", imported: false }));

			describe("first import", (): void => {
				beforeEach((): void => dataSyncController["gotDevice"](new SettingMock(undefined, JSON.stringify(device))));

				it("should set the device", (): Chai.Assertion => dataSyncController["device"].should.deep.equal(device));
				it("should display the device name", (): Chai.Assertion => String(deviceName.val()).should.equal(device.name));
				it("should show the sync controls", (): Chai.Assertion => syncControls.css("display").should.not.equal("none"));
				it("should not check the import changes only checkbox", (): Chai.Assertion => importChangesOnly.prop("checked").should.be.false);
				it("should not show the import changes only row", (): Chai.Assertion => importChangesOnlyRow.css("display").should.equal("none"));
				it("should not show the registration message", (): Chai.Assertion => registrationMessage.css("display").should.equal("none"));
			});

			describe("subsequent import", (): void => {
				beforeEach((): void => {
					device.imported = true;
					dataSyncController["gotDevice"](new SettingMock(undefined, JSON.stringify(device)));
				});

				it("should set the device", (): Chai.Assertion => dataSyncController["device"].should.deep.equal(device));
				it("should display the device name", (): Chai.Assertion => String(deviceName.val()).should.equal(device.name));
				it("should show the sync controls", (): Chai.Assertion => syncControls.css("display").should.not.equal("none"));
				it("should check the import changes only checkbox", (): Chai.Assertion => importChangesOnly.prop("checked").should.be.true);
				it("should show the import changes only row", (): Chai.Assertion => importChangesOnlyRow.css("display").should.not.equal("none"));
				it("should not show the registration message", (): Chai.Assertion => registrationMessage.css("display").should.equal("none"));
			});
		});

		describe("without device", (): void => {
			beforeEach((): void => dataSyncController["gotDevice"](new SettingMock()));

			it("should not set the device", (): Chai.Assertion => (undefined === dataSyncController["device"]).should.be.true);
			it("should display unregistered", (): Chai.Assertion => String(deviceName.val()).should.equal("< Unregistered >"));
			it("should show the registration message", (): Chai.Assertion => registrationMessage.css("display").should.not.equal("none"));
			it("should not show the sync controls", (): Chai.Assertion => syncControls.css("display").should.equal("none"));
			it("should not check the import changes only checkbox", (): Chai.Assertion => importChangesOnly.prop("checked").should.be.false);
			it("should not show the import changes only row", (): Chai.Assertion => importChangesOnlyRow.css("display").should.equal("none"));
		});

		afterEach((): void => {
			deviceName.remove();
			syncControls.remove();
			importChangesOnlyRow.remove();
			registrationMessage.remove();
		});
	});

	describe("checkForLocalChanges", (): void => {
		let localChanges: JQuery;

		beforeEach((): JQuery => (localChanges = $("<div>")
			.attr("id", "localChanges")
			.hide()
			.appendTo(document.body)
		));

		describe("one change", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](1));

			it("should set the local changes flag", (): Chai.Assertion => dataSyncController["localChanges"].should.be.true);
			it("should display the number of changes", (): Chai.Assertion => String(localChanges.val()).should.equal("1 change pending"));
		});

		describe("multiple changes", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](2));

			it("should set the local changes flag", (): Chai.Assertion => dataSyncController["localChanges"].should.be.true);
			it("should display the number of changes", (): Chai.Assertion => String(localChanges.val()).should.equal("2 changes pending"));
		});

		describe("no changes", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](0));

			it("should not set the local changes flag", (): Chai.Assertion => dataSyncController["localChanges"].should.be.false);
			it("should display no pending changes", (): Chai.Assertion => String(localChanges.val()).should.equal("None pending"));
		});

		afterEach((): JQuery => localChanges.remove());
	});

	describe("dataExport", (): void => {
		it("should start an export", (): void => {
			sinon.stub(dataSyncController, "syncStart" as keyof DataSyncController);
			dataSyncController["dataExport"]();
			dataSyncController["syncStart"].should.have.been.calledWith("Export", "Are you sure you want to export?", sinon.match.func);
		});
	});

	describe("dataImport", (): void => {
		beforeEach((): SinonStub => sinon.stub(dataSyncController, "syncStart" as keyof DataSyncController));

		describe("with local changes", (): void => {
			it("should start an import", (): void => {
				dataSyncController["localChanges"] = true;
				dataSyncController["dataImport"]();
				dataSyncController["syncStart"].should.have.been.calledWith("Import", "Warning: Local changes have been made. Are you sure you want to import?", sinon.match.func);
			});
		});

		describe("without local changes", (): void => {
			it("should start an import", (): void => {
				dataSyncController["dataImport"]();
				dataSyncController["syncStart"].should.have.been.calledWith("Import", "Are you sure you want to import?", sinon.match.func);
			});
		});
	});

	describe("syncStart", (): void => {
		let status: JQuery;

		beforeEach((): JQuery => (status = $("<div>")
			.attr("id", "status")
			.hide()
			.appendTo(document.body)
		));

		describe("syncing", (): void => {
			it("should do nothing", (): void => {
				dataSyncController["syncing"] = true;
				dataSyncController["syncStart"]("Import", "", sinon.stub());
				String(status.val()).should.equal("An import is already running");
			});
		});

		describe("not syncing", (): void => {
			let progress: JQuery,
					statusRow: JQuery,
					callback: SinonStub;

			beforeEach((): void => {
				sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);

				progress = $("<div>")
					.attr("id", "progress")
					.appendTo(document.body);

				statusRow = $("<div>")
					.attr("id", "statusRow")
					.hide()
					.appendTo(document.body);

				callback = sinon.stub();
			});

			describe("confirmed", (): void => {
				beforeEach((): void => {
					WindowMock.confirm.returns(true);
					dataSyncController["syncStart"]("Import", "prompt", callback);
				});

				it("should set the syncing flag", (): Chai.Assertion => dataSyncController["syncing"].should.be.true);
				it("should hide the progress", (): Chai.Assertion => progress.css("display").should.equal("none"));
				it("should set the status", (): Chai.Assertion => String(status.val()).should.equal("Starting import"));
				it("should show the status", (): Chai.Assertion => status.css("display").should.not.equal("none"));
				it("should show the status row", (): Chai.Assertion => statusRow.css("display").should.not.equal("none"));
				it("should prompt the user to confirm the operation", (): Chai.Assertion => WindowMock.confirm.should.have.been.calledWith("prompt"));
				it("should invoke the sync callback", (): Chai.Assertion => callback.should.have.been.called);
				it("should not finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.not.have.been.called);
			});

			describe("cancelled", (): void => {
				beforeEach((): void => {
					WindowMock.confirm.returns(false);
					dataSyncController["syncStart"]("Import", "prompt", callback);
				});

				it("should set the syncing flag", (): Chai.Assertion => dataSyncController["syncing"].should.be.true);
				it("should hide the progress", (): Chai.Assertion => progress.css("display").should.equal("none"));
				it("should show the status", (): Chai.Assertion => status.css("display").should.not.equal("none"));
				it("should show the status row", (): Chai.Assertion => statusRow.css("display").should.not.equal("none"));
				it("should prompt the user to confirm the operation", (): Chai.Assertion => WindowMock.confirm.should.have.been.calledWith("prompt"));
				it("should not invoke the sync callback", (): Chai.Assertion => callback.should.not.have.been.called);
				it("should set the status", (): Chai.Assertion => String(status.val()).should.equal("Import aborted"));
				it("should finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.have.been.calledWith("Import", false));
			});

			afterEach((): void => {
				progress.remove();
				statusRow.remove();
			});
		});

		afterEach((): JQuery => status.remove());
	});

	describe("syncFinish", (): void => {
		let statusRow: JQuery;

		beforeEach((): JQuery => (statusRow = $("<div>")
			.attr("id", "statusRow")
			.appendTo(document.body)
		));

		describe("successful", (): void => {
			beforeEach((): void => dataSyncController["syncFinish"]("Import", true));

			it("should hide the status row", (): Chai.Assertion => statusRow.css("display").should.equal("none"));

			it("should display a notice to the user", (): Chai.Assertion => appController.showNotice.should.have.been.calledWith({
				label: "Database has been successfully imported.",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should clear the syncing flag", (): Chai.Assertion => dataSyncController["syncing"].should.be.false);
		});

		describe("not successful", (): void => {
			beforeEach((): void => dataSyncController["syncFinish"]("Import", false));

			it("should not hide the status row", (): Chai.Assertion => statusRow.css("display").should.not.equal("none"));

			it("should display a notice to the user", (): Chai.Assertion => appController.showNotice.should.have.been.calledWith({
				label: "Import failed.",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should clear the syncing flag", (): Chai.Assertion => dataSyncController["syncing"].should.be.false);
		});

		afterEach((): JQuery => statusRow.remove());
	});

	describe("doExport", (): void => {
		it("should get the list of local changes to be synced", async (): Promise<void> => {
			SyncMock.syncList = [new SyncMock(null, null)];
			sinon.stub(dataSyncController, "listRetrieved" as keyof DataSyncController);
			await dataSyncController["doExport"]();
			dataSyncController["listRetrieved"].should.have.been.calledWith(SyncMock.syncList);
		});
	});

	describe("listRetrieved", (): void => {
		let syncList: SyncMock[],
				status: JQuery,
				progress: JQuery,
				sendChangeStub: SinonStub,
				sendDeleteStub: SinonStub;

		beforeEach(async (): Promise<void> => {
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
				new SyncMock(null, null, "modified"),
				new SyncMock(null, null, "modified"),
				new SyncMock(null, null, "deleted")
			];

			sendChangeStub = sinon.stub(dataSyncController, "sendChange" as keyof DataSyncController);
			sendDeleteStub = sinon.stub(dataSyncController, "sendDelete" as keyof DataSyncController);
			dataSyncController["syncProcessed"] = 1;
			dataSyncController["syncErrors"] = [$("<li>")];
			await dataSyncController["listRetrieved"](syncList);
		});

		it("should reset the number of sync items processed", (): Chai.Assertion => dataSyncController["syncProcessed"].should.equal(0));
		it("should reset the sync errors", (): Chai.Assertion => dataSyncController["syncErrors"].should.be.empty);
		it("should set the list of changes to be sync", (): Chai.Assertion => dataSyncController["syncList"].should.equal(syncList));
		it("should hide the status", (): Chai.Assertion => status.css("display").should.equal("none"));
		it("should reset the progress", (): Chai.Assertion => Number(progress.val()).should.equal(0));
		it("should set the progress total", (): Chai.Assertion => String(progress.attr("max")).should.equal("3"));
		it("should show the progress", (): Chai.Assertion => progress.css("display").should.not.equal("none"));

		it("should send any changes", (): void => {
			sendChangeStub.callCount.should.equal(2);
			sendChangeStub.should.have.been.calledWith(sinon.match({ action: "modified" }));
		});

		it("should send any deletes", (): void => {
			sendDeleteStub.callCount.should.equal(1);
			sendDeleteStub.should.have.been.calledWith(sinon.match({ action: "deleted" }));
		});

		afterEach((): void => {
			status.remove();
			progress.remove();
		});
	});

	describe("sendChange", (): void => {
		let fakeFetch: SinonStub,
				fetchArgs: [string, RequestInit],
				fakeModel: ProgramMock,
				sync: SyncMock;

		beforeEach((): void => {
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = [
				"/documents",
				{
					method: "POST",
					headers: {
						"Content-MD5": "test-hash",
						"X-DEVICE-ID": "test-device"
					},
					body: "{}"
				}
			];
			fakeModel = new ProgramMock(null, null);
			sinon.stub(dataSyncController, "changeSent" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "find" as keyof DataSyncController).returns(fakeModel);
			dataSyncController["device"] = { id: "test-device", name: "Test Device", imported: false };
			sync = new SyncMock("Program", "1");
		});

		describe("success", (): void => {
			describe("hash match", (): void => {
				interface Scenario {
					description: string;
					etag: string;
				}
				const scenarios: Scenario[] = [
					{
						description: "strong eTag",
						etag: "test-hash"
					},
					{
						description: "weak eTag",
						etag: "W/\"test-hash\""
					}
				];

				scenarios.forEach((scenario: Scenario): void => {
					describe(scenario.description, (): void => {
						beforeEach(async (): Promise<void> => {
							fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("", {
								status: 200,
								statusText: "OK",
								headers: {
									Etag: scenario.etag
								}
							})));

							await dataSyncController["sendChange"](sync);
						});

						it("should remove the sync record", (): Chai.Assertion => sync.remove.should.have.been.called);
						it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
						it("should mark the change as sent", (): Chai.Assertion => dataSyncController["changeSent"].should.have.been.called);
					});
				});
			});

			describe("hash mismatch", (): void => {
				beforeEach(async (): Promise<void> => {
					fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("", {
						status: 200,
						statusText: "OK",
						headers: {
							Etag: "bad-hash"
						}
					})));

					await dataSyncController["sendChange"](sync);
				});

				it("should not remove the sync record", (): Chai.Assertion => sync.remove.should.not.have.been.called);
				it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Checksum mismatch", "Program", "Expected: test-hash, got: bad-hash", "1"));
				it("should mark the change as sent", (): Chai.Assertion => dataSyncController["changeSent"].should.have.been.called);
			});
		});

		describe("error", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("Force failed", {
					status: 500,
					statusText: "Internal Server Error"
				})));

				await dataSyncController["sendChange"](sync);
			});

			it("should not remove the sync record", (): Chai.Assertion => sync.remove.should.not.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Send error", "Program", "500 (Internal Server Error)", "1"));
			it("should mark the change as sent", (): Chai.Assertion => dataSyncController["changeSent"].should.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("find", (): void => {
		interface Scenario {
			type: ModelType;
			model: typeof EpisodeMock | typeof ProgramMock | typeof SeriesMock;
		}
		const scenarios: Scenario[] = [
			{
				type: "Episode",
				model: EpisodeMock
			},
			{
				type: "Program",
				model: ProgramMock
			},
			{
				type: "Series",
				model: SeriesMock
			}
		];

		let sync: SyncMock;

		beforeEach((): SyncMock => (sync = new SyncMock(null, "1")));

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.type, (): void => {
				let model: Model;

				beforeEach(async (): Promise<void> => {
					sync.type = scenario.type;
					model = await dataSyncController["find"](sync);
				});

				it(`should lookup the ${scenario.type}`, (): Chai.Assertion => model.should.be.an.instanceOf(scenario.model));
			});
		});
	});

	describe("sendDelete", (): void => {
		let fakeFetch: SinonStub,
				fetchArgs: [SinonMatcher, RequestInit],
				sync: SyncMock;

		beforeEach((): void => {
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = [
				sinon.match(/\/documents\/\w+/u),
				{
					method: "DELETE",
					headers: {
						"X-DEVICE-ID": "test-device"
					}
				}
			];
			sync = new SyncMock("Program", "1");
			sinon.stub(dataSyncController, "changeSent" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			dataSyncController["device"] = { id: "test-device", name: "Test Device", imported: false };
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("", {
					status: 200,
					statusText: "OK"
				})));

				await dataSyncController["sendDelete"](sync);
			});

			it("should remove the sync record", (): Chai.Assertion => sync.remove.should.have.been.called);
			it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
			it("should mark the delete as sent", (): Chai.Assertion => dataSyncController["changeSent"].should.have.been.called);
		});

		describe("error", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("Force failed", {
					status: 500,
					statusText: "Internal Server Error"
				})));

				await dataSyncController["sendDelete"](sync);
			});

			it("should not remove the sync record", (): Chai.Assertion => sync.remove.should.not.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Delete error", "Program", "500 (Internal Server Error)", "1"));
			it("should mark the delete as sent", (): Chai.Assertion => dataSyncController["changeSent"].should.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("changeSent", (): void => {
		let progress: JQuery,
				syncErrors: JQuery;

		beforeEach((): void => {
			progress = $("<progress>")
				.attr("id", "progress")
				.attr("max", 3)
				.hide()
				.appendTo(document.body);

			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.appendTo(document.body);

			sinon.stub(dataSyncController, "setLastSyncTime" as keyof DataSyncController);
			sinon.stub(dataSyncController, "checkForLocalChanges" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);
			sinon.stub(dataSyncController, "showErrors" as keyof DataSyncController);
			dataSyncController["syncProcessed"] = 0;
		});

		describe("not finished", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["syncList"] = [
					new SyncMock(null, null),
					new SyncMock(null, null)
				];
				await dataSyncController["changeSent"]();
			});

			it("should increment the number of sync items processed", (): Chai.Assertion => dataSyncController["syncProcessed"].should.equal(1));
			it("should update the progress", (): Chai.Assertion => Number(progress.val()).should.equal(1));
			it("should not update the last sync time", (): Chai.Assertion => dataSyncController["setLastSyncTime"].should.not.have.been.called);
			it("should not count how many local changes there are to be synced", (): Chai.Assertion => dataSyncController["checkForLocalChanges"].should.not.have.been.called);
			it("should not finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.not.have.been.called);
			it("should not show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
		});

		describe("finished", (): void => {
			beforeEach((): void => {
				SyncMock.syncList = [new SyncMock(null, null)];
				dataSyncController["syncList"] = [new SyncMock(null, null)];
			});

			describe("without errors", (): void => {
				beforeEach(async (): Promise<void> => {
					dataSyncController["syncErrors"] = [];
					await dataSyncController["changeSent"]();
				});

				it("should increment the number of sync items processed", (): Chai.Assertion => dataSyncController["syncProcessed"].should.equal(1));
				it("should update the progress", (): Chai.Assertion => Number(progress.val()).should.equal(1));
				it("should update the last sync time", (): Chai.Assertion => dataSyncController["setLastSyncTime"].should.have.been.called);
				it("should count how many local changes there are to be synced", (): Chai.Assertion => dataSyncController["checkForLocalChanges"].should.have.been.calledWith(1));
				it("should hide the sync errors", (): Chai.Assertion => syncErrors.css("display").should.equal("none"));
				it("should finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.have.been.calledWith("Export", true));
				it("should not show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
			});

			describe("with errors", (): void => {
				beforeEach(async (): Promise<void> => {
					dataSyncController["syncErrors"] = [$("<li>")];
					await dataSyncController["changeSent"]();
				});

				it("should increment the number of sync items processed", (): Chai.Assertion => dataSyncController["syncProcessed"].should.equal(1));
				it("should update the progress", (): Chai.Assertion => Number(progress.val()).should.equal(1));
				it("should update the last sync time", (): Chai.Assertion => dataSyncController["setLastSyncTime"].should.have.been.called);
				it("should count how many local changes there are to be synced", (): Chai.Assertion => dataSyncController["checkForLocalChanges"].should.have.been.calledWith(1));
				it("should not hide the sync errors", (): Chai.Assertion => syncErrors.css("display").should.not.equal("none"));
				it("should not finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.not.have.been.called);
				it("should show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.have.been.calledWith("Export"));
			});
		});

		afterEach((): void => {
			progress.remove();
			syncErrors.remove();
		});
	});

	describe("setLastSyncTime", (): void => {
		let lastSyncTime: Date;

		beforeEach(async (): Promise<void> => {
			const clock: SinonFakeTimers = sinon.useFakeTimers();

			lastSyncTime = new Date();
			sinon.stub(dataSyncController, "gotLastSyncTime" as keyof DataSyncController);
			await dataSyncController["setLastSyncTime"]();
			clock.restore();
		});

		it("should save the last sync time", (): Chai.Assertion => SettingMock.prototype.save.should.have.been.called);

		it("should display the last sync time", (): Chai.Assertion => dataSyncController["gotLastSyncTime"].should.have.been.calledWith(sinon.match({
			settingName: "LastSyncTime",
			settingValue: String(lastSyncTime)
		})));
	});

	describe("doImport", (): void => {
		let importChangesOnly: JQuery,
				syncErrorStub: SinonStub;

		beforeEach((): void => {
			importChangesOnly = $("<input type='checkbox'>")
				.attr("id", "importChangesOnly")
				.hide()
				.appendTo(document.body);

			sinon.stub(dataSyncController, "importData" as keyof DataSyncController);
			syncErrorStub = sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importDone" as keyof DataSyncController);
		});

		describe("fast import", (): void => {
			beforeEach(async (): Promise<void> => {
				importChangesOnly.prop("checked", true);
				await dataSyncController["doImport"]();
			});

			it("should reset the sync errors", (): Chai.Assertion => dataSyncController["syncErrors"].should.be.empty);
			it("should check if fast import is selected", (): Chai.Assertion => dataSyncController["importChangesOnly"].should.be.true);
			it("should start the import", (): Chai.Assertion => dataSyncController["importData"].should.have.been.calledOnce);
			it("should not add any errors to the errors list", (): Chai.Assertion => syncErrorStub.should.not.have.been.called);
			it("should not mark the import as done", (): Chai.Assertion => dataSyncController["importDone"].should.not.have.been.called);
		});

		describe("full import", (): void => {
			beforeEach((): JQuery => importChangesOnly.prop("checked", false));

			describe("with errors", (): void => {
				beforeEach(async (): Promise<void> => {
					ProgramMock.removeAllFail();
					SeriesMock.removeAllFail();
					EpisodeMock.removeAllFail();
					await dataSyncController["doImport"]();
				});

				it("should reset the sync errors", (): Chai.Assertion => dataSyncController["syncErrors"].should.be.empty);
				it("should check if fast import is selected", (): Chai.Assertion => dataSyncController["importChangesOnly"].should.be.false);
				it("should attempt to delete all existing programs", (): Chai.Assertion => ProgramMock.removeAll.should.have.been.called);
				it("should attempt to delete all existing series", (): Chai.Assertion => SeriesMock.removeAll.should.have.been.called);
				it("should attempt to delete all existing episodes", (): Chai.Assertion => EpisodeMock.removeAll.should.have.been.called);

				it("should add 3 errors to the errors list", (): void => {
					syncErrorStub.callCount.should.equal(3);
					syncErrorStub.should.have.been.calledWith("Delete error", "Program", "Force failed");
					syncErrorStub.should.have.been.calledWith("Delete error", "Series", "Force failed");
					syncErrorStub.should.have.been.calledWith("Delete error", "Episode", "Force failed");
				});

				it("should mark the import as done", (): Chai.Assertion => dataSyncController["importDone"].should.have.been.called);
			});

			describe("without errors", (): void => {
				beforeEach(async (): Promise<void> => {
					ProgramMock.removeAllOK();
					SeriesMock.removeAllOK();
					EpisodeMock.removeAllOK();
					await dataSyncController["doImport"]();
				});

				it("should reset the sync errors", (): Chai.Assertion => dataSyncController["syncErrors"].should.be.empty);
				it("should check if fast import is selected", (): Chai.Assertion => dataSyncController["importChangesOnly"].should.be.false);
				it("should attempt to delete all existing programs", (): Chai.Assertion => ProgramMock.removeAll.should.have.been.called);
				it("should attempt to delete all existing series", (): Chai.Assertion => SeriesMock.removeAll.should.have.been.called);
				it("should attempt to delete all existing episodes", (): Chai.Assertion => EpisodeMock.removeAll.should.have.been.called);
				it("should start the import", (): Chai.Assertion => dataSyncController["importData"].should.have.been.called);
			});
		});

		afterEach((): void => {
			importChangesOnly.remove();
			ProgramMock.removeAll.reset();
			SeriesMock.removeAll.reset();
			EpisodeMock.removeAll.reset();
		});
	});

	describe("importData", (): void => {
		interface Scenario {
			description: string;
			importChangesOnly: boolean;
			resource: "pending" | "all";
		}
		const scenarios: Scenario[] = [
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

		let fakeFetch: SinonStub,
				fetchArgs: RequestInit;

		beforeEach((): void => {
			dataSyncController["objectsToImport"] = 1;
			dataSyncController["objectsImported"] = 1;
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = {
				headers: {
					"X-DEVICE-ID": "test-device"
				}
			};
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importDone" as keyof DataSyncController);
			sinon.stub(dataSyncController, "getImportData" as keyof DataSyncController).callsFake((data: FullImport): ImportData => ({ importJson: data.data, returnedHash: data.checksum }));
			dataSyncController["device"] = { id: "test-device", name: "Test Device", imported: false };
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): boolean => (dataSyncController["importChangesOnly"] = scenario.importChangesOnly));

				describe("success", (): void => {
					describe("hash match", (): void => {
						describe("with data", (): void => {
							let status: JQuery,
									progress: JQuery;

							beforeEach(async (): Promise<void> => {
								fakeFetch.withArgs(`/documents/${scenario.resource}`, fetchArgs).returns(Promise.resolve(new Response(JSON.stringify({ data: [{}, {}], checksum: "test-hash" }), {
									status: 200,
									statusText: "OK",
									headers: {
										Etag: "test-hash"
									}
								})));

								status = $("<div>")
									.attr("id", "status")
									.hide()
									.appendTo(document.body);

								progress = $("<progress>")
									.attr("id", "progress")
									.hide()
									.appendTo(document.body);

								sinon.stub(dataSyncController, "importObject" as keyof DataSyncController);
								await dataSyncController["importData"]();
							});

							it("should reset the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(0));
							it("should set the number of objects to import", (): Chai.Assertion => dataSyncController["objectsToImport"].should.equal(2));
							it("should hide the status", (): Chai.Assertion => status.css("display").should.equal("none"));
							it("should reset the progress", (): Chai.Assertion => Number(progress.val()).should.equal(0));
							it("should set the progress total", (): Chai.Assertion => String(progress.attr("max")).should.equal("2"));
							it("should show the progress", (): Chai.Assertion => progress.css("display").should.not.equal("none"));
							it("should process each object to import", (): Chai.Assertion => dataSyncController["importObject"].should.have.been.calledTwice);

							afterEach((): void => {
								status.remove();
								progress.remove();
							});
						});

						describe("no data", (): void => {
							beforeEach(async (): Promise<void> => {
								fakeFetch.withArgs(`/documents/${scenario.resource}`, fetchArgs).returns(Promise.resolve(new Response(JSON.stringify({ data: [], checksum: "test-hash" }), {
									status: 200,
									statusText: "OK",
									headers: {
										Etag: "test-hash"
									}
								})));

								await dataSyncController["importData"]();
							});

							it("should reset the number of objects to import", (): Chai.Assertion => dataSyncController["objectsToImport"].should.equal(0));
							it("should reset the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(0));

							if (scenario.importChangesOnly) {
								it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
							} else {
								it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Receive error", "Sync", "No data found"));
							}

							it("should mark the import as done", (): Chai.Assertion => dataSyncController["importDone"].should.have.been.called);
						});
					});

					describe("hash mismatch", (): void => {
						beforeEach(async (): Promise<void> => {
							fakeFetch.withArgs(`/documents/${scenario.resource}`, fetchArgs).returns(Promise.resolve(new Response(JSON.stringify({ checksum: "bad-hash" }), {
								status: 200,
								statusText: "OK",
								headers: {
									Etag: "test-hash"
								}
							})));

							await dataSyncController["importData"]();
						});

						it("should reset the number of objects to import", (): Chai.Assertion => dataSyncController["objectsToImport"].should.equal(0));
						it("should reset the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(0));
						it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Checksum mismatch", "Sync", "Expected: test-hash, got: bad-hash"));
						it("should mark the import as done", (): Chai.Assertion => dataSyncController["importDone"].should.have.been.called);
					});
				});

				describe("error", (): void => {
					beforeEach(async (): Promise<void> => {
						fakeFetch.withArgs(`/documents/${scenario.resource}`, fetchArgs).returns(Promise.resolve(new Response("Force failed", {
							status: 500,
							statusText: "Internal Server Error"
						})));

						await dataSyncController["importData"]();
					});

					it("should reset the number of objects to import", (): Chai.Assertion => dataSyncController["objectsToImport"].should.equal(0));
					it("should reset the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(0));
					it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Receive error", "Sync", "500 (Internal Server Error)"));
					it("should mark the import as done", (): Chai.Assertion => dataSyncController["importDone"].should.have.been.called);
				});
			});
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("getImportData", (): void => {
		interface Scenario {
			description: string;
			importChangesOnly: boolean;
			importData?: FullImport | ImportDoc[];
			eTag: string;
		}

		const data: ImportDoc[] = [],
					checksum = "test-hash",
					scenarios: Scenario[] = [
						{
							description: "fast import with strong etag",
							importChangesOnly: true,
							importData: data,
							eTag: "test-hash"
						},
						{
							description: "fast import with weak etag",
							importChangesOnly: true,
							importData: data,
							eTag: "W/\"test-hash\""
						},
						{
							description: "full import",
							importChangesOnly: false,
							importData: { data, checksum },
							eTag: "test-hash"
						}
					];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let result: ImportData;

				beforeEach((): void => {
					dataSyncController["importChangesOnly"] = scenario.importChangesOnly;
					result = dataSyncController["getImportData"](scenario.importData, scenario.eTag);
				});

				it("should return the object JSON", (): Chai.Assertion => result.importJson.should.deep.equal(data));
				it("should return the checksum", (): Chai.Assertion => result.returnedHash.should.equal(checksum));
			});
		});
	});

	describe("importObject", (): void => {
		interface Scenario {
			model: typeof ProgramMock | typeof SeriesMock | typeof EpisodeMock;
			doc: ImportObject;
			isPending?: boolean;
		}

		const scenarios: Scenario[] = [
			{
				model: ProgramMock,
				doc: {
					type: "Program",
					pending: [] as string[]
				} as ImportObject,
				isPending: false
			},
			{
				model: SeriesMock,
				doc: {
					type: "Series",
					pending: ["other-device"]
				} as ImportObject,
				isPending: false
			},
			{
				model: EpisodeMock,
				doc: {
					type: "Episode",
					pending: ["test-device"]
				} as ImportObject,
				isPending: true
			}
		];

		beforeEach((): void => {
			dataSyncController["device"] = { id: "test-device", name: "Test Device", imported: false };
			sinon.stub(dataSyncController, "objectSaved" as keyof DataSyncController);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.doc.type, (): void => {
				beforeEach((): string => (scenario.doc.id = "1"));

				describe("deleted", (): void => {
					beforeEach(async (): Promise<void> => {
						scenario.doc.isDeleted = true;
						await dataSyncController["importObject"]({ doc: scenario.doc });
					});

					it("should create an instance from the JSON", (): Chai.Assertion => scenario.model.fromJson.should.have.been.calledWith(scenario.doc));
					it("should remove the object", (): Chai.Assertion => scenario.model.prototype.remove.should.have.been.called);
					it("should mark the object as saved", (): Chai.Assertion => dataSyncController["objectSaved"].should.have.been.calledWith(scenario.doc.id, scenario.doc.type, scenario.isPending));
				});

				describe("created or updated", (): void => {
					beforeEach(async (): Promise<void> => {
						scenario.doc.isDeleted = false;
						await dataSyncController["importObject"]({ doc: scenario.doc });
					});

					it("should create an instance from the JSON", (): Chai.Assertion => scenario.model.fromJson.should.have.been.calledWith(scenario.doc));
					it("should save the object", (): Chai.Assertion => scenario.model.prototype.save.should.have.been.called);
					it("should mark the object as saved", (): Chai.Assertion => dataSyncController["objectSaved"].should.have.been.calledWith(sinon.match.string, scenario.doc.type, scenario.isPending));
				});
			});
		});
	});

	describe("jsonToModel", (): void => {
		interface Scenario {
			type: ModelType;
			model: typeof EpisodeMock | typeof ProgramMock | typeof SeriesMock;
		}

		const scenarios: Scenario[] = [
			{
				type: "Episode",
				model: EpisodeMock
			},
			{
				type: "Program",
				model: ProgramMock
			},
			{
				type: "Series",
				model: SeriesMock
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.type, (): void => {
				it(`should convert the JSON to an instance of ${scenario.type}`, (): Chai.Assertion => dataSyncController["jsonToModel"]({ type: scenario.type } as SerializedModel).should.be.an.instanceOf(scenario.model));
			});
		});
	});

	describe("objectSaved", (): void => {
		beforeEach((): void => {
			sinon.stub(dataSyncController, "dataImported" as keyof DataSyncController);
			sinon.stub(dataSyncController, "removePending" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			SyncMock.reset();
		});

		describe("id supplied", (): void => {
			describe("pending", (): void => {
				describe("fast import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["importChangesOnly"] = true;
						await dataSyncController["objectSaved"]("1", "Program", true);
					});

					it("should clear any sync record for the imported object", (): Chai.Assertion => SyncMock.prototype.remove.should.have.been.called);
					it("should clear the pending status for the imported object", (): Chai.Assertion => dataSyncController["removePending"].should.have.been.calledWith("1", "Program"));
					it("should return early", (): Chai.Assertion => dataSyncController["dataImported"].should.not.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
				});

				describe("full import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["importChangesOnly"] = false;
						await dataSyncController["objectSaved"]("1", "Program", true);
					});

					it("should not clear any sync record for the imported object", (): Chai.Assertion => SyncMock.prototype.remove.should.not.have.been.called);
					it("should clear the pending status for the imported object", (): Chai.Assertion => dataSyncController["removePending"].should.have.been.calledWith("1", "Program"));
					it("should return early", (): Chai.Assertion => dataSyncController["dataImported"].should.not.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
				});
			});

			describe("not pending", (): void => {
				describe("fast import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["importChangesOnly"] = true;
						await dataSyncController["objectSaved"]("1", "Program", false);
					});

					it("should clear any sync record for the imported object", (): Chai.Assertion => SyncMock.prototype.remove.should.have.been.called);
					it("should not clear the pending status for the imported object", (): Chai.Assertion => dataSyncController["removePending"].should.not.have.been.called);
					it("should not return early", (): Chai.Assertion => dataSyncController["dataImported"].should.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
				});

				describe("full import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["importChangesOnly"] = false;
						await dataSyncController["objectSaved"]("1", "Program", false);
					});

					it("should not clear any sync record for the imported object", (): void => {
						SyncMock.syncList.should.be.empty;
						SyncMock.prototype.remove.should.not.have.been.called;
					});

					it("should not clear the pending status for the imported object", (): Chai.Assertion => dataSyncController["removePending"].should.not.have.been.called);
					it("should not return early", (): Chai.Assertion => dataSyncController["dataImported"].should.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
				});
			});
		});

		describe("no id supplied", (): void => {
			beforeEach(async (): Promise<void> => dataSyncController["objectSaved"](undefined, "Program", false));

			it("should not clear any sync record for the imported object", (): void => {
				SyncMock.syncList.should.be.empty;
				SyncMock.prototype.remove.should.not.have.been.called;
			});

			it("should not clear the pending status for the imported object", (): Chai.Assertion => dataSyncController["removePending"].should.not.have.been.called);
			it("should not return early", (): Chai.Assertion => dataSyncController["dataImported"].should.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Save error", "Program", "Error saving program"));
		});
	});

	describe("removePending", (): void => {
		let fakeFetch: SinonStub,
				fetchArgs: [SinonMatcher, RequestInit];

		beforeEach((): void => {
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = [
				sinon.match(/\/documents\/\w+\/pending/u),
				{
					method: "DELETE",
					headers: {
						"X-DEVICE-ID": "test-device"
					}
				}
			];
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "dataImported" as keyof DataSyncController);
			dataSyncController["device"] = { id: "test-device", name: "Test Device", imported: false };
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("", {
					status: 200,
					statusText: "OK"
				})));

				await dataSyncController["removePending"]("1", "Program");
			});

			it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
			it("should continue processing", (): Chai.Assertion => dataSyncController["dataImported"].should.have.been.called);
		});

		describe("error", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("Force failed", {
					status: 500,
					statusText: "Internal Server Error"
				})));

				await dataSyncController["removePending"]("1", "Program");
			});

			it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Save error", "Program", "Error saving program"));
			it("should continue processing", (): Chai.Assertion => dataSyncController["dataImported"].should.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("dataImported", (): void => {
		let progress: JQuery;

		beforeEach((): void => {
			sinon.stub(dataSyncController, "importDone" as keyof DataSyncController);

			progress = $("<progress>")
				.attr("id", "progress")
				.hide()
				.appendTo(document.body);

			dataSyncController["objectsToImport"] = 2;
		});

		describe("not finished", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["objectsImported"] = 0;
				await dataSyncController["dataImported"]();
			});

			it("should increment the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(1));
			it("should update the import progress", (): Chai.Assertion => Number(progress.val()).should.equal(1));
			it("should not finalise the import", (): Chai.Assertion => dataSyncController["importDone"].should.not.have.been.called);
		});

		describe("finished", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["objectsImported"] = 1;
				progress.attr("max", 3);
				await dataSyncController["dataImported"]();
			});

			it("should increment the number of objects imported", (): Chai.Assertion => dataSyncController["objectsImported"].should.equal(2));
			it("should update the import progress", (): Chai.Assertion => Number(progress.val()).should.equal(2));
			it("should not finalise the import", (): Chai.Assertion => dataSyncController["importDone"].should.have.been.called);
		});

		afterEach((): JQuery => progress.remove());
	});

	describe("importDone", (): void => {
		beforeEach((): void => {
			sinon.stub(dataSyncController, "showErrors" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importSuccessful" as keyof DataSyncController);
		});

		describe("with errors", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["syncErrors"] = [$("<li>")];
				await dataSyncController["importDone"]();
			});

			it("should not mark the import as successful", (): Chai.Assertion => dataSyncController["importSuccessful"].should.not.have.been.called);
			it("should not clear all pending local changes", (): Chai.Assertion => SyncMock.removeAll.should.not.have.been.called);
			it("should show the errors", (): Chai.Assertion => dataSyncController["showErrors"].should.have.been.calledWith("Import"));
		});

		describe("without errors", (): void => {
			beforeEach((): JQuery[] => (dataSyncController["syncErrors"] = []));

			describe("fast import", (): void => {
				beforeEach(async (): Promise<void> => {
					dataSyncController["importChangesOnly"] = true;
					await dataSyncController["importDone"]();
				});

				it("should mark the import as successful", (): Chai.Assertion => dataSyncController["importSuccessful"].should.have.been.called);
				it("should not clear all pending local changes", (): Chai.Assertion => SyncMock.removeAll.should.not.have.been.called);
				it("should not show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
			});

			describe("full import", (): void => {
				beforeEach((): boolean => (dataSyncController["importChangesOnly"] = false));

				describe("initial import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["device"] = { id: "", name: "", imported: false };
						await dataSyncController["importDone"]();
					});

					it("should mark the device as having imported", (): void => {
						dataSyncController["device"].imported.should.be.true;
						SettingMock.setting.should.deep.equal({ name: "Device", value: JSON.stringify({ id: "", name: "", imported: true }) });
						SettingMock.prototype.save.should.have.been.called;
					});

					it("should clear all pending local changes", (): Chai.Assertion => SyncMock.removeAll.should.have.been.called);
					it("should not show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
				});

				describe("subsequent import", (): void => {
					beforeEach(async (): Promise<void> => {
						SettingMock.prototype.save.reset();
						dataSyncController["device"] = { id: "", name: "", imported: true };
						await dataSyncController["importDone"]();
					});

					it("should not mark the device as having imported", (): Chai.Assertion => SettingMock.prototype.save.should.not.have.been.called);
					it("should clear all pending local changes", (): Chai.Assertion => SyncMock.removeAll.should.have.been.called);
					it("should not show any errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
				});
			});
		});
	});

	describe("pendingChangesCleared", (): void => {
		beforeEach((): void => {
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "showErrors" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importSuccessful" as keyof DataSyncController);
		});

		describe("with error", (): void => {
			beforeEach(async (): Promise<void> => dataSyncController["pendingChangesCleared"]("error"));

			it("should add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.have.been.calledWith("Delete error", "Sync", "error"));
			it("should show the errors", (): Chai.Assertion => dataSyncController["showErrors"].should.have.been.calledWith("Import"));
			it("should not mark the import as successful", (): Chai.Assertion => dataSyncController["importSuccessful"].should.not.have.been.called);
		});

		describe("without error", (): void => {
			beforeEach(async (): Promise<void> => dataSyncController["pendingChangesCleared"]());

			it("should not add an error to the errors list", (): Chai.Assertion => dataSyncController["syncError"].should.not.have.been.called);
			it("should not show the errors", (): Chai.Assertion => dataSyncController["showErrors"].should.not.have.been.called);
			it("should mark the import as successful", (): Chai.Assertion => dataSyncController["importSuccessful"].should.have.been.called);
		});
	});

	describe("importSuccessful", (): void => {
		let syncErrors: JQuery;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "setLastSyncTime" as keyof DataSyncController);
			sinon.stub(dataSyncController, "checkForLocalChanges" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);
			SyncMock.syncList = [new SyncMock(null, null)];

			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.appendTo(document.body);

			await dataSyncController["importSuccessful"]();
		});

		it("should update the last sync time", (): Chai.Assertion => dataSyncController["setLastSyncTime"].should.have.been.called);
		it("should update the number of local changes to be synced", (): Chai.Assertion => dataSyncController["checkForLocalChanges"].should.have.been.calledWith(1));
		it("should hide the errors container", (): Chai.Assertion => syncErrors.css("display").should.equal("none"));
		it("should finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.have.been.calledWith("Import", true));

		afterEach((): JQuery => syncErrors.remove());
	});

	describe("syncError", (): void => {
		beforeEach((): JQuery[] => (dataSyncController["syncErrors"] = []));

		describe("with id", (): void => {
			it("should append the error to the list", (): void => {
				dataSyncController["syncError"]("Send error", "Program", "message", "id");
				const error: JQuery = dataSyncController["syncErrors"].pop() as JQuery;

				error.prop("tagName").should.equal("LI");
				error.html().should.equal("Send error<br>Type: Program id<br>message");
			});
		});

		describe("without id", (): void => {
			it("should append the error to the list", (): void => {
				dataSyncController["syncError"]("Send error", "Program", "message");
				const error: JQuery = dataSyncController["syncErrors"].pop() as JQuery;

				error.prop("tagName").should.equal("LI");
				error.html().should.equal("Send error<br>Type: Program<br>message");
			});
		});
	});

	describe("showErrors", (): void => {
		let syncErrors: JQuery,
				errorList: JQuery;

		beforeEach((): void => {
			syncErrors = $("<div>")
				.attr("id", "syncErrors")
				.hide()
				.appendTo(document.body);

			errorList = $("<div>")
				.attr("id", "errorList")
				.append($("<div>").attr("id", "oldError"))
				.css("position", "absolute")
				.offset({ top: 20 })
				.appendTo(syncErrors);

			sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);
			dataSyncController["syncErrors"] = [$("<li>").attr("id", "newError")];
			WindowMock.innerHeight = 50;
			dataSyncController["showErrors"]("Import");
		});

		it("should clear any old errors", (): Chai.Assertion => errorList.children("#oldError").length.should.equal(0));
		it("should add any new errors", (): Chai.Assertion => errorList.children("#newError").length.should.equal(1));
		it("should display the errors container", (): Chai.Assertion => syncErrors.css("display").should.not.equal("none"));
		it("should update the list height", (): Chai.Assertion => Number(errorList.height()).should.equal(20));
		it("should finish the sync", (): Chai.Assertion => dataSyncController["syncFinish"].should.have.been.calledWith("Import", false));

		afterEach((): JQuery => syncErrors.remove());
	});
});