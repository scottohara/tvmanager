import type {
	Device,
	ImportDoc,
	NavButtonEventHandler,
	SyncErrorType,
	SyncOperation,
} from "~/controllers";
import type { Model, ModelType, SerializedModel } from "~/models";
import DataSyncView from "~/views/dataSync-view.html";
import Episode from "~/models/episode-model";
import Program from "~/models/program-model";
import type { PublicInterface } from "~/global";
import Series from "~/models/series-model";
import Setting from "~/models/setting-model";
import Sync from "~/models/sync-model";
import ViewController from "~/controllers/view-controller";
import window from "~/components/window";

enum Months {
	Jan = 0,
	Feb = 1,
	Mar = 2,
	Apr = 3,
	May = 4,
	Jun = 5,
	Jul = 6,
	Aug = 7,
	Sep = 8,
	Oct = 9,
	Nov = 10,
	Dec = 11,
}

export default class DataSyncController extends ViewController {
	private device: Device = {
		id: "",
		name: "",
		imported: false,
	};

	private isLocalChanges = false;

	private syncing = false;

	private syncProcessed = 0;

	private errors: HTMLLIElement[] = [];

	private syncList: PublicInterface<Sync>[] = [];

	private objectsToImport = 0;

	private objectsImported = 0;

	public get view(): string {
		return DataSyncView;
	}

	private get onlyImportChanges(): boolean {
		return this.importChangesOnly.checked;
	}

	// DOM selectors
	private get registrationRow(): HTMLDivElement {
		return document.querySelector("#registrationRow") as HTMLDivElement;
	}

	private get deviceName(): HTMLInputElement {
		return document.querySelector("#deviceName") as HTMLInputElement;
	}

	private get registrationMessage(): HTMLDivElement {
		return document.querySelector("#registrationMessage") as HTMLDivElement;
	}

	private get syncControls(): HTMLElement {
		return document.querySelector("#syncControls") as HTMLElement;
	}

	private get lastSyncTime(): HTMLInputElement {
		return document.querySelector("#lastSyncTime") as HTMLInputElement;
	}

	private get localChanges(): HTMLInputElement {
		return document.querySelector("#localChanges") as HTMLInputElement;
	}

	private get importChangesOnlyRow(): HTMLDivElement {
		return document.querySelector("#importChangesOnlyRow") as HTMLDivElement;
	}

	private get importChangesOnly(): HTMLInputElement {
		return document.querySelector("#importChangesOnly") as HTMLInputElement;
	}

	private get import(): HTMLAnchorElement {
		return document.querySelector("#import") as HTMLAnchorElement;
	}

	private get export(): HTMLAnchorElement {
		return document.querySelector("#export") as HTMLAnchorElement;
	}

	private get statusRow(): HTMLDivElement {
		return document.querySelector("#statusRow") as HTMLDivElement;
	}

	private get progress(): HTMLProgressElement {
		return document.querySelector("#progress") as HTMLProgressElement;
	}

	private get status(): HTMLInputElement {
		return document.querySelector("#status") as HTMLInputElement;
	}

	private get syncErrors(): HTMLElement {
		return document.querySelector("#syncErrors") as HTMLElement;
	}

	private get errorList(): HTMLUListElement {
		return document.querySelector("#errorList") as HTMLUListElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Import/Export",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings",
			},
		};

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Bind an event handler to access the registration view
		this.registrationRow.addEventListener(
			"click",
			this.viewRegistration.bind(this),
		);

		// Bind event handlers for the import/export buttons
		this.import.addEventListener("click", this.dataImport.bind(this));
		this.export.addEventListener("click", this.dataExport.bind(this));

		// Set the initial status message
		this.localChanges.value = "Checking...";

		// Get the last sync time
		this.lastSyncTime.value = this.formatLastSyncTime(
			await Setting.get("LastSyncTime"),
		);

		// Get the registered device
		this.gotDevice(await Setting.get("Device"));

		// Count how many local changes there are to be synced
		this.checkForLocalChanges(await Sync.count());
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private async viewRegistration(): Promise<void> {
		return this.appController.pushView("registration");
	}

	private formatLastSyncTime(lastSyncTime: PublicInterface<Setting>): string {
		// Helper function to ensure date parts are zero-padded as required
		function leftPad(value: number): string {
			const MIN_LENGTH = 2,
				paddedValue = `0${value}`;

			return paddedValue.substring(paddedValue.length - MIN_LENGTH);
		}

		// Only proceed if we have a last sync time
		if (undefined === lastSyncTime.settingValue) {
			return "Unknown";
		}

		// Format the value as dd-mon-yyyy hh:mm:ss
		const lastSync = new Date(lastSyncTime.settingValue);

		return `${lastSync.getDate()}-${
			Months[lastSync.getMonth()]
		}-${lastSync.getFullYear()} ${leftPad(lastSync.getHours())}:${leftPad(
			lastSync.getMinutes(),
		)}:${leftPad(lastSync.getSeconds())}`;
	}

	private gotDevice(device: PublicInterface<Setting>): void {
		// Only proceed if we have a device
		if (undefined === device.settingValue) {
			// No registered device, so display a registration message in place of the sync controls
			this.deviceName.value = "< Unregistered >";
			this.registrationMessage.style.display = "block";
		} else {
			// Parse the JSON
			this.device = JSON.parse(device.settingValue) as Device;

			// Display the device name
			this.deviceName.value = this.device.name;

			// Show the sync controls
			this.syncControls.style.display = "block";

			// If the device has previously performed a full import, allow the Fast Import option
			if (this.device.imported) {
				this.importChangesOnly.checked = true;
				this.importChangesOnlyRow.style.display = "flex";
			}
		}
	}

	private checkForLocalChanges(count: number): void {
		// If there are any local changes, set the indicator
		this.isLocalChanges = count > 0;

		// If there are any local changes, display the number of changes to be synced
		if (this.isLocalChanges) {
			this.localChanges.value = `${count} change${
				count > 1 ? "s" : ""
			} pending`;
			this.export.classList.remove("disabled");
		} else {
			// No local changes
			this.localChanges.value = "None pending";
			this.export.classList.add("disabled");
		}
	}

	private dataExport(): void {
		if (this.isLocalChanges) {
			this.syncStart(
				"Export",
				"Are you sure you want to export?",
				this.doExport.bind(this),
			);
		}
	}

	private dataImport(): void {
		// If there are any local changes, warn the user
		let prompt = "";

		if (this.isLocalChanges) {
			prompt = "Warning: Local changes have been made. ";
		}

		this.syncStart(
			"Import",
			`${prompt}Are you sure you want to import?`,
			this.doImport.bind(this),
		);
	}

	private syncStart(
		operation: SyncOperation,
		prompt: string,
		callback: () => void,
	): void {
		// Make sure a sync operation is not already running
		if (this.syncing) {
			// Do nothing, an operation is already in progress
			this.status.value = `An ${operation.toLowerCase()} is already running`;
		} else {
			// Set the syncing flag
			this.syncing = true;

			// Show the status row
			this.progress.style.display = "none";
			this.status.value = `Starting ${operation.toLowerCase()}`;
			this.status.style.display = "inline";
			this.statusRow.style.display = "flex";

			// Ask the user to confirm their action
			if (window.confirm(prompt)) {
				// Perform the operation
				callback();
			} else {
				// User cancelled
				this.status.value = `${operation} aborted`;
				this.syncFinish(operation, false);
			}
		}
	}

	private syncFinish(operation: SyncOperation, successful: boolean): void {
		let label = `Database has been successfully ${operation.toLowerCase()}ed.`;

		// If the operation was successful, hide the status row
		if (successful) {
			this.statusRow.style.display = "none";
		} else {
			label = `${operation} failed.`;
		}

		// Display a notice indicating that the operation has finished
		this.appController.showNotice({ label });

		// Clear the syncing flag
		this.syncing = false;
	}

	private async doExport(): Promise<unknown[]> {
		return this.listRetrieved(await Sync.list());
	}

	private async listRetrieved(
		syncList: PublicInterface<Sync>[],
	): Promise<unknown[]> {
		this.syncProcessed = 0;
		this.errors = [];
		this.syncList = syncList;

		// Show the export progress
		this.status.style.display = "none";
		this.progress.value = this.syncProcessed;
		this.progress.max = this.syncList.length;
		this.progress.style.display = "inline";

		// Iterate over the list
		const changes: Promise<void>[] = [];

		for (const record of this.syncList) {
			switch (record.action) {
				case "modified":
					// If the record was added/modified, send the change
					changes.push(this.sendChange(record));
					break;

				case "deleted":
					// Otherwise, if it was deleted, send the delete
					changes.push(this.sendDelete(record));
					break;

				default:
			}
		}

		return Promise.all(changes);
	}

	private async sendChange(sync: PublicInterface<Sync>): Promise<void> {
		// Call the find method of the appropriate model object to get the item to export
		const instance = await this.find(sync),
			// Get the JSON respresentation of the object, serialise to a string and calculate the MD5 sum of the content
			instanceJson = instance.toJson(),
			json = JSON.stringify(instanceJson);

		try {
			// Post to the export route, including the MD5 sum and device ID in the request headers
			const response = await fetch("/documents", {
				method: "POST",
				headers: {
					"X-DEVICE-ID": this.device.id,
				},
				body: json,
			});

			if (response.ok) {
				await sync.remove();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.syncError(
				"Send error",
				sync.type as ModelType,
				(error as Error).message,
				sync.id,
			);
		}

		return this.changeSent();
	}

	private async find(sync: PublicInterface<Sync>): Promise<Model> {
		let model!: Promise<Model>;

		// Call the find method of the appropriate model object to get the item to export
		switch (sync.type) {
			case "Episode":
				model = Episode.find(sync.id as string);
				break;

			case "Program":
				model = Program.find(sync.id as string);
				break;

			case "Series":
				model = Series.find(sync.id as string);
				break;

			default:
		}

		return model;
	}

	private async sendDelete(sync: PublicInterface<Sync>): Promise<void> {
		try {
			// Send a DELETE request to the server, including the device ID in the request headers
			const response = await fetch(`/documents/${sync.id}`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": this.device.id,
				},
			});

			if (response.ok) {
				await sync.remove();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.syncError(
				"Delete error",
				sync.type as ModelType,
				(error as Error).message,
				sync.id,
			);
		}

		return this.changeSent();
	}

	private async changeSent(): Promise<void> {
		// Increment the number of records processed
		this.syncProcessed++;

		// Update the export progress
		this.progress.value = this.syncProcessed;

		// Check if we're done
		if (this.syncProcessed === this.syncList.length) {
			// Update the last sync time
			await this.setLastSyncTime();

			// Update the number of local changes to be synced
			this.checkForLocalChanges(await Sync.count());

			// Check for any sync errors
			if (this.errors.length) {
				// There were errors, so display them
				this.showErrors("Export");
			} else {
				// No errors, so just hide the errors container and call the success handler
				this.syncErrors.style.display = "none";
				this.syncFinish("Export", true);
			}
		}
	}

	private async setLastSyncTime(): Promise<void> {
		// Instantiate a new Setting object with the current date/time
		const lastSyncTime = new Setting("LastSyncTime", String(new Date()));

		// Save to the database
		await lastSyncTime.save();

		// Display the updated last sync time
		this.lastSyncTime.value = this.formatLastSyncTime(lastSyncTime);
	}

	private async doImport(): Promise<unknown> {
		this.errors = [];

		// For full imports, delete all local data first
		if (this.onlyImportChanges) {
			// For Fast Import, just start the import immediately
			return this.importData();
		}

		const [programsErrorMessage, seriesErrorMessage, episodesErrorMessage] =
			await Promise.all([
				Program.removeAll(),
				Series.removeAll(),
				Episode.removeAll(),
			]);

		let isError = false;

		// Check for errors
		if (undefined !== programsErrorMessage) {
			this.syncError("Delete error", "Program", programsErrorMessage);
			isError = true;
		}

		if (undefined !== seriesErrorMessage) {
			this.syncError("Delete error", "Series", seriesErrorMessage);
			isError = true;
		}

		if (undefined !== episodesErrorMessage) {
			this.syncError("Delete error", "Episode", episodesErrorMessage);
			isError = true;
		}

		if (isError) {
			return this.importDone();
		}

		// Start the import
		return this.importData();
	}

	private async importData(): Promise<unknown> {
		this.objectsToImport = 0;
		this.objectsImported = 0;

		try {
			// Get the list of objects to import from the server, including the device ID in the request headers
			const response = await fetch(
				`/documents/${this.onlyImportChanges ? "pending" : "all"}`,
				{
					headers: {
						"X-DEVICE-ID": this.device.id,
					},
				},
			);

			if (response.ok) {
				const importJson = (await response.json()) as ImportDoc[];

				// Only proceed if there are objects to import
				if (importJson.length > 0) {
					this.objectsToImport = importJson.length;

					// Show the import progress
					this.status.style.display = "none";
					this.progress.value = this.objectsImported;
					this.progress.max = this.objectsToImport;
					this.progress.style.display = "inline";

					// Iterate over the list of objects to be imported
					return await Promise.all(
						importJson.map(
							async (object: ImportDoc): Promise<void> =>
								this.importObject(object),
						),
					);
				}

				// No objects to import, which is only an error for Full Imports
				if (!this.onlyImportChanges) {
					this.syncError("Receive error", "Sync", "No data found");
				}
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			// An error occurred getting the objects to import
			this.syncError("Receive error", "Sync", (error as Error).message);
		}

		// Finalise the import
		return this.importDone();
	}

	private async importObject(object: ImportDoc): Promise<void> {
		// Create an instance of the appropriate model from the JSON representation, and check if the current device is in the pending array
		const obj = this.jsonToModel(object.doc),
			isPending = object.doc.pending.includes(this.device.id);

		// If the object is flagged as deleted on the server, delete it from the local database
		if (object.doc.isDeleted) {
			await obj.remove();

			// Manually mark the object as saved, passing the id of the deleted object
			await this.objectSaved(object.doc.id, object.doc.type, isPending);
		} else {
			// Otherwise save the change to the local database
			await this.objectSaved(await obj.save(), object.doc.type, isPending);
		}
	}

	private jsonToModel(json: SerializedModel): Model {
		let model!: Model;

		switch (json.type) {
			case "Episode":
				model = Episode.fromJson(json);
				break;

			case "Program":
				model = Program.fromJson(json);
				break;

			case "Series":
				model = Series.fromJson(json);
				break;

			// No default
		}

		return model;
	}

	private async objectSaved(
		id: string | null | undefined,
		type: ModelType,
		isPending: boolean,
	): Promise<void> {
		if (null === id || undefined === id) {
			// No id supplied, so that's an error
			this.syncError("Save error", type, `Error saving ${type.toLowerCase()}`);
		} else {
			// For Fast Import, clear any Sync record for the object just imported
			if (this.onlyImportChanges) {
				const sync = new Sync(type, String(id));

				await sync.remove();
			}

			// If the object imported was listed as a pending change for the current device, we can now clear the pending status
			if (isPending) {
				await this.removePending(String(id), type);

				return;
			}
		}

		await this.dataImported();
	}

	private async removePending(id: string, type: ModelType): Promise<void> {
		try {
			// Send a DELETE request to the server, including the device ID in the request headers
			const response = await fetch(`/documents/${id}/pending`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": this.device.id,
				},
			});

			if (!response.ok) {
				this.syncError(
					"Save error",
					type,
					`Error saving ${type.toLowerCase()}`,
				);
			}
		} catch {
			// No op
		}

		return this.dataImported();
	}

	private async dataImported(): Promise<void> {
		// Increment the running total number of objects imported
		this.objectsImported++;

		// Update the import progress
		this.progress.value = this.objectsImported;

		// Check if all objects have been imported
		if (this.objectsImported === this.objectsToImport) {
			// Finalise the import
			await this.importDone();
		}
	}

	private async importDone(): Promise<void> {
		// Check for any sync errors
		if (this.errors.length) {
			// There were errors, so display them
			this.showErrors("Import");
		} else if (this.onlyImportChanges) {
			// For Fast Import, Sync records were cleared as we went, so just mark the import as successful
			await this.importSuccessful();
		} else {
			// If the registered device had not previously performed a full import, mark it as having done so
			if (!this.device.imported) {
				this.device.imported = true;
				const device = new Setting("Device", JSON.stringify(this.device));

				await device.save();
			}

			// Clear all pending local changes
			await this.pendingChangesCleared(await Sync.removeAll());
		}
	}

	private async pendingChangesCleared(errorMessage?: string): Promise<void> {
		if (undefined === errorMessage) {
			// Mark the import as successful
			await this.importSuccessful();
		} else {
			// Something went wrong, so display the error(s)
			this.syncError("Delete error", "Sync", errorMessage);
			this.showErrors("Import");
		}
	}

	private async importSuccessful(): Promise<void> {
		// Update the last sync time
		await this.setLastSyncTime();

		// Update the number of local changes to be synced
		this.checkForLocalChanges(await Sync.count());

		// Hide the errors container
		this.syncErrors.style.display = "none";

		// Finish the import
		this.syncFinish("Import", true);
	}

	private syncError(
		error: SyncErrorType,
		type: ModelType | "Sync",
		message: string,
		id?: string | null,
	): void {
		const item = document.createElement("li");

		item.innerHTML = `${error}<br/>Type: ${type}${
			null === id || undefined === id ? "" : ` ${id}`
		}<br/>${message}`;
		this.errors.push(item);
	}

	private showErrors(operation: SyncOperation): void {
		// Clear any existing errors and replace with the current errors list
		const PADDING_PX = 10;

		this.errorList.innerHTML = "";
		this.errorList.append(...this.errors);

		// Display the errors container
		this.syncErrors.style.display = "block";

		// Update the height so that the errors list is scrollable inside the container
		this.errorList.style.height = `${
			window.innerHeight - this.errorList.offsetTop - PADDING_PX
		}px`;

		// Finish the sync operation
		this.syncFinish(operation, false);
	}
}
