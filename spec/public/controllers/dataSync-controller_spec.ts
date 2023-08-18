import type {
	Device,
	FullImport,
	ImportData,
	ImportDoc,
	ImportObject,
	NavButton,
	NavButtonEventHandler
} from "~/controllers";
import type {
	Model,
	ModelType,
	SerializedModel
} from "~/models";
import type {
	SinonMatcher,
	SinonStub
} from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import DataSyncController from "~/controllers/dataSync-controller";
import DataSyncView from "~/views/dataSync-view.html";
import EpisodeMock from "~/mocks/episode-model-mock";
import ProgramMock from "~/mocks/program-model-mock";
import SeriesMock from "~/mocks/series-model-mock";
import SettingMock from "~/mocks/setting-model-mock";
import SyncMock from "~/mocks/sync-model-mock";
import WindowMock from "~/mocks/window-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("DataSyncController", (): void => {
	let dataSyncController: DataSyncController;

	beforeEach((): DataSyncController => (dataSyncController = new DataSyncController()));

	describe("object constructor", (): void => {
		it("should return a DataSyncController instance", (): Chai.Assertion => expect(dataSyncController).to.be.an.instanceOf(DataSyncController));
	});

	describe("view", (): void => {
		it("should return the data sync view", (): Chai.Assertion => expect(dataSyncController.view).to.equal(DataSyncView));
	});

	describe("setup", (): void => {
		let leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "goBack" as keyof DataSyncController);
			sinon.stub(dataSyncController, "activate");
			await dataSyncController.setup();
			leftButton = dataSyncController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => expect(String(dataSyncController.header.label)).to.equal("Import/Export"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(dataSyncController["goBack"]).to.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => expect(String(leftButton.style)).to.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => expect(leftButton.label).to.equal("Settings"));

		it("should activate the controller", (): Chai.Assertion => expect(dataSyncController["activate"]).to.have.been.called);
	});

	describe("activate", (): void => {
		const lastSyncTimeSetting = new SettingMock("LastSyncTime", "1 Jan 2010"),
					device = new SettingMock("Device", "test-device");

		let registrationRow: HTMLDivElement,
				importButton: HTMLAnchorElement,
				exportButton: HTMLAnchorElement,
				localChanges: HTMLInputElement,
				lastSyncTime: HTMLInputElement;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "viewRegistration" as keyof DataSyncController);
			sinon.stub(dataSyncController, "dataImport" as keyof DataSyncController);
			sinon.stub(dataSyncController, "dataExport" as keyof DataSyncController);
			sinon.stub(dataSyncController, "gotDevice" as keyof DataSyncController);
			sinon.stub(dataSyncController, "checkForLocalChanges" as keyof DataSyncController);
			SettingMock.get.reset();
			SettingMock.get.withArgs("LastSyncTime").returns(lastSyncTimeSetting);
			SettingMock.get.withArgs("Device").returns(device);

			registrationRow = document.createElement("div");
			registrationRow.id = "registrationRow";

			importButton = document.createElement("a");
			importButton.id = "import";

			exportButton = document.createElement("a");
			exportButton.id = "export";

			localChanges = document.createElement("input");
			localChanges.id = "localChanges";

			lastSyncTime = document.createElement("input");
			lastSyncTime.id = "lastSyncTime";

			document.body.append(registrationRow, importButton, exportButton, localChanges, lastSyncTime);

			SyncMock.syncList = [new SyncMock(null, null)];
			await dataSyncController.activate();
		});

		it("should attach a registration click event handler", (): void => {
			registrationRow.dispatchEvent(new MouseEvent("click"));
			expect(dataSyncController["viewRegistration"]).to.have.been.called;
		});

		it("should attach an import click event handler", (): void => {
			importButton.dispatchEvent(new MouseEvent("click"));
			expect(dataSyncController["dataImport"]).to.have.been.called;
		});

		it("should attach an export click event handler", (): void => {
			exportButton.dispatchEvent(new MouseEvent("click"));
			expect(dataSyncController["dataExport"]).to.have.been.called;
		});

		it("should set the initial status message", (): Chai.Assertion => expect(localChanges.value).to.equal("Checking..."));
		it("should set the last sync time", (): Chai.Assertion => expect(lastSyncTime.value).to.equal("1-Jan-2010 00:00:00"));
		it("should get the registered device", (): Chai.Assertion => expect(dataSyncController["gotDevice"]).to.have.been.calledWith(device));
		it("should count how many local changes there are to be synced", (): Chai.Assertion => expect(dataSyncController["checkForLocalChanges"]).to.have.been.calledWith(1));

		afterEach((): void => {
			registrationRow.remove();
			importButton.remove();
			exportButton.remove();
			localChanges.remove();
			lastSyncTime.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await dataSyncController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("viewRegistration", (): void => {
		it("should push the registration view", async (): Promise<void> => {
			await dataSyncController["viewRegistration"]();
			expect(appController.pushView).to.have.been.calledWith("registration");
		});
	});

	describe("formatLastSyncTime", (): void => {
		describe("with last sync time", (): void => {
			it("should display the last sync time", (): void => {
				const settingValue = "1-Feb-2010 01:02:11";

				expect(dataSyncController["formatLastSyncTime"](new SettingMock(undefined, settingValue))).to.equal(settingValue);
			});
		});

		describe("without last sync time", (): void => {
			it("should display unknown", (): void => {
				expect(dataSyncController["formatLastSyncTime"](new SettingMock())).to.equal("Unknown");
			});
		});
	});

	describe("gotDevice", (): void => {
		let deviceName: HTMLInputElement,
				syncControls: HTMLElement,
				importChangesOnly: HTMLInputElement,
				importChangesOnlyRow: HTMLDivElement,
				registrationMessage: HTMLDivElement;

		beforeEach((): void => {
			deviceName = document.createElement("input");
			deviceName.id = "deviceName";

			syncControls = document.createElement("div");
			syncControls.id = "syncControls";
			syncControls.style.display = "none";

			importChangesOnly = document.createElement("input");
			importChangesOnly.type = "checkbox";
			importChangesOnly.id = "importChangesOnly";
			importChangesOnly.checked = false;

			importChangesOnlyRow = document.createElement("div");
			importChangesOnlyRow.id = "importChangesOnlyRow";
			importChangesOnlyRow.style.display = "none";
			importChangesOnlyRow.append(importChangesOnly);

			registrationMessage = document.createElement("div");
			registrationMessage.id = "registrationMessage";
			registrationMessage.style.display = "none";

			document.body.append(deviceName, syncControls, importChangesOnlyRow, registrationMessage);
		});

		describe("with device", (): void => {
			let device: Device;

			beforeEach((): Device => (device = { id: "1", name: "test-device", imported: false }));

			describe("first import", (): void => {
				beforeEach((): void => dataSyncController["gotDevice"](new SettingMock(undefined, JSON.stringify(device))));

				it("should set the device", (): Chai.Assertion => expect(dataSyncController["device"]).to.deep.equal(device));
				it("should display the device name", (): Chai.Assertion => expect(deviceName.value).to.equal(device.name));
				it("should show the sync controls", (): Chai.Assertion => expect(syncControls.style.display).to.not.equal("none"));
				it("should not check the import changes only checkbox", (): Chai.Assertion => expect(importChangesOnly.checked).to.be.false);
				it("should not show the import changes only row", (): Chai.Assertion => expect(importChangesOnlyRow.style.display).to.equal("none"));
				it("should not show the registration message", (): Chai.Assertion => expect(registrationMessage.style.display).to.equal("none"));
			});

			describe("subsequent import", (): void => {
				beforeEach((): void => {
					device.imported = true;
					dataSyncController["gotDevice"](new SettingMock(undefined, JSON.stringify(device)));
				});

				it("should set the device", (): Chai.Assertion => expect(dataSyncController["device"]).to.deep.equal(device));
				it("should display the device name", (): Chai.Assertion => expect(deviceName.value).to.equal(device.name));
				it("should show the sync controls", (): Chai.Assertion => expect(syncControls.style.display).to.not.equal("none"));
				it("should check the import changes only checkbox", (): Chai.Assertion => expect(importChangesOnly.checked).to.be.true);
				it("should show the import changes only row", (): Chai.Assertion => expect(importChangesOnlyRow.style.display).to.not.equal("none"));
				it("should not show the registration message", (): Chai.Assertion => expect(registrationMessage.style.display).to.equal("none"));
			});
		});

		describe("without device", (): void => {
			beforeEach((): void => dataSyncController["gotDevice"](new SettingMock()));

			it("should not set the device", (): Chai.Assertion => expect(dataSyncController["device"]).to.deep.equal({ id: "", name: "", imported: false }));
			it("should display unregistered", (): Chai.Assertion => expect(deviceName.value).to.equal("< Unregistered >"));
			it("should show the registration message", (): Chai.Assertion => expect(registrationMessage.style.display).to.not.equal("none"));
			it("should not show the sync controls", (): Chai.Assertion => expect(syncControls.style.display).to.equal("none"));
			it("should not check the import changes only checkbox", (): Chai.Assertion => expect(importChangesOnly.checked).to.be.false);
			it("should not show the import changes only row", (): Chai.Assertion => expect(importChangesOnlyRow.style.display).to.equal("none"));
		});

		afterEach((): void => {
			deviceName.remove();
			syncControls.remove();
			importChangesOnlyRow.remove();
			registrationMessage.remove();
		});
	});

	describe("checkForLocalChanges", (): void => {
		let localChanges: HTMLInputElement,
				exportButton: HTMLAnchorElement;

		beforeEach((): void => {
			localChanges = document.createElement("input");
			localChanges.id = "localChanges";

			exportButton = document.createElement("a");
			exportButton.id = "export";

			document.body.append(localChanges, exportButton);
		});

		describe("one change", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](1));

			it("should set the local changes flag", (): Chai.Assertion => expect(dataSyncController["isLocalChanges"]).to.be.true);
			it("should display the number of changes", (): Chai.Assertion => expect(localChanges.value).to.equal("1 change pending"));
			it("should enable the export button", (): Chai.Assertion => expect(exportButton.classList.contains("disabled")).to.be.false);
		});

		describe("multiple changes", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](2));

			it("should set the local changes flag", (): Chai.Assertion => expect(dataSyncController["isLocalChanges"]).to.be.true);
			it("should display the number of changes", (): Chai.Assertion => expect(localChanges.value).to.equal("2 changes pending"));
			it("should enable the export button", (): Chai.Assertion => expect(exportButton.classList.contains("disabled")).to.be.false);
		});

		describe("no changes", (): void => {
			beforeEach((): void => dataSyncController["checkForLocalChanges"](0));

			it("should not set the local changes flag", (): Chai.Assertion => expect(dataSyncController["isLocalChanges"]).to.be.false);
			it("should display no pending changes", (): Chai.Assertion => expect(localChanges.value).to.equal("None pending"));
			it("should disable the export button", (): Chai.Assertion => expect(exportButton.classList.contains("disabled")).to.be.true);
		});

		afterEach((): void => {
			exportButton.remove();
			localChanges.remove();
		});
	});

	describe("dataExport", (): void => {
		describe("with changes", (): void => {
			it("should start an export", (): void => {
				dataSyncController["isLocalChanges"] = true;
				sinon.stub(dataSyncController, "syncStart" as keyof DataSyncController);
				dataSyncController["dataExport"]();
				expect(dataSyncController["syncStart"]).to.have.been.calledWith("Export", "Are you sure you want to export?", sinon.match.func);
			});
		});

		describe("no changes", (): void => {
			it("should not start an export", (): void => {
				dataSyncController["isLocalChanges"] = false;
				sinon.stub(dataSyncController, "syncStart" as keyof DataSyncController);
				dataSyncController["dataExport"]();
				expect(dataSyncController["syncStart"]).to.not.have.been.called;
			});
		});
	});

	describe("dataImport", (): void => {
		beforeEach((): SinonStub => sinon.stub(dataSyncController, "syncStart" as keyof DataSyncController));

		describe("with local changes", (): void => {
			it("should start an import", (): void => {
				dataSyncController["isLocalChanges"] = true;
				dataSyncController["dataImport"]();
				expect(dataSyncController["syncStart"]).to.have.been.calledWith("Import", "Warning: Local changes have been made. Are you sure you want to import?", sinon.match.func);
			});
		});

		describe("without local changes", (): void => {
			it("should start an import", (): void => {
				dataSyncController["dataImport"]();
				expect(dataSyncController["syncStart"]).to.have.been.calledWith("Import", "Are you sure you want to import?", sinon.match.func);
			});
		});
	});

	describe("syncStart", (): void => {
		let status: HTMLInputElement;

		beforeEach((): void => {
			status = document.createElement("input");
			status.id = "status";
			document.body.append(status);
		});

		describe("syncing", (): void => {
			it("should do nothing", (): void => {
				dataSyncController["syncing"] = true;
				dataSyncController["syncStart"]("Import", "", sinon.stub());
				expect(status.value).to.equal("An import is already running");
			});
		});

		describe("not syncing", (): void => {
			let progress: HTMLProgressElement,
					statusRow: HTMLDivElement,
					callback: SinonStub;

			beforeEach((): void => {
				sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);

				progress = document.createElement("progress");
				progress.id = "progress";
				progress.style.display = "none";

				statusRow = document.createElement("div");
				statusRow.id = "statusRow";
				statusRow.style.display = "none";

				document.body.append(progress, statusRow);

				callback = sinon.stub();
			});

			describe("confirmed", (): void => {
				beforeEach((): void => {
					WindowMock.confirm.returns(true);
					dataSyncController["syncStart"]("Import", "prompt", callback);
				});

				it("should set the syncing flag", (): Chai.Assertion => expect(dataSyncController["syncing"]).to.be.true);
				it("should hide the progress", (): Chai.Assertion => expect(progress.style.display).to.equal("none"));
				it("should set the status", (): Chai.Assertion => expect(status.value).to.equal("Starting import"));
				it("should show the status", (): Chai.Assertion => expect(status.style.display).to.not.equal("none"));
				it("should show the status row", (): Chai.Assertion => expect(statusRow.style.display).to.not.equal("none"));
				it("should prompt the user to confirm the operation", (): Chai.Assertion => expect(WindowMock.confirm).to.have.been.calledWith("prompt"));
				it("should invoke the sync callback", (): Chai.Assertion => expect(callback).to.have.been.called);
				it("should not finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.not.have.been.called);
			});

			describe("cancelled", (): void => {
				beforeEach((): void => {
					WindowMock.confirm.returns(false);
					dataSyncController["syncStart"]("Import", "prompt", callback);
				});

				it("should set the syncing flag", (): Chai.Assertion => expect(dataSyncController["syncing"]).to.be.true);
				it("should hide the progress", (): Chai.Assertion => expect(progress.style.display).to.equal("none"));
				it("should show the status", (): Chai.Assertion => expect(status.style.display).to.not.equal("none"));
				it("should show the status row", (): Chai.Assertion => expect(statusRow.style.display).to.not.equal("none"));
				it("should prompt the user to confirm the operation", (): Chai.Assertion => expect(WindowMock.confirm).to.have.been.calledWith("prompt"));
				it("should not invoke the sync callback", (): Chai.Assertion => expect(callback).to.not.have.been.called);
				it("should set the status", (): Chai.Assertion => expect(status.value).to.equal("Import aborted"));
				it("should finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.have.been.calledWith("Import", false));
			});

			afterEach((): void => {
				progress.remove();
				statusRow.remove();
			});
		});

		afterEach((): void => status.remove());
	});

	describe("syncFinish", (): void => {
		let statusRow: HTMLDivElement;

		beforeEach((): void => {
			statusRow = document.createElement("div");
			statusRow.id = "statusRow";
			document.body.append(statusRow);
		});

		describe("successful", (): void => {
			beforeEach((): void => dataSyncController["syncFinish"]("Import", true));

			it("should hide the status row", (): Chai.Assertion => expect(statusRow.style.display).to.equal("none"));

			it("should display a notice to the user", (): Chai.Assertion => expect(appController.showNotice).to.have.been.calledWith({ label: "Database has been successfully imported." }));

			it("should clear the syncing flag", (): Chai.Assertion => expect(dataSyncController["syncing"]).to.be.false);
		});

		describe("not successful", (): void => {
			beforeEach((): void => dataSyncController["syncFinish"]("Import", false));

			it("should not hide the status row", (): Chai.Assertion => expect(statusRow.style.display).to.not.equal("none"));

			it("should display a notice to the user", (): Chai.Assertion => expect(appController.showNotice).to.have.been.calledWith({ label: "Import failed." }));

			it("should clear the syncing flag", (): Chai.Assertion => expect(dataSyncController["syncing"]).to.be.false);
		});

		afterEach((): void => statusRow.remove());
	});

	describe("doExport", (): void => {
		it("should get the list of local changes to be synced", async (): Promise<void> => {
			SyncMock.syncList = [new SyncMock(null, null)];
			sinon.stub(dataSyncController, "listRetrieved" as keyof DataSyncController);
			await dataSyncController["doExport"]();
			expect(dataSyncController["listRetrieved"]).to.have.been.calledWith(SyncMock.syncList);
		});
	});

	describe("listRetrieved", (): void => {
		let syncList: SyncMock[],
				status: HTMLInputElement,
				progress: HTMLProgressElement,
				sendChangeStub: SinonStub,
				sendDeleteStub: SinonStub;

		beforeEach(async (): Promise<void> => {
			status = document.createElement("input");
			status.id = "status";

			progress = document.createElement("progress");
			progress.id = "progress";
			progress.max = 10;
			progress.value = 5;
			progress.style.display = "none";

			document.body.append(status, progress);

			syncList = [
				new SyncMock(null, null, "modified"),
				new SyncMock(null, null, "modified"),
				new SyncMock(null, null, "deleted"),
				new SyncMock(null, null)
			];

			sendChangeStub = sinon.stub(dataSyncController, "sendChange" as keyof DataSyncController);
			sendDeleteStub = sinon.stub(dataSyncController, "sendDelete" as keyof DataSyncController);
			dataSyncController["syncProcessed"] = 1;
			dataSyncController["errors"] = [document.createElement("li")];
			await dataSyncController["listRetrieved"](syncList);
		});

		it("should reset the number of sync items processed", (): Chai.Assertion => expect(dataSyncController["syncProcessed"]).to.equal(0));
		it("should reset the sync errors", (): Chai.Assertion => expect(dataSyncController["errors"]).to.be.empty);
		it("should set the list of changes to be sync", (): Chai.Assertion => expect(dataSyncController["syncList"]).to.equal(syncList));
		it("should hide the status", (): Chai.Assertion => expect(status.style.display).to.equal("none"));
		it("should reset the progress", (): Chai.Assertion => expect(progress.value).to.equal(0));
		it("should set the progress total", (): Chai.Assertion => expect(progress.max).to.equal(4));
		it("should show the progress", (): Chai.Assertion => expect(progress.style.display).to.not.equal("none"));

		it("should send any changes", (): void => {
			expect(sendChangeStub.callCount).to.equal(2);
			expect(sendChangeStub).to.have.been.calledWith(sinon.match({ action: "modified" }));
		});

		it("should send any deletes", (): void => {
			expect(sendDeleteStub.callCount).to.equal(1);
			expect(sendDeleteStub).to.have.been.calledWith(sinon.match({ action: "deleted" }));
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

						it("should remove the sync record", (): Chai.Assertion => expect(sync.remove).to.have.been.called);
						it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
						it("should mark the change as sent", (): Chai.Assertion => expect(dataSyncController["changeSent"]).to.have.been.called);
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

				it("should not remove the sync record", (): Chai.Assertion => expect(sync.remove).to.not.have.been.called);
				it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Checksum mismatch", "Program", "Expected: test-hash, got: bad-hash", "1"));
				it("should mark the change as sent", (): Chai.Assertion => expect(dataSyncController["changeSent"]).to.have.been.called);
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

			it("should not remove the sync record", (): Chai.Assertion => expect(sync.remove).to.not.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Send error", "Program", "500 (Internal Server Error)", "1"));
			it("should mark the change as sent", (): Chai.Assertion => expect(dataSyncController["changeSent"]).to.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("find", (): void => {
		interface Scenario {
			type: ModelType | null;
			model?: typeof EpisodeMock | typeof ProgramMock | typeof SeriesMock;
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
			},
			{
				type: null
			}
		];

		let sync: SyncMock;

		beforeEach((): SyncMock => (sync = new SyncMock(null, "1")));

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.type ?? "invalid sync type", (): void => {
				let model: Model | undefined;

				beforeEach(async (): Promise<void> => {
					sync.type = scenario.type;
					model = await dataSyncController["find"](sync);
				});

				if (scenario.model) {
					it(`should lookup the ${scenario.type}`, (): Chai.Assertion => expect(model as Model).to.be.an.instanceOf(scenario.model));
				} else {
					it("should return undefined", (): Chai.Assertion => expect(model).to.be.undefined);
				}
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

			it("should remove the sync record", (): Chai.Assertion => expect(sync.remove).to.have.been.called);
			it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
			it("should mark the delete as sent", (): Chai.Assertion => expect(dataSyncController["changeSent"]).to.have.been.called);
		});

		describe("error", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("Force failed", {
					status: 500,
					statusText: "Internal Server Error"
				})));

				await dataSyncController["sendDelete"](sync);
			});

			it("should not remove the sync record", (): Chai.Assertion => expect(sync.remove).to.not.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Delete error", "Program", "500 (Internal Server Error)", "1"));
			it("should mark the delete as sent", (): Chai.Assertion => expect(dataSyncController["changeSent"]).to.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("changeSent", (): void => {
		let progress: HTMLProgressElement,
				syncErrors: HTMLElement;

		beforeEach((): void => {
			progress = document.createElement("progress");
			progress.id = "progress";
			progress.max = 3;

			syncErrors = document.createElement("section");
			syncErrors.id = "syncErrors";

			document.body.append(progress, syncErrors);

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

			it("should increment the number of sync items processed", (): Chai.Assertion => expect(dataSyncController["syncProcessed"]).to.equal(1));
			it("should update the progress", (): Chai.Assertion => expect(progress.value).to.equal(1));
			it("should not update the last sync time", (): Chai.Assertion => expect(dataSyncController["setLastSyncTime"]).to.not.have.been.called);
			it("should not count how many local changes there are to be synced", (): Chai.Assertion => expect(dataSyncController["checkForLocalChanges"]).to.not.have.been.called);
			it("should not finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.not.have.been.called);
			it("should not show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
		});

		describe("finished", (): void => {
			beforeEach((): void => {
				SyncMock.syncList = [new SyncMock(null, null)];
				dataSyncController["syncList"] = [new SyncMock(null, null)];
			});

			describe("without errors", (): void => {
				beforeEach(async (): Promise<void> => {
					dataSyncController["errors"] = [];
					await dataSyncController["changeSent"]();
				});

				it("should increment the number of sync items processed", (): Chai.Assertion => expect(dataSyncController["syncProcessed"]).to.equal(1));
				it("should update the progress", (): Chai.Assertion => expect(progress.value).to.equal(1));
				it("should update the last sync time", (): Chai.Assertion => expect(dataSyncController["setLastSyncTime"]).to.have.been.called);
				it("should count how many local changes there are to be synced", (): Chai.Assertion => expect(dataSyncController["checkForLocalChanges"]).to.have.been.calledWith(1));
				it("should hide the sync errors", (): Chai.Assertion => expect(syncErrors.style.display).to.equal("none"));
				it("should finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.have.been.calledWith("Export", true));
				it("should not show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
			});

			describe("with errors", (): void => {
				beforeEach(async (): Promise<void> => {
					dataSyncController["errors"] = [document.createElement("li")];
					await dataSyncController["changeSent"]();
				});

				it("should increment the number of sync items processed", (): Chai.Assertion => expect(dataSyncController["syncProcessed"]).to.equal(1));
				it("should update the progress", (): Chai.Assertion => expect(progress.value).to.equal(1));
				it("should update the last sync time", (): Chai.Assertion => expect(dataSyncController["setLastSyncTime"]).to.have.been.called);
				it("should count how many local changes there are to be synced", (): Chai.Assertion => expect(dataSyncController["checkForLocalChanges"]).to.have.been.calledWith(1));
				it("should not hide the sync errors", (): Chai.Assertion => expect(syncErrors.style.display).to.not.equal("none"));
				it("should not finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.not.have.been.called);
				it("should show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.have.been.calledWith("Export"));
			});
		});

		afterEach((): void => {
			progress.remove();
			syncErrors.remove();
		});
	});

	describe("setLastSyncTime", (): void => {
		let lastSyncTime: HTMLInputElement;

		beforeEach(async (): Promise<void> => {
			const clock = sinon.useFakeTimers();

			lastSyncTime = document.createElement("input");
			lastSyncTime.id = "lastSyncTime";

			document.body.append(lastSyncTime);

			clock.setSystemTime(new Date("2 Jan 2010"));
			await dataSyncController["setLastSyncTime"]();
			clock.restore();
		});

		it("should save the last sync time", (): Chai.Assertion => expect(SettingMock.prototype.save).to.have.been.called);

		it("should format the last sync time", (): Chai.Assertion => expect(lastSyncTime.value).to.equal("2-Jan-2010 00:00:00"));

		afterEach((): void => lastSyncTime.remove());
	});

	describe("doImport", (): void => {
		let importChangesOnly: HTMLInputElement,
				syncErrorStub: SinonStub;

		beforeEach((): void => {
			importChangesOnly = document.createElement("input");
			importChangesOnly.type = "checkbox";
			importChangesOnly.id = "importChangesOnly";
			document.body.append(importChangesOnly);

			sinon.stub(dataSyncController, "importData" as keyof DataSyncController);
			syncErrorStub = sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importDone" as keyof DataSyncController);
		});

		describe("fast import", (): void => {
			beforeEach(async (): Promise<void> => {
				importChangesOnly.checked = true;
				await dataSyncController["doImport"]();
			});

			it("should reset the sync errors", (): Chai.Assertion => expect(dataSyncController["errors"]).to.be.empty);
			it("should check if fast import is selected", (): Chai.Assertion => expect(dataSyncController["onlyImportChanges"]).to.be.true);
			it("should start the import", (): Chai.Assertion => expect(dataSyncController["importData"]).to.have.been.calledOnce);
			it("should not add any errors to the errors list", (): Chai.Assertion => expect(syncErrorStub).to.not.have.been.called);
			it("should not mark the import as done", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.not.have.been.called);
		});

		describe("full import", (): void => {
			beforeEach((): boolean => (importChangesOnly.checked = false));

			describe("with errors", (): void => {
				beforeEach(async (): Promise<void> => {
					ProgramMock.removeAllFail();
					SeriesMock.removeAllFail();
					EpisodeMock.removeAllFail();
					await dataSyncController["doImport"]();
				});

				it("should reset the sync errors", (): Chai.Assertion => expect(dataSyncController["errors"]).to.be.empty);
				it("should check if fast import is selected", (): Chai.Assertion => expect(dataSyncController["onlyImportChanges"]).to.be.false);
				it("should attempt to delete all existing programs", (): Chai.Assertion => expect(ProgramMock.removeAll).to.have.been.called);
				it("should attempt to delete all existing series", (): Chai.Assertion => expect(SeriesMock.removeAll).to.have.been.called);
				it("should attempt to delete all existing episodes", (): Chai.Assertion => expect(EpisodeMock.removeAll).to.have.been.called);

				it("should add 3 errors to the errors list", (): void => {
					expect(syncErrorStub.callCount).to.equal(3);
					expect(syncErrorStub).to.have.been.calledWith("Delete error", "Program", "Force failed");
					expect(syncErrorStub).to.have.been.calledWith("Delete error", "Series", "Force failed");
					expect(syncErrorStub).to.have.been.calledWith("Delete error", "Episode", "Force failed");
				});

				it("should mark the import as done", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.have.been.called);
			});

			describe("without errors", (): void => {
				beforeEach(async (): Promise<void> => {
					ProgramMock.removeAllOk();
					SeriesMock.removeAllOk();
					EpisodeMock.removeAllOk();
					await dataSyncController["doImport"]();
				});

				it("should reset the sync errors", (): Chai.Assertion => expect(dataSyncController["errors"]).to.be.empty);
				it("should check if fast import is selected", (): Chai.Assertion => expect(dataSyncController["onlyImportChanges"]).to.be.false);
				it("should attempt to delete all existing programs", (): Chai.Assertion => expect(ProgramMock.removeAll).to.have.been.called);
				it("should attempt to delete all existing series", (): Chai.Assertion => expect(SeriesMock.removeAll).to.have.been.called);
				it("should attempt to delete all existing episodes", (): Chai.Assertion => expect(EpisodeMock.removeAll).to.have.been.called);
				it("should start the import", (): Chai.Assertion => expect(dataSyncController["importData"]).to.have.been.called);
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
			resource: "all" | "pending";
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

		let importChangesOnly: HTMLInputElement,
				fakeFetch: SinonStub,
				fetchArgs: RequestInit;

		beforeEach((): void => {
			importChangesOnly = document.createElement("input");
			importChangesOnly.type = "checkbox";
			importChangesOnly.id = "importChangesOnly";
			document.body.append(importChangesOnly);

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
				beforeEach((): boolean => (importChangesOnly.checked = scenario.importChangesOnly));

				describe("success", (): void => {
					describe("hash match", (): void => {
						describe("with data", (): void => {
							let status: HTMLInputElement,
									progress: HTMLProgressElement;

							beforeEach(async (): Promise<void> => {
								fakeFetch.withArgs(`/documents/${scenario.resource}`, fetchArgs).returns(Promise.resolve(new Response(JSON.stringify({ data: [{}, {}], checksum: "test-hash" }), {
									status: 200,
									statusText: "OK",
									headers: {
										Etag: "test-hash"
									}
								})));

								status = document.createElement("input");
								status.id = "status";

								progress = document.createElement("progress");
								progress.id = "progress";
								progress.style.display = "none";

								document.body.append(status, progress);

								sinon.stub(dataSyncController, "importObject" as keyof DataSyncController);
								await dataSyncController["importData"]();
							});

							it("should reset the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(0));
							it("should set the number of objects to import", (): Chai.Assertion => expect(dataSyncController["objectsToImport"]).to.equal(2));
							it("should hide the status", (): Chai.Assertion => expect(status.style.display).to.equal("none"));
							it("should reset the progress", (): Chai.Assertion => expect(progress.value).to.equal(0));
							it("should set the progress total", (): Chai.Assertion => expect(progress.max).to.equal(2));
							it("should show the progress", (): Chai.Assertion => expect(progress.style.display).to.not.equal("none"));
							it("should process each object to import", (): Chai.Assertion => expect(dataSyncController["importObject"]).to.have.been.calledTwice);

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

							it("should reset the number of objects to import", (): Chai.Assertion => expect(dataSyncController["objectsToImport"]).to.equal(0));
							it("should reset the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(0));

							if (scenario.importChangesOnly) {
								it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
							} else {
								it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Receive error", "Sync", "No data found"));
							}

							it("should mark the import as done", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.have.been.called);
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

						it("should reset the number of objects to import", (): Chai.Assertion => expect(dataSyncController["objectsToImport"]).to.equal(0));
						it("should reset the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(0));
						it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Checksum mismatch", "Sync", "Expected: test-hash, got: bad-hash"));
						it("should mark the import as done", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.have.been.called);
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

					it("should reset the number of objects to import", (): Chai.Assertion => expect(dataSyncController["objectsToImport"]).to.equal(0));
					it("should reset the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(0));
					it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Receive error", "Sync", "500 (Internal Server Error)"));
					it("should mark the import as done", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.have.been.called);
				});
			});
		});

		afterEach((): void => {
			importChangesOnly.remove();
			fakeFetch.restore();
		});
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
				let result: ImportData,
						importChangesOnly: HTMLInputElement;

				beforeEach((): void => {
					importChangesOnly = document.createElement("input");
					importChangesOnly.type = "checkbox";
					importChangesOnly.id = "importChangesOnly";
					document.body.append(importChangesOnly);

					importChangesOnly.checked = scenario.importChangesOnly;
					result = dataSyncController["getImportData"](scenario.importData, scenario.eTag);
				});

				it("should return the object JSON", (): Chai.Assertion => expect(result.importJson).to.deep.equal(data));
				it("should return the checksum", (): Chai.Assertion => expect(result.returnedHash).to.equal(checksum));

				afterEach((): void => importChangesOnly.remove());
			});
		});
	});

	describe("importObject", (): void => {
		interface Scenario {
			model: typeof EpisodeMock | typeof ProgramMock | typeof SeriesMock;
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

					it("should create an instance from the JSON", (): Chai.Assertion => expect(scenario.model.fromJson).to.have.been.calledWith(scenario.doc));
					it("should remove the object", (): Chai.Assertion => expect(scenario.model.prototype.remove).to.have.been.called);
					it("should mark the object as saved", (): Chai.Assertion => expect(dataSyncController["objectSaved"]).to.have.been.calledWith(scenario.doc.id, scenario.doc.type, scenario.isPending));
				});

				describe("created or updated", (): void => {
					beforeEach(async (): Promise<void> => {
						scenario.doc.isDeleted = false;
						await dataSyncController["importObject"]({ doc: scenario.doc });
					});

					it("should create an instance from the JSON", (): Chai.Assertion => expect(scenario.model.fromJson).to.have.been.calledWith(scenario.doc));
					it("should save the object", (): Chai.Assertion => expect(scenario.model.prototype.save).to.have.been.called);
					it("should mark the object as saved", (): Chai.Assertion => expect(dataSyncController["objectSaved"]).to.have.been.calledWith(sinon.match.string, scenario.doc.type, scenario.isPending));
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
				it(`should convert the JSON to an instance of ${scenario.type}`, (): Chai.Assertion => expect(dataSyncController["jsonToModel"]({ type: scenario.type } as SerializedModel)).to.be.an.instanceOf(scenario.model));
			});
		});
	});

	describe("objectSaved", (): void => {
		let importChangesOnly: HTMLInputElement;

		beforeEach((): void => {
			importChangesOnly = document.createElement("input");
			importChangesOnly.type = "checkbox";
			importChangesOnly.id = "importChangesOnly";
			document.body.append(importChangesOnly);

			sinon.stub(dataSyncController, "dataImported" as keyof DataSyncController);
			sinon.stub(dataSyncController, "removePending" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncError" as keyof DataSyncController);
			SyncMock.reset();
		});

		describe("id supplied", (): void => {
			describe("pending", (): void => {
				describe("fast import", (): void => {
					beforeEach(async (): Promise<void> => {
						importChangesOnly.checked = true;
						await dataSyncController["objectSaved"]("1", "Program", true);
					});

					it("should clear any sync record for the imported object", (): Chai.Assertion => expect(SyncMock.prototype.remove).to.have.been.called);
					it("should clear the pending status for the imported object", (): Chai.Assertion => expect(dataSyncController["removePending"]).to.have.been.calledWith("1", "Program"));
					it("should return early", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.not.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
				});

				describe("full import", (): void => {
					beforeEach(async (): Promise<void> => {
						importChangesOnly.checked = false;
						await dataSyncController["objectSaved"]("1", "Program", true);
					});

					it("should not clear any sync record for the imported object", (): Chai.Assertion => expect(SyncMock.prototype.remove).to.not.have.been.called);
					it("should clear the pending status for the imported object", (): Chai.Assertion => expect(dataSyncController["removePending"]).to.have.been.calledWith("1", "Program"));
					it("should return early", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.not.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
				});
			});

			describe("not pending", (): void => {
				describe("fast import", (): void => {
					beforeEach(async (): Promise<void> => {
						importChangesOnly.checked = true;
						await dataSyncController["objectSaved"]("1", "Program", false);
					});

					it("should clear any sync record for the imported object", (): Chai.Assertion => expect(SyncMock.prototype.remove).to.have.been.called);
					it("should not clear the pending status for the imported object", (): Chai.Assertion => expect(dataSyncController["removePending"]).to.not.have.been.called);
					it("should not return early", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
				});

				describe("full import", (): void => {
					beforeEach(async (): Promise<void> => {
						importChangesOnly.checked = false;
						await dataSyncController["objectSaved"]("1", "Program", false);
					});

					it("should not clear any sync record for the imported object", (): void => {
						expect(SyncMock.syncList).to.be.empty;
						expect(SyncMock.prototype.remove).to.not.have.been.called;
					});

					it("should not clear the pending status for the imported object", (): Chai.Assertion => expect(dataSyncController["removePending"]).to.not.have.been.called);
					it("should not return early", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.have.been.called);
					it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
				});
			});
		});

		describe("no id supplied", (): void => {
			beforeEach(async (): Promise<void> => dataSyncController["objectSaved"](undefined, "Program", false));

			it("should not clear any sync record for the imported object", (): void => {
				expect(SyncMock.syncList).to.be.empty;
				expect(SyncMock.prototype.remove).to.not.have.been.called;
			});

			it("should not clear the pending status for the imported object", (): Chai.Assertion => expect(dataSyncController["removePending"]).to.not.have.been.called);
			it("should not return early", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.have.been.called);
			it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Save error", "Program", "Error saving program"));
		});

		afterEach((): void => importChangesOnly.remove());
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

			it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
			it("should continue processing", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.have.been.called);
		});

		describe("error", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(Promise.resolve(new Response("Force failed", {
					status: 500,
					statusText: "Internal Server Error"
				})));

				await dataSyncController["removePending"]("1", "Program");
			});

			it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Save error", "Program", "Error saving program"));
			it("should continue processing", (): Chai.Assertion => expect(dataSyncController["dataImported"]).to.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("dataImported", (): void => {
		let progress: HTMLProgressElement;

		beforeEach((): void => {
			sinon.stub(dataSyncController, "importDone" as keyof DataSyncController);

			progress = document.createElement("progress");
			progress.id = "progress";
			document.body.append(progress);

			dataSyncController["objectsToImport"] = 2;
		});

		describe("not finished", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["objectsImported"] = 0;
				await dataSyncController["dataImported"]();
			});

			it("should increment the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(1));
			it("should update the import progress", (): Chai.Assertion => expect(progress.value).to.equal(1));
			it("should not finalise the import", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.not.have.been.called);
		});

		describe("finished", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["objectsImported"] = 1;
				progress.max = 3;
				await dataSyncController["dataImported"]();
			});

			it("should increment the number of objects imported", (): Chai.Assertion => expect(dataSyncController["objectsImported"]).to.equal(2));
			it("should update the import progress", (): Chai.Assertion => expect(progress.value).to.equal(2));
			it("should not finalise the import", (): Chai.Assertion => expect(dataSyncController["importDone"]).to.have.been.called);
		});

		afterEach((): void => progress.remove());
	});

	describe("importDone", (): void => {
		beforeEach((): void => {
			sinon.stub(dataSyncController, "showErrors" as keyof DataSyncController);
			sinon.stub(dataSyncController, "importSuccessful" as keyof DataSyncController);
		});

		describe("with errors", (): void => {
			beforeEach(async (): Promise<void> => {
				dataSyncController["errors"] = [document.createElement("li")];
				await dataSyncController["importDone"]();
			});

			it("should not mark the import as successful", (): Chai.Assertion => expect(dataSyncController["importSuccessful"]).to.not.have.been.called);
			it("should not clear all pending local changes", (): Chai.Assertion => expect(SyncMock.removeAll).to.not.have.been.called);
			it("should show the errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.have.been.calledWith("Import"));
		});

		describe("without errors", (): void => {
			let importChangesOnly: HTMLInputElement;

			beforeEach((): void => {
				importChangesOnly = document.createElement("input");
				importChangesOnly.type = "checkbox";
				importChangesOnly.id = "importChangesOnly";
				document.body.append(importChangesOnly);

				dataSyncController["errors"] = [];
			});

			describe("fast import", (): void => {
				beforeEach(async (): Promise<void> => {
					importChangesOnly.checked = true;
					await dataSyncController["importDone"]();
				});

				it("should mark the import as successful", (): Chai.Assertion => expect(dataSyncController["importSuccessful"]).to.have.been.called);
				it("should not clear all pending local changes", (): Chai.Assertion => expect(SyncMock.removeAll).to.not.have.been.called);
				it("should not show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
			});

			describe("full import", (): void => {
				beforeEach((): boolean => (importChangesOnly.checked = false));

				describe("initial import", (): void => {
					beforeEach(async (): Promise<void> => {
						dataSyncController["device"] = { id: "", name: "", imported: false };
						await dataSyncController["importDone"]();
					});

					it("should mark the device as having imported", (): void => {
						expect(dataSyncController["device"].imported).to.be.true;
						expect(SettingMock.setting).to.deep.equal({ name: "Device", value: JSON.stringify({ id: "", name: "", imported: true }) });
						expect(SettingMock.prototype.save).to.have.been.called;
					});

					it("should clear all pending local changes", (): Chai.Assertion => expect(SyncMock.removeAll).to.have.been.called);
					it("should not show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
				});

				describe("subsequent import", (): void => {
					beforeEach(async (): Promise<void> => {
						SettingMock.prototype.save.reset();
						dataSyncController["device"] = { id: "", name: "", imported: true };
						await dataSyncController["importDone"]();
					});

					it("should not mark the device as having imported", (): Chai.Assertion => expect(SettingMock.prototype.save).to.not.have.been.called);
					it("should clear all pending local changes", (): Chai.Assertion => expect(SyncMock.removeAll).to.have.been.called);
					it("should not show any errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
				});
			});

			afterEach((): void => importChangesOnly.remove());
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

			it("should add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.have.been.calledWith("Delete error", "Sync", "error"));
			it("should show the errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.have.been.calledWith("Import"));
			it("should not mark the import as successful", (): Chai.Assertion => expect(dataSyncController["importSuccessful"]).to.not.have.been.called);
		});

		describe("without error", (): void => {
			beforeEach(async (): Promise<void> => dataSyncController["pendingChangesCleared"]());

			it("should not add an error to the errors list", (): Chai.Assertion => expect(dataSyncController["syncError"]).to.not.have.been.called);
			it("should not show the errors", (): Chai.Assertion => expect(dataSyncController["showErrors"]).to.not.have.been.called);
			it("should mark the import as successful", (): Chai.Assertion => expect(dataSyncController["importSuccessful"]).to.have.been.called);
		});
	});

	describe("importSuccessful", (): void => {
		let syncErrors: HTMLElement;

		beforeEach(async (): Promise<void> => {
			sinon.stub(dataSyncController, "setLastSyncTime" as keyof DataSyncController);
			sinon.stub(dataSyncController, "checkForLocalChanges" as keyof DataSyncController);
			sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);
			SyncMock.syncList = [new SyncMock(null, null)];

			syncErrors = document.createElement("section");
			syncErrors.id = "syncErrors";
			document.body.append(syncErrors);

			await dataSyncController["importSuccessful"]();
		});

		it("should update the last sync time", (): Chai.Assertion => expect(dataSyncController["setLastSyncTime"]).to.have.been.called);
		it("should update the number of local changes to be synced", (): Chai.Assertion => expect(dataSyncController["checkForLocalChanges"]).to.have.been.calledWith(1));
		it("should hide the errors container", (): Chai.Assertion => expect(syncErrors.style.display).to.equal("none"));
		it("should finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.have.been.calledWith("Import", true));

		afterEach((): void => syncErrors.remove());
	});

	describe("syncError", (): void => {
		beforeEach((): HTMLLIElement[] => (dataSyncController["errors"] = []));

		describe("with id", (): void => {
			it("should append the error to the list", (): void => {
				dataSyncController["syncError"]("Send error", "Program", "message", "id");
				const error = dataSyncController["errors"].pop() as HTMLLIElement;

				expect(error.tagName).to.equal("LI");
				expect(error.innerHTML).to.equal("Send error<br>Type: Program id<br>message");
			});
		});

		describe("without id", (): void => {
			it("should append the error to the list", (): void => {
				dataSyncController["syncError"]("Send error", "Program", "message");
				const error = dataSyncController["errors"].pop() as HTMLLIElement;

				expect(error.tagName).to.equal("LI");
				expect(error.innerHTML).to.equal("Send error<br>Type: Program<br>message");
			});
		});
	});

	describe("showErrors", (): void => {
		let syncErrors: HTMLElement,
				errorList: HTMLUListElement;

		beforeEach((): void => {
			const oldError = document.createElement("li"),
						newError = document.createElement("li");

			oldError.id = "oldError";
			newError.id = "newError";

			errorList = document.createElement("ul");
			errorList.id = "errorList";
			errorList.append(oldError);
			errorList.style.position = "absolute";
			errorList.style.margin = "0px";
			errorList.style.top = "20px";

			syncErrors = document.createElement("section");
			syncErrors.id = "syncErrors";
			syncErrors.style.display = "none";
			syncErrors.append(errorList);

			document.body.append(syncErrors);

			sinon.stub(dataSyncController, "syncFinish" as keyof DataSyncController);
			dataSyncController["errors"] = [newError];
			WindowMock.innerHeight = 50;
			dataSyncController["showErrors"]("Import");
		});

		it("should clear any old errors", (): Chai.Assertion => expect(errorList.querySelector("#oldError")).to.be.null);
		it("should add any new errors", (): Chai.Assertion => expect(errorList.querySelector("#newError")).to.not.be.null);
		it("should display the errors container", (): Chai.Assertion => expect(syncErrors.style.display).to.not.equal("none"));
		it("should update the list height", (): Chai.Assertion => expect(errorList.offsetHeight).to.equal(20));
		it("should finish the sync", (): Chai.Assertion => expect(dataSyncController["syncFinish"]).to.have.been.calledWith("Import", false));

		afterEach((): void => syncErrors.remove());
	});
});