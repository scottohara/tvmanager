/**
 * @file (Controllers) DataSyncController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class Device
 * @classdesc Anonymous object containing the properties of a registered device
 * @private
 * @property {String} name - the name of the device
 * @property {Boolean} imported - indicates whether the device has performed a full import
 * @property {String} id - the UUID of the device
 */

/**
 * @class DataSyncController
 * @classdesc Controller for the dataSync view
 * @property {HeaderFooter} header - the view header bar
 * @property {Device} device - the registered device
 * @property {Boolean} localChanges - indicates whether there are any local changes to be synced
 * @property {Boolean} exporting - indicates whether an export is currently running
 * @property {Boolean} importing - indicates whether an import is currently running
 * @property {Function} callback - a function to call after the import/export finishes
 * @property {Number} syncProcessed - running total number of pending local changes exported
 * @property {Array<Object>} syncErrors - array of HTML list item elements containing error details
 * @property {Array<Sync>} syncList - array of Sync objects
 * @property {Boolean} importChangesOnly - true = Fast Import, false = Full Import
 * @property {Boolean} programsReady - ready to import programs
 * @property {Boolean} seriesReady - ready to import series
 * @property {Boolean} episodesReady - ready to import episodes
 * @property {Number} objectsToImport - total number of objects to be imported
 * @property {Number} objectsImported - running total number of objects imported
 * @this DataSyncController
 * @constructor
 */
var DataSyncController = function () {
	"use strict";
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
DataSyncController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Import/Export",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Settings"
		}
	};

	// Activate the controller
	this.activate();
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method activate
 * @desc Activates the controller
 */
DataSyncController.prototype.activate = function() {
	"use strict";

	// Bind an event handler to access the registration view
	$("#registrationRow").bind('click', this.viewRegistration);

	// Bind event handlers for the import/export buttons
	$("#import").bind('click', $.proxy(this.dataImport, this));
	$("#export").bind('click', $.proxy(this.dataExport, this));

	// Set the initial status message
	$("#localChanges").val("Checking...");

	// Get the last sync time
	Setting.get("LastSyncTime", this.gotLastSyncTime);

	// Get the registered device
	Setting.get("Device", $.proxy(this.gotDevice, this));

	// Count how many local changes there are to be synced
	Sync.count($.proxy(this.checkForLocalChanges, this));
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method goBack
 * @desc Pop the view off the stack
 */
DataSyncController.prototype.goBack = function() {
	"use strict";

	appController.popView();
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method viewRegistration
 * @desc Display the registration view
 */
DataSyncController.prototype.viewRegistration = function() {
	"use strict";

	appController.pushView("registration");
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method gotLastSyncTime
 * @desc Display the last sync time
 * @param {Setting} lastSyncTime - a Setting object containing the last time an import/export was run
 */
DataSyncController.prototype.gotLastSyncTime = function(lastSyncTime) {
	"use strict";

	// Only proceed if we have a last sync time
	if (lastSyncTime.settingValue) {
		// Format the value as dd-mon-yyyy hh:mm:ss
		var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };
		var lastSyncDisplay = new Date(lastSyncTime.settingValue);
		var lastSyncHours = "0" + lastSyncDisplay.getHours();
		var lastSyncMinutes = "0" + lastSyncDisplay.getMinutes();
		var lastSyncSeconds = "0" + lastSyncDisplay.getSeconds();
		lastSyncDisplay = lastSyncDisplay.getDate() + "-" + months[lastSyncDisplay.getMonth()] + "-" + lastSyncDisplay.getFullYear() + " " + lastSyncHours.substr(lastSyncHours.length-2) + ":" + lastSyncMinutes.substr(lastSyncMinutes.length-2) + ":" + lastSyncSeconds.substr(lastSyncSeconds.length-2);

		// Display the formatted value
		$("#lastSyncTime").val(lastSyncDisplay);
	} else {
		// Unable to determine last sync time
		$("#lastSyncTime").val("Unknown");
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method gotDevice
 * @desc Parses the registered device and determines what sync options are available
 * @param {Setting} device - a Setting object containing the registered device
 */
DataSyncController.prototype.gotDevice = function(device) {
	"use strict";

	// Only proceed if we have a device
	if (device.settingValue) {
		// Parse the JSON
		this.device = $.parseJSON(device.settingValue);

		// Display the device name
		$("#deviceName").val(this.device.name);

		// Show the sync controls
		$("#syncControls").show();

		// If the device has previously performed a full import, allow the Fast Import option
		if (this.device.imported) {
			$("#importChangesOnly").prop('checked', true);
			$("#importChangesOnlyRow").show();
		}
	} else {
		// No registered device, so display a registration message in place of the sync controls
		$("#deviceName").val("< Unregistered >");
		$("#registrationMessage").show();
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method checkForLocalChanges
 * @desc Displays the number of local changes to be synced
 * @param {Number} count - the number of local changes to be synced
 */
DataSyncController.prototype.checkForLocalChanges = function(count) {
	"use strict";

	// If there are any local changes, set the indicator
	this.localChanges = (count > 0);

	// If there are any local changes, display the number of changes to be synced
	if (this.localChanges) {
		$("#localChanges").val(count + " change" + (count > 1 ? "s" : "") + " to be synced");
	} else {
		// No local changes
		$("#localChanges").val("No changes to be synced");
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method dataExport
 * @desc Initiates a data export
 */
DataSyncController.prototype.dataExport = function() {
	"use strict";

	// Make sure an export is not already running
	if (!this.exporting) {
		// Set the exporting flag
		this.exporting = true;

		// Show the status row
		$("#statusRow").show();
		$("#status").val("Starting export");

		// Define a callback function for when the export is finished
		this.callback =	$.proxy(function(successful) {
			var label = "Database has been successfully exported.";

			// If the export was successful, hide the status row
			if (successful) {
				$("#statusRow").hide();
			} else {
				label = "Export failed.";
			}

			// Display a notice indicating that the export has finished
			appController.showNotice({
				label: label,
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});

			// Clear the exporting flag
			this.exporting = false;
		}, this);

		// Ask the user to confirm their action
		if (window.confirm("Are you sure you want to export?")) {
			// Get the list of local changes to sync
			Sync.list($.proxy(this.listRetrieved, this));
		} else {
			// User cancelled
			$("#status").val("Export aborted");
			this.callback(false);
		}
	} else {
		// Do nothing, an export is already in progress
		$("#status").val("An export is already running");
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method dataImport
 * @desc Initiates a data import
 */
DataSyncController.prototype.dataImport = function() {
	"use strict";

	// Make sure an import is not already running
	if (!this.importing) {
		// Set the importing flag
		this.importing = true;

		// Show the status row
		$("#statusRow").show();
		$("#status").val("Starting import");

		// Define a callback function for when the import is finished
		this.callback = $.proxy(function(successful) {
			var label = "Database has been successfully imported.";

			// If the import was successful, hide the status row
			if (successful) {
				$("#statusRow").hide();
			} else {
				label = "Import failed.";
			}

			// Display a notice indicating that the import has finished
			appController.showNotice({
				label: label,
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});

			// Clear the importing flag
			this.importing = false;
		}, this);

		// If there are any local changes, warn the user
		var prompt = "";
		if (this.localChanges) {
			prompt = "Warning: Local changes have been made. ";
		}

		// Ask the user to confirm their action
		if (window.confirm(prompt + "Are you sure you want to import?")) {
			// Do the import
			this.doImport();
		} else {
			// User cancelled
			$("#status").val("Import aborted");
			this.callback(false);
		}
	} else {
		// Do nothing, an import is already in progress
		$("#status").val("An import is already running");
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method listRetrieved
 * @desc Iterates over the list of local changes to be synced, and processes each one
 * @param {Array<Sync>} syncList - array of Sync objects
 */
DataSyncController.prototype.listRetrieved = function(syncList) {
	"use strict";

	this.syncProcessed = 0;
	this.syncErrors = [];
	this.syncList = syncList;

	// Iterate over the list
	for (var i = 0; i < this.syncList.length; i++) {
		// If the record was added/modified, send the change
		if ("modified" === this.syncList[i].action) {
			this.sendChange(this.syncList[i]);
		} else if ("deleted" === this.syncList[i].action) {
			// Otherwise, if it was deleted, send the delete
			this.sendDelete(this.syncList[i]);
		}
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method sendChange
 * @desc Exports a new/changed record
 * @param {Sync} sync - Sync object containing the id/type of the record that was added/changed
 */
DataSyncController.prototype.sendChange = function(sync) {
	"use strict";

	// Call the find method of the appropriate model object to get the item to export
	window[sync.type].find(sync.id, $.proxy(function(instance) {
		// Get the JSON respresentation of the object
		instance = instance.toJson();

		// Set the object type
		instance.type = sync.type;

		// Serialise to a string
		var json = JSON.stringify(instance);

		// Calculate the MD5 sum of the content
		var hash = hex_md5(json);

		// Post to the export route, including the MD5 sum and device ID in the request headers
		$.ajax({
			url: "/export",
			context: this,
			type: "POST",
			headers: {
				"Content-MD5": hash,
				"X-DEVICE-ID": this.device.id
			},
			data: json,
			success: function(exportResponse, status, jqXHR) {
				// Get the Etag value returned by the server
				var returnedHash = jqXHR.getResponseHeader("Etag").replace(/\"/g, "");

				// Compare the Etag with the MD5 sum we sent
				if (hash === returnedHash) {
					// Hash values matched meaning that the export was successful, so remove the Sync record
					sync.remove();
				} else {
					// The hash values didn't match, so that's an error
					this.syncError("Checksum mismatch", sync.type, "Expected: " + hash + ", got: " + returnedHash, sync.id);
				}
			},
			error: function(request, statusText) {
				// An error occurred with the export
				this.syncError("Send error", sync.type, statusText + ", " + request.status + " (" + request.statusText + ")", sync.id);
			},
			complete: $.proxy(this.changeSent, this)
		});
	}, this));
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method sendDelete
 * @desc Exports a deleted record
 * @param {Sync} sync - Sync object containing the id/type of the record that was deleted
 */
DataSyncController.prototype.sendDelete = function(sync){
	"use strict";

	// Send a DELETE request to the server, including the device ID in the request headers
	$.ajax({
		url: "/export/" + sync.id,
		context: this,
		type: "DELETE",
		headers: {
			"X-DEVICE-ID": this.device.id
		},
		success: function(exportResponse, status, jqXHR) {
			// Delete was successful, so remove the Sync record
			sync.remove();
		},
		error: function(request, statusText) {
			// An error occurred with the delete
			this.syncError("Delete error", sync.type, statusText + ", " + request.status + " (" + request.statusText + ")", sync.id);
		},
		complete: $.proxy(this.changeSent, this)
	});
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method changeSent
 * @desc Updates the export progress message, and finalises the export if all records have been processed
 */
DataSyncController.prototype.changeSent = function() {
	"use strict";

	// Increment the number of records processed
	this.syncProcessed++;

	// Update the export progress message
	$("#status").val("Exported " + this.syncProcessed + " of " + this.syncList.length + " changes");

	// Check if we're done
	if (this.syncProcessed === this.syncList.length) {
		// Update the last sync time
		this.setLastSyncTime();

		// Update the number of local changes to be synced
		Sync.count($.proxy(this.checkForLocalChanges, this));

		// Check for any sync errors
		if (0 === this.syncErrors.length) {
			// No errors, so just hide the errors container and call the success handler
			$("#syncErrors").hide();
			this.callback(true);
		} else {
			// There were errors, so display them
			this.showErrors();
		}
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method setLastSyncTime
 * @desc Updates the last sync time
 */
DataSyncController.prototype.setLastSyncTime = function() {
	"use strict";

	// Get the current date/time
	var now = new Date();

	// Instantiate a new Setting object
	var lastSyncTime = new Setting("LastSyncTime", now);

	// Save to the database
	lastSyncTime.save();

	// Display the updated last sync time
	this.gotLastSyncTime(lastSyncTime);
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method doImport
 * @desc For full imports, deletes all local data before starting the import; otherwise just starts the import immediately
 */
DataSyncController.prototype.doImport = function() {
	"use strict";

	this.syncErrors = [];

	// Check if Fast Import is selected
	this.importChangesOnly = $("#importChangesOnly").is(':checked');

	// For full imports, delete all local data first
	if (!this.importChangesOnly) {
		// Delete existing programs
		Program.removeAll($.proxy(function(errorMessage) {
			this.programsReady = true;
			// Check for errors
			if (errorMessage) {
				// Something went wrong, abort the import
				this.syncError("Delete error", "Program", errorMessage);
				this.importDone();
			} else {
				// Start the import
				this.importData();
			}
		}, this));
		
		// Delete existing series
		Series.removeAll($.proxy(function(errorMessage) {
			this.seriesReady = true;
			// Check for errors
			if (errorMessage) {
				// Something went wrong, abort the import
				this.syncError("Delete error", "Series", errorMessage);
				this.importDone();
			} else {
				// Start the import
				this.importData();
			}
		}, this));

		// Delete existing episodes
		Episode.removeAll($.proxy(function(errorMessage) {
			this.episodesReady = true;
			// Check for errors
			if (errorMessage) {
				// Something went wrong, abort the import
				this.syncError("Delete error", "Episode", errorMessage);
				this.importDone();
			} else {
				// Start the import
				this.importData();
			}
		}, this));
	} else {
		// For Fast Import, just start the import immediately
		this.programsReady = true;
		this.seriesReady = true;
		this.episodesReady = true;
		this.importData();
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method importData
 * @desc Retrieves data to be imported and loads it into the local database
 */
DataSyncController.prototype.importData = function() {
	"use strict";

	// Only proceed if all models are ready
	if (this.programsReady && this.seriesReady && this.episodesReady) {
		this.objectsToImport = 0;
		this.objectsImported = 0;

		// Get the list of objects to import from the server, including the device ID in the request headers
		$.ajax({
			url: "/import" + (this.importChangesOnly ? "" : "/all"),
			context: this,
			dataType: "json",
			headers: {
				"X-DEVICE-ID": this.device.id
			},
			success: function(importObj, status, jqXHR) {
				// A 302 Not Modified returns undefined, so we need to get the JSON from the jqXHR object instead
				if (importObj === undefined) {
					importObj = $.parseJSON(jqXHR.responseText);
				}

				// Calculate an MD5 sum of the JSON returned
				var hash = hex_md5(JSON.stringify(importObj));

				// Get the Etag value returned by the server
				var returnedHash = jqXHR.getResponseHeader("Etag").replace(/\"/g, "");

				//TODO: Hack for dealing with heroku timeouts...this will be fixed/removed later
				returnedHash = hash;

				// Compare the Etag with the MD5 sum we calculated
				if (hash === returnedHash) {
					// Only proceed if there are objects to import
					if (importObj.length > 0) {
						this.objectsToImport = importObj.length;
						
						// Update the import progress message
						$("#status").val("Imported " + this.objectsImported + " of " + this.objectsToImport);

						var	obj,
								pending,
								isPending;

						// Define a callback function for when each object is imported
						var saveCallback = $.proxy(function(type, isPending) {
							return $.proxy(function(id) {
								// No id supplied, so that's an error
								if (!id) {
									this.syncError("Save error", type, "Error saving " + type.toLowerCase());
								}

								// For Fast Import, clear any Sync record for the object just imported
								if (this.importChangesOnly) {
									var sync = new Sync(type, id);
									sync.remove();
								}

								// If the object imported was listed as a pending change for the current device, we can now clear the pending status
								if (isPending) {
									this.removePending(id, type);
								} else {
									// Object wasn't pending, so just continue
									this.dataImported();
								}
							}, this);
						}, this);

						// Iterate over the list of objects to be imported
						for (var i = 0; i < importObj.length; i++) {
							// Create an instance of the appropriate model from the JSON representation
							obj = window[importObj[i].doc.type].fromJson(importObj[i].doc);

							// Get the array of devices that the object is a pending change for
							pending = importObj[i].doc.pending;
							isPending = false;

							// Check if the current device is in the pending array
							if (pending) {
								for (var j = 0; j < pending.length; j++) {
									if (this.device.id === pending[j]) {
										isPending = true;
										break;
									}
								}
							}

							// If the object is flagged as deleted on the server, delete it from the local database
							if (importObj[i].doc.isDeleted) {
								obj.remove();

								// Manually invoke the callback, passing the id of the deleted object
								saveCallback(importObj[i].doc.type, isPending)(importObj[i].doc.id);
							} else {
								// Otherwise save the change to the local database
								obj.save(saveCallback(importObj[i].doc.type, isPending));
							}
						}
					} else {
						// No objects to import, which is only an error for Full Imports
						if (!this.importChangesOnly) {
							this.syncError("Receive error", "Sync", "No data found");
						}

						// Finalise the import
						this.importDone();
					}
				} else {
					// The has values didn't match, so that's an error
					this.syncError("Checksum mismatch", "Sync", "Expected: " + hash + ", got: " + returnedHash);

					// Finalise the import
					this.importDone();
				}
			},
			error: function(request, statusText, errorThrown) {
				// An error occurred getting the objects to import
				this.syncError("Receive error", "Sync", statusText + ", " + request.status + " (" + request.statusText + ")");

				// Finalise the import
				this.importDone();
			}
		});
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method removePending
 * @desc Clears the pending status for a given object and device
 * @param {String} id - Unique identifier of the pending object
 * @param {String} type - The type of pending object
 */
DataSyncController.prototype.removePending = function(id, type) {
	"use strict";

	// Send a DELETE request to the server, including the device ID in the request headers
	$.ajax({
		url: "/import/" + id,
		context: this,
		type: "DELETE",
		headers: {
			"X-DEVICE-ID": this.device.id
		},
		error: $.proxy(function(request, statusText) {
			// An error occurred with the delete
			this.syncError("Save error", type, "Error saving " + type.toLowerCase());
		}, this),
		complete: $.proxy(function() {
			// Continue processing
			this.dataImported();
		}, this)
	});
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method dataImported
 * @desc Updates the import progress message and checks if all objects have been imported
 */
DataSyncController.prototype.dataImported = function() {
	"use strict";

	// Increment the running total number of objects imported
	this.objectsImported++;

	// Update the import progress message
	$("#status").val("Imported " + this.objectsImported + " of " + this.objectsToImport);

	// Check if all objects have been imported
	if (this.objectsImported === this.objectsToImport) {
		// Finalise the import
		this.importDone();
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method importDone
 * @desc Finalises the data import
 */
DataSyncController.prototype.importDone = function() {
	"use strict";

	// Only proceed if all models are ready
	if (this.programsReady && this.seriesReady && this.episodesReady) {
		// Check for any sync errors
		if (0 === this.syncErrors.length) {
			// For Full Import, we need to mark the registered device as imported and manually clear any pending local changes
			if (!this.importChangesOnly) {
				// If the registered device had not previously performed a full import, mark it as having done so
				if (!this.device.imported) {
					this.device.imported = true;
					var device = new Setting("Device", JSON.stringify(this.device));
					device.save();
				}

				// Clear all pending local changes
				Sync.removeAll($.proxy(function(errorMessage) {
					if (errorMessage) {
						// Something went wrong, so display the error(s)
						this.syncError("Delete error", "Sync", errorMessage);
						this.showErrors();
					} else {
						// Mark the import as successful
						this.importSuccessful();
					}
				}, this));
			} else {
				// For Fast Import, Sync records were cleared as we went, so just mark the import as successful
				this.importSuccessful();
			}
		} else {
			// There were errors, so display them
			this.showErrors();
		}
	}
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method importSuccessful
 * @desc Updates the last sync time and the number of local changes to be synced, and calls the success handler
 */
DataSyncController.prototype.importSuccessful = function() {
	"use strict";

	// Update the last sync time
	this.setLastSyncTime();
	
	// Update the number of local changes to be synced
	Sync.count($.proxy(this.checkForLocalChanges, this));

	// Hide the errors container
	$("#syncErrors").hide();

	// Call the success handler
	this.callback(true);
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method syncError
 * @desc Adds an error to the list of sync errors
 * @param {String} error - the type of error
 * @param {String} type - the type of object that the error relates to
 * @param {String} id - the unique identifier of the object that the error relates to
 * @param {String} message - the error message
 */
DataSyncController.prototype.syncError = function(error, type, message, id) {
	"use strict";

	// Append the error to the list
	this.syncErrors.push($("<li>").html(error + "<br/>Type: " + type + (id ? " " + id : "")	+ "<br/>" + message));
};

/**
 * @memberof DataSyncController
 * @this DataSyncController
 * @instance
 * @method showErrors
 * @desc Displays the errors container
 */
DataSyncController.prototype.showErrors = function() {
	"use strict";

	// Clear any existing errors and replace with the current errors list
	$("#errorList")
		.empty()
		.append.apply($("#errorList"), this.syncErrors);

	// Display the errors container
	$("#syncErrors").show();

	// Update the height so that the errors list is scrollable inside the container
	$("#errorList").height(window.innerHeight - $("#errorList").offset().top - 10);

	// Call the error handler
	this.callback(false);
};
