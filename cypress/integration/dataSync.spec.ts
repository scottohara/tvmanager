import {
	aboutRow,
	importExportRow
} from "settings";
import {
	deviceName,
	exportButton,
	importButton,
	importChangesOnly,
	importChangesOnlyLabel,
	lastSyncTime,
	localChanges,
	registerDeviceName,
	registrationMessage,
	status,
	syncControls
} from "dataSync";
import {
	footerLabel,
	footerLeftButton,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	notices
} from "../support";
import {
	totalEpisodes,
	totalPrograms,
	totalSeries
} from "about";
import type { TestData } from "types";

describe("Import/Export", (): void => {
	before((): void => {
		cy.exec("RACK_ENV=test bundle exec rake db:recreate db:migrate");
		cy.createTestData({});
	});

	beforeEach((): void => {
		cy.visit("/");
		cy.get(footerRightButton).click();
		cy.get(importExportRow).click();
	});

	describe("header", (): void => {
		it("should show 'Import/Export' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Import/Export");
		});

		it("should navigate to the Settings view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Settings");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Settings");
		});
	});

	describe("content", (): void => {
		it("should navigate to the Register view when the device name is clicked", (): void => {
			cy.get(deviceName).click();
			cy.get(headerLeftButton).should("have.text", "Cancel");
			cy.get(headerLabel).should("have.text", "Register");
			cy.get(headerRightButton).should("have.text", "Save");
		});

		describe("when unregistered", (): void => {
			before((): void => {
				const data: TestData = {
					settings: [
						{ name: "Device", value: "" },
						{ name: "LastSyncTime", value: "" }
					]
				};

				cy.createTestData(data);
			});

			it("should show the device as unregistered", (): Cypress.Chainable<JQuery> => cy.get(deviceName).should("have.value", "< Unregistered >"));
			it("should show the registration message", (): Cypress.Chainable<JQuery> => cy.get(registrationMessage).should("be.visible"));
			it("should not show the sync controls", (): Cypress.Chainable<JQuery> => cy.get(syncControls).should("not.be.visible"));

			it("should not register the device if the registration is cancelled", (): void => {
				cy.get(deviceName).click();
				cy.get(registerDeviceName).clear().type("Cancelled device registration");
				cy.get(headerLeftButton).click();
				cy.get(deviceName).should("have.value", "< Unregistered >");
			});

			it("should register the device if the registration is saved", (): void => {
				cy.get(deviceName).click();
				cy.get(registerDeviceName).clear().type("Test device");
				cy.get(headerRightButton).click();
				cy.get(deviceName).should("have.value", "Test device");
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(importChangesOnlyLabel).should("not.be.visible");
			});
		});

		describe("when registered", (): void => {
			before((): void => {
				const data: TestData = { programs: [{ series: [] }], settings: [{ name: "LastSyncTime", value: "2000-01-01T09:30:20" }] };

				cy.createTestData(data);
				cy.exec("RACK_ENV=test bundle exec rake db:authorise_devices");
			});

			it("should show the name of the device", (): Cypress.Chainable<JQuery> => cy.get(deviceName).should("have.value", "Test device"));
			it("should show the last sync time", (): Cypress.Chainable<JQuery> => cy.get(lastSyncTime).should("have.value", "1-Jan-2000 09:30:20"));
			it("should show the number of pending changes when there are pending changes", (): Cypress.Chainable<JQuery> => cy.get(localChanges).should("have.value", "1 change pending"));

			it("should show the database version as the label", (): void => {
				cy.get(deviceName).click();
				cy.get(footerLabel).should("have.text", "v1");
			});

			it("should show an unregister button", (): void => {
				cy.get(deviceName).click();
				cy.get(footerLeftButton).should("have.text", "Unregister");
			});

			it("should not update the registered device if the changes are cancelled", (): void => {
				cy.get(deviceName).click();
				cy.get(registerDeviceName).clear().type("Cancelled device update");
				cy.get(headerLeftButton).click();
				cy.get(deviceName).should("have.value", "Test device");
			});

			it("should update registered device if the changes are saved", (): void => {
				cy.get(deviceName).click();
				cy.get(registerDeviceName).clear().type("Updated test device");
				cy.get(headerRightButton).click();
				cy.get(deviceName).should("have.value", "Updated test device");
			});
		});

		describe("export", (): void => {
			before((): void => {
				const data: TestData = { programs: [{ series: [{ episodes: [{}] }] }], settings: [{ name: "LastSyncTime", value: "2000-01-01T09:30:20" }] };

				cy.createTestData(data);
			});

			it("should do nothing if the export is not confirmed", (): void => {
				cy.get(lastSyncTime).should("have.value", "1-Jan-2000 09:30:20");
				cy.get(localChanges).should("have.value", "3 changes pending");
				cy.on("window:confirm", (): boolean => false);
				cy.get(exportButton).should("not.have.class", "disabled");
				cy.get(exportButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Export failed.");
				cy.get(lastSyncTime).should("have.value", "1-Jan-2000 09:30:20");
				cy.get(localChanges).should("have.value", "3 changes pending");
				cy.get(exportButton).should("not.have.class", "disabled");
				cy.get(status).should("have.value", "Export aborted");
			});

			it("should export all pending changes", (): void => {
				cy.get(lastSyncTime).should("have.value", "1-Jan-2000 09:30:20");
				cy.get(localChanges).should("have.value", "3 changes pending");
				cy.clock(new Date("2000-01-02T10:20:04"));
				cy.get(exportButton).should("not.have.class", "disabled");
				cy.get(exportButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Database has been successfully exported");
				cy.get(lastSyncTime).should("contain.value", "2-Jan-2000 10:20:04");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(exportButton).should("have.class", "disabled");
			});
		});

		describe("full import", (): void => {
			before((): void => cy.createTestData({}));

			it("should do nothing if the import is not confirmed", (): void => {
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.on("window:confirm", (): boolean => false);
				cy.get(importButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Import failed.");
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(status).should("have.value", "Import aborted");
				cy.get(headerLeftButton).click();
				cy.get(aboutRow).click();
				cy.get(totalPrograms).should("have.value", "0");
				cy.get(totalSeries).should("have.value", "0");
				cy.get(totalEpisodes).should("have.value", "0 (0% watched)");
			});

			it("should import all documents", (): void => {
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(importChangesOnly).should("not.be.checked");
				cy.clock(new Date("2000-01-02T10:20:04"));
				cy.get(importButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Database has been successfully imported");
				cy.get(lastSyncTime).should("contain.value", "2-Jan-2000 10:20:04");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(headerLeftButton).click();
				cy.get(aboutRow).click();
				cy.get(totalPrograms).should("have.value", "1");
				cy.get(totalSeries).should("have.value", "1");
				cy.get(totalEpisodes).should("have.value", "1 (0.00% watched)");
			});
		});

		describe("fast import", (): void => {
			before((): void => {
				cy.createTestData({});
				cy.exec("RACK_ENV=test bundle exec rake db:make_pending'[0-0-0]'");
			});

			it("should do nothing if the import is not confirmed", (): void => {
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.on("window:confirm", (): boolean => false);
				cy.get(importButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Import failed.");
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(status).should("have.value", "Import aborted");
				cy.get(headerLeftButton).click();
				cy.get(aboutRow).click();
				cy.get(totalPrograms).should("have.value", "0");
				cy.get(totalSeries).should("have.value", "0");
				cy.get(totalEpisodes).should("have.value", "0 (0% watched)");
			});

			it("should import any documents pending for this device", (): void => {
				cy.get(lastSyncTime).should("have.value", "Unknown");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(importChangesOnly).should("be.checked");
				cy.get(importChangesOnlyLabel).should("be.visible");
				cy.clock(new Date("2000-01-02T10:20:04"));
				cy.get(importButton).click();
				cy.get(notices).should("be.visible");
				cy.get(notices).should("contain.text", "Database has been successfully imported");
				cy.get(lastSyncTime).should("contain.value", "2-Jan-2000 10:20:04");
				cy.get(localChanges).should("have.value", "None pending");
				cy.get(headerLeftButton).click();
				cy.get(aboutRow).click();
				cy.get(totalPrograms).should("have.value", "0");
				cy.get(totalSeries).should("have.value", "0");
				cy.get(totalEpisodes).should("have.value", "1 (0.00% watched)");
			});
		});

		describe("unregister", (): void => {
			before((): void => cy.createTestData({}));

			it("should unregister the device", (): void => {
				cy.get(deviceName).click();
				cy.get(footerLeftButton).click();
				cy.get(deviceName).should("have.value", "< Unregistered >");
				cy.get(registrationMessage).should("be.visible");
				cy.get(syncControls).should("not.be.visible");
			});
		});
	});
});