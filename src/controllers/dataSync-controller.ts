/**
 * @file (Controllers) DataSyncController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/dataSync-controller
 * @requires jquery
 * @requires models/episode-model
 * @requires models/program-model
 * @requires models/series-model
 * @requires models/setting-model
 * @requires models/sync-model
 * @requires controllers/view-controller
 * @requires md5
 */
import type {
	Device,
	FullImport,
	ImportData,
	ImportDoc,
	NavButtonEventHandler,
	SyncErrorType,
	SyncOperation
} from "controllers";
import type {
	Model,
	ModelType,
	SerializedModel
} from "models";
import $ from "jquery";
import DataSyncView from "views/dataSync-view.html";
import Episode from "models/episode-model";
import Program from "models/program-model";
import type { PublicInterface } from "global";
import Series from "models/series-model";
import Setting from "models/setting-model";
import Sync from "models/sync-model";
import ViewController from "controllers/view-controller";
import md5 from "md5";
import window from "components/window";

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
	Dec = 11
}

/**
 * @class DataSyncController
 * @classdesc Controller for the dataSync view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {Device} device - the registered device
 * @property {Boolean} localChanges - indicates whether there are any local changes to be synced
 * @property {Boolean} syncing - indicates whether a sync operation is currently running
 * @property {Number} syncProcessed - running total number of pending local changes exported
 * @property {JQuery[]} syncErrors - array of HTML list item elements containing error details
 * @property {Array<Sync>} syncList - array of Sync objects
 * @property {Boolean} importChangesOnly - true = Fast Import, false = Full Import
 * @property {Number} objectsToImport - total number of objects to be imported
 * @property {Number} objectsImported - running total number of objects imported
 */
export default class DataSyncController extends ViewController {
	private device: Device = {
		id: "",
		name: "",
		imported: false
	};

	private localChanges = false;

	private syncing = false;

	private syncProcessed = 0;

	private syncErrors: JQuery[] = [];

	private syncList: PublicInterface<Sync>[] = [];

	private importChangesOnly = false;

	private objectsToImport = 0;

	private objectsImported = 0;

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return DataSyncView;
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Import/Export",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings"
			}
		};

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 */
	public override async activate(): Promise<void> {
		// Bind an event handler to access the registration view
		$("#registrationRow").on("click", this.viewRegistration.bind(this));

		// Bind event handlers for the import/export buttons
		$("#import").on("click", this.dataImport.bind(this));
		$("#export").on("click", this.dataExport.bind(this));

		// Set the initial status message
		$("#localChanges").val("Checking...");

		// Get the last sync time
		this.gotLastSyncTime(await Setting.get("LastSyncTime"));

		// Get the registered device
		this.gotDevice(await Setting.get("Device"));

		// Count how many local changes there are to be synced
		this.checkForLocalChanges(await Sync.count());
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method goBack
	 * @desc Pop the view off the stack
	 */
	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method viewRegistration
	 * @desc Display the registration view
	 */
	private async viewRegistration(): Promise<void> {
		return this.appController.pushView("registration");
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method gotLastSyncTime
	 * @desc Display the last sync time
	 * @param {Setting} lastSyncTime - a Setting object containing the last time an import/export was run
	 */
	private gotLastSyncTime(lastSyncTime: PublicInterface<Setting>): void {
		// Helper function to ensure date parts are zero-padded as required
		function leftPad(value: number): string {
			const MIN_LENGTH = 2,
						paddedValue = `0${value}`;

			return paddedValue.substr(paddedValue.length - MIN_LENGTH);
		}

		// Only proceed if we have a last sync time
		if (undefined === lastSyncTime.settingValue) {
			// Unable to determine last sync time
			$("#lastSyncTime").val("Unknown");
		} else {
			// Format the value as dd-mon-yyyy hh:mm:ss
			const lastSync: Date = new Date(lastSyncTime.settingValue),
						lastSyncDisplay = `${lastSync.getDate()}-${Months[lastSync.getMonth()]}-${lastSync.getFullYear()} ${leftPad(lastSync.getHours())}:${leftPad(lastSync.getMinutes())}:${leftPad(lastSync.getSeconds())}`;

			// Display the formatted value
			$("#lastSyncTime").val(lastSyncDisplay);
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method gotDevice
	 * @desc Parses the registered device and determines what sync options are available
	 * @param {Setting} device - a Setting object containing the registered device
	 */
	private gotDevice(device: PublicInterface<Setting>): void {
		// Only proceed if we have a device
		if (undefined === device.settingValue) {
			// No registered device, so display a registration message in place of the sync controls
			$("#deviceName").val("< Unregistered >");
			$("#registrationMessage").show();
		} else {
			// Parse the JSON
			this.device = JSON.parse(device.settingValue) as Device;

			// Display the device name
			$("#deviceName").val(this.device.name);

			// Show the sync controls
			$("#syncControls").show();

			// If the device has previously performed a full import, allow the Fast Import option
			if (this.device.imported) {
				$("#importChangesOnly").prop("checked", true);
				$("#importChangesOnlyRow").show();
			}
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method checkForLocalChanges
	 * @desc Displays the number of local changes to be synced
	 * @param {Number} count - the number of local changes to be synced
	 */
	private checkForLocalChanges(count: number): void {
		// If there are any local changes, set the indicator
		this.localChanges = count > 0;

		// If there are any local changes, display the number of changes to be synced
		if (this.localChanges) {
			$("#localChanges").val(`${count} change${count > 1 ? "s" : ""} pending`);
		} else {
			// No local changes
			$("#localChanges").val("None pending");
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method dataExport
	 * @desc Initiates a data export
	 */
	private dataExport(): void {
		this.syncStart("Export", "Are you sure you want to export?", this.doExport.bind(this));
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method dataImport
	 * @desc Initiates a data import
	 */
	private dataImport(): void {
		// If there are any local changes, warn the user
		let prompt = "";

		if (this.localChanges) {
			prompt = "Warning: Local changes have been made. ";
		}

		this.syncStart("Import", `${prompt}Are you sure you want to import?`, this.doImport.bind(this));
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method syncStart
	 * @desc Initiates a data sync operation
	 * @param {SyncOperation} operation - import or export
	 * @param {String} prompt - confirmation prompt
	 * @param {Function} callback - the syncing function to perform
	 */
	private syncStart(operation: SyncOperation, prompt: string, callback: () => void): void {
		// Make sure a sync operation is not already running
		if (this.syncing) {
			// Do nothing, an operation is already in progress
			$("#status").val(`An ${operation.toLowerCase()} is already running`);
		} else {
			// Set the syncing flag
			this.syncing = true;

			// Show the status row
			$("#progress").hide();
			$("#status").val(`Starting ${operation.toLowerCase()}`);
			$("#status").show();
			$("#statusRow").show();

			// Ask the user to confirm their action
			if (window.confirm(prompt)) {
				// Perform the operation
				callback();
			} else {
				// User cancelled
				$("#status").val(`${operation} aborted`);
				this.syncFinish(operation, false);
			}
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method syncFinish
	 * @desc Finalises a data sync operation
	 * @param {SyncOperation} operation - import or export
	 * @param {Boolean} success - whether the sync was successful
	 */
	private syncFinish(operation: SyncOperation, successful: boolean): void {
		let label = `Database has been successfully ${operation.toLowerCase()}ed.`;

		// If the operation was successful, hide the status row
		if (successful) {
			$("#statusRow").hide();
		} else {
			label = `${operation} failed.`;
		}

		// Display a notice indicating that the operation has finished
		this.appController.showNotice({
			label,
			leftButton: {
				style: "cautionButton",
				label: "OK"
			}
		});

		// Clear the syncing flag
		this.syncing = false;
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method doExport
	 * @desc Performs the data export
	 * @param {Array<Sync>} syncList - array of Sync objects
	 */
	private async doExport(): Promise<unknown[]> {
		return this.listRetrieved(await Sync.list());
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method listRetrieved
	 * @desc Iterates over the list of local changes to be synced, and processes each one
	 * @param {Array<Sync>} syncList - array of Sync objects
	 */
	private async listRetrieved(syncList: PublicInterface<Sync>[]): Promise<unknown[]> {
		this.syncProcessed = 0;
		this.syncErrors = [];
		this.syncList = syncList;

		// Show the export progress
		$("#status").hide();
		$("#progress").val(this.syncProcessed);
		$("#progress").attr("max", this.syncList.length);
		$("#progress").show();

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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method sendChange
	 * @desc Exports a new/changed record
	 * @param {Sync} sync - Sync object containing the id/type of the record that was added/changed
	 */
	private async sendChange(sync: PublicInterface<Sync>): Promise<void> {
		// Call the find method of the appropriate model object to get the item to export
		const instance: Model = await this.find(sync),

					// Get the JSON respresentation of the object, serialise to a string and calculate the MD5 sum of the content
					instanceJson: SerializedModel = instance.toJson(),
					json: string = JSON.stringify(instanceJson),
					hash: string = md5(json);

		try {
			// Post to the export route, including the MD5 sum and device ID in the request headers
			const response: Response = await fetch("/documents", {
				method: "POST",
				headers: {
					"Content-MD5": hash,
					"X-DEVICE-ID": this.device.id
				},
				body: json
			});

			if (response.ok) {
				// Get the Etag value returned by the server
				const returnedHash: string = String(response.headers.get("Etag")).replace(/^W\/|"/gu, "");

				// Compare the Etag with the MD5 sum we sent
				if (hash === returnedHash) {
					// Hash values matched meaning that the export was successful, so remove the Sync record
					await sync.remove();
				} else {
					// The hash values didn't match, so that's an error
					this.syncError("Checksum mismatch", sync.type as ModelType, `Expected: ${hash}, got: ${returnedHash}`, sync.id);
				}
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.syncError("Send error", sync.type as ModelType, (error as Error).message, sync.id);
		}

		return this.changeSent();
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method find
	 * @desc Finds an item to export
	 * @param {Sync} sync - Sync object containing the id/type of the record that was added/changed
	 */
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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method sendDelete
	 * @desc Exports a deleted record
	 * @param {Sync} sync - Sync object containing the id/type of the record that was deleted
	 */
	private async sendDelete(sync: PublicInterface<Sync>): Promise<void> {
		try {
			// Send a DELETE request to the server, including the device ID in the request headers
			const response: Response = await fetch(`/documents/${sync.id}`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": this.device.id
				}
			});

			if (response.ok) {
				await sync.remove();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.syncError("Delete error", sync.type as ModelType, (error as Error).message, sync.id);
		}

		return this.changeSent();
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method changeSent
	 * @desc Updates the export progress message, and finalises the export if all records have been processed
	 */
	private async changeSent(): Promise<void> {
		// Increment the number of records processed
		this.syncProcessed++;

		// Update the export progress
		$("#progress").val(this.syncProcessed);

		// Check if we're done
		if (this.syncProcessed === this.syncList.length) {
			// Update the last sync time
			await this.setLastSyncTime();

			// Update the number of local changes to be synced
			this.checkForLocalChanges(await Sync.count());

			// Check for any sync errors
			if (this.syncErrors.length) {
				// There were errors, so display them
				this.showErrors("Export");
			} else {
				// No errors, so just hide the errors container and call the success handler
				$("#syncErrors").hide();
				this.syncFinish("Export", true);
			}
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method setLastSyncTime
	 * @desc Updates the last sync time
	 */
	private async setLastSyncTime(): Promise<void> {
		// Instantiate a new Setting object with the current date/time
		const lastSyncTime: Setting = new Setting("LastSyncTime", String(new Date()));

		// Save to the database
		await lastSyncTime.save();

		// Display the updated last sync time
		this.gotLastSyncTime(lastSyncTime);
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method doImport
	 * @desc For full imports, deletes all local data before starting the import; otherwise just starts the import immediately
	 */
	private async doImport(): Promise<unknown> {
		this.syncErrors = [];

		// Check if Fast Import is selected
		this.importChangesOnly = $("#importChangesOnly").is(":checked");

		// For full imports, delete all local data first
		if (this.importChangesOnly) {
			// For Fast Import, just start the import immediately
			return this.importData();
		}

		const [
			programsErrorMessage,
			seriesErrorMessage,
			episodesErrorMessage
		] = await Promise.all([
			Program.removeAll(),
			Series.removeAll(),
			Episode.removeAll()
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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method importData
	 * @desc Retrieves data to be imported and loads it into the local database
	 */
	private async importData(): Promise<unknown> {
		this.objectsToImport = 0;
		this.objectsImported = 0;

		try {
			// Get the list of objects to import from the server, including the device ID in the request headers
			const response: Response = await fetch(`/documents/${this.importChangesOnly ? "pending" : "all"}`, {
				headers: {
					"X-DEVICE-ID": this.device.id
				}
			});

			if (response.ok) {
				// Extract the JSON and checksum returned, and calculate a hash of the data
				const importObj: FullImport | ImportDoc[] = await response.json() as FullImport | ImportDoc[],
							{ importJson, returnedHash }: ImportData = this.getImportData(importObj, String(response.headers.get("Etag"))),
							hash: string = md5(JSON.stringify(importJson));

				// Compare the Etag with the MD5 sum we calculated
				if (hash === returnedHash) {
					// Only proceed if there are objects to import
					if (importJson.length > 0) {
						this.objectsToImport = importJson.length;

						// Show the import progress
						$("#status").hide();
						$("#progress").val(this.objectsImported);
						$("#progress").attr("max", this.objectsToImport);
						$("#progress").show();

						// Iterate over the list of objects to be imported
						return await Promise.all(importJson.map(async (object: ImportDoc): Promise<void> => this.importObject(object)));
					}

					// No objects to import, which is only an error for Full Imports
					if (!this.importChangesOnly) {
						this.syncError("Receive error", "Sync", "No data found");
					}
				} else {
					// The has values didn't match, so that's an error
					this.syncError("Checksum mismatch", "Sync", `Expected: ${hash}, got: ${returnedHash}`);
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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method getImportData
	 * @desc Returns the import data JSON and checksum
	 * @param {Object} data - data returned from the server
	 * @returns {Object} the object JSON and checksum
	 */
	private getImportData(data: FullImport | ImportDoc[] | undefined, eTag: string): ImportData {
		let importJson: ImportDoc[],
				returnedHash: string;

		/*
		 * Get the Etag value returned by the server
		 * For a fast import, look in the Etag header; for a full import there will be a checksum
		 * property in the body content.
		 * (This is because to avoid the full import from timing out, the response is streamed back
		 * as it is generated; so we're unable to calculate a checksum for the response header.
		 * Ideally, we would be able to use a HTTP Trailer header to provide this information
		 * after the body content; but no browsers support HTTP Trailer headers)
		 */
		if (this.importChangesOnly) {
			importJson = data as ImportDoc[];
			returnedHash = eTag.replace(/^W\/|"/gu, "");
		} else {
			returnedHash = (data as FullImport).checksum;
			importJson = (data as FullImport).data;
		}

		return { importJson, returnedHash };
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method importObject
	 * @desc Processes an imported object
	 * @param {Object} object - The object to process
	 */
	private async importObject(object: ImportDoc): Promise<void> {
		// Create an instance of the appropriate model from the JSON representation, and check if the current device is in the pending array
		const obj: Model = this.jsonToModel(object.doc),
					isPending: boolean = object.doc.pending.includes(this.device.id);

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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method jsonToModel
	 * @desc Creates an instance of the appropriate model from a JSON representation
	 * @param {SerializedModel} json - The JSON representation
	 * @returns {Model} An instance of the appropriate model
	 */
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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method objectSaved
	 * @desc Called when an imported object is saved
	 * @param {String} type - The type of imported object
	 * @param {Boolean} isPending - True if the object was pending for the current device
	 */
	private async objectSaved(id: string | null | undefined, type: ModelType, isPending: boolean): Promise<void> {
		if (null === id || undefined === id) {
			// No id supplied, so that's an error
			this.syncError("Save error", type, `Error saving ${type.toLowerCase()}`);
		} else {
			// For Fast Import, clear any Sync record for the object just imported
			if (this.importChangesOnly) {
				const sync: Sync = new Sync(type, String(id));

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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method removePending
	 * @desc Clears the pending status for a given object and device
	 * @param {String} id - Unique identifier of the pending object
	 * @param {String} type - The type of pending object
	 */
	private async removePending(id: string, type: ModelType): Promise<void> {
		try {
			// Send a DELETE request to the server, including the device ID in the request headers
			const response: Response = await fetch(`/documents/${id}/pending`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": this.device.id
				}
			});

			if (!response.ok) {
				this.syncError("Save error", type, `Error saving ${type.toLowerCase()}`);
			}
		} catch {
			// No op
		}

		return this.dataImported();
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method dataImported
	 * @desc Updates the import progress message and checks if all objects have been imported
	 */
	private async dataImported(): Promise<void> {
		// Increment the running total number of objects imported
		this.objectsImported++;

		// Update the import progress
		$("#progress").val(this.objectsImported);

		// Check if all objects have been imported
		if (this.objectsImported === this.objectsToImport) {
			// Finalise the import
			await this.importDone();
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method importDone
	 * @desc Finalises the data import
	 */
	private async importDone(): Promise<void> {
		// Check for any sync errors
		if (this.syncErrors.length) {
			// There were errors, so display them
			this.showErrors("Import");
		} else	if (this.importChangesOnly) {
			// For Fast Import, Sync records were cleared as we went, so just mark the import as successful
			await this.importSuccessful();
		} else {
			// If the registered device had not previously performed a full import, mark it as having done so
			if (!this.device.imported) {
				this.device.imported = true;
				const device: Setting = new Setting("Device", JSON.stringify(this.device));

				await device.save();
			}

			// Clear all pending local changes
			await this.pendingChangesCleared(await Sync.removeAll());
		}
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method pendingChangesCleared
	 * @desc Called after all pending local changes have been removed
	 */
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

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method importSuccessful
	 * @desc Updates the last sync time and the number of local changes to be synced, and finishes the import
	 */
	private async importSuccessful(): Promise<void> {
		// Update the last sync time
		await this.setLastSyncTime();

		// Update the number of local changes to be synced
		this.checkForLocalChanges(await Sync.count());

		// Hide the errors container
		$("#syncErrors").hide();

		// Finish the import
		this.syncFinish("Import", true);
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method syncError
	 * @desc Adds an error to the list of sync errors
	 * @param {String} error - the type of error
	 * @param {String} type - the type of object that the error relates to
	 * @param {String} message - the error message
	 * @param {String} id - the unique identifier of the object that the error relates to
	 */
	private syncError(error: SyncErrorType, type: ModelType | "Sync", message: string, id?: string | null): void {
		// Append the error to the list
		this.syncErrors.push($("<li>").html(`${error}<br/>Type: ${type}${null === id || undefined === id ? "" : ` ${id}`}<br/>${message}`));
	}

	/**
	 * @memberof DataSyncController
	 * @this DataSyncController
	 * @instance
	 * @method showErrors
	 * @desc Displays the errors container
	 * @param {String} operation - import or export
	 */
	private showErrors(operation: SyncOperation): void {
		// Clear any existing errors and replace with the current errors list
		const PADDING_PX = 10,
					errorList = $("#errorList")
						.empty()
						.append(this.syncErrors);

		// Display the errors container
		$("#syncErrors").show();

		// Update the height so that the errors list is scrollable inside the container
		let offsetTop = 0;

		offsetTop = (errorList.offset() as JQuery.Coordinates).top;
		errorList.height(window.innerHeight - offsetTop - PADDING_PX);

		// Finish the sync operation
		this.syncFinish(operation, false);
	}
}