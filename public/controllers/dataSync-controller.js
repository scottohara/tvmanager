var DataSyncController = function () {
};

DataSyncController.prototype.setup = function() {
    this.header = {
        label: "Import/Export",
        leftButton: {
            eventHandler: this.goBack,
            style: "backButton",
            label: "Settings"
        }
    };

		this.activate();
};

DataSyncController.prototype.activate = function() {
		$("#import").bind('click', $.proxy(this.dataImport, this));
		$("#export").bind('click', $.proxy(this.dataExport, this));
		$("#localChanges").val("Checking...");

		Setting.get("LastSyncTime", this.gotLastSyncTime);
		Sync.count($.proxy(this.checkForLocalChanges, this));
};

DataSyncController.prototype.goBack = function() {
    appController.popView();
};

DataSyncController.prototype.gotLastSyncTime = function(lastSyncTime) {
	if (lastSyncTime.settingValue) {
		var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };
		var lastSyncDisplay = new Date(lastSyncTime.settingValue);
		var lastSyncHours = "0" + lastSyncDisplay.getHours();
		var lastSyncMinutes = "0" + lastSyncDisplay.getMinutes();
		var lastSyncSeconds = "0" + lastSyncDisplay.getSeconds();
		lastSyncDisplay = lastSyncDisplay.getDate() + "-" + months[lastSyncDisplay.getMonth()] + "-" + lastSyncDisplay.getFullYear() + " " + lastSyncHours.substr(lastSyncHours.length-2) + ":" + lastSyncMinutes.substr(lastSyncMinutes.length-2) + ":" + lastSyncSeconds.substr(lastSyncSeconds.length-2);
		$("#lastSyncTime").val(lastSyncDisplay);
	} else {
		$("#lastSyncTime").val("Unknown");
	}
};

DataSyncController.prototype.checkForLocalChanges = function(count) {
	this.localChanges = (count > 0);
	if (this.localChanges) {
		$("#localChanges").val(count + " change" + (count > 1 ? "s" : "") + " to be synced");
	} else {
		$("#localChanges").val("No changes to be synced");
	}
};

DataSyncController.prototype.dataExport = function() {
	if (!this.exporting) {
		this.exporting = true;
		$("#statusRow").show();
		$("#status").val("Starting export");

		this.callback =	$.proxy(function(successful) {
			var label = "Database has been successfully exported.";

			if (successful) {
				$("#statusRow").hide();
			} else {
				label = "Export failed.";
			}

			appController.showNotice({
				label: label,
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});

			this.exporting = false;
		}, this);

		if (window.confirm("Are you sure you want to export?")) {
			Sync.list($.proxy(this.listRetrieved, this));
		} else {
			$("#status").val("Export aborted");
			this.callback(false);
		}
	} else {
		$("#status").val("An export is already running");
	}
};

DataSyncController.prototype.dataImport = function() {
	if (!this.importing) {
		this.importing = true;
		$("#statusRow").show();
		$("#status").val("Starting import");

		this.callback = $.proxy(function(successful) {
			var label = "Database has been successfully imported.";

			if (successful) {
				$("#statusRow").hide();
			} else {
				label = "Import failed.";
			}

			appController.showNotice({
				label: label,
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});

			this.importing = false;
		}, this);

		var prompt = "";
		if (this.localChanges) {
			prompt = "Warning: Local changes have been made. ";
		}

		if (window.confirm(prompt + "Are you sure you want to import?")) {
			this.doImport();
		} else {
			$("#status").val("Import aborted");
			this.callback(false);
		}
	} else {
		$("#status").val("An import is already running");
	}
};

DataSyncController.prototype.listRetrieved = function(syncList) {
	this.syncProcessed = 0;
	this.syncErrors = [];
	this.syncList = syncList;

	for (var i = 0; i < this.syncList.length; i++) {
		if ("modified" === this.syncList[i].action) {
			this.sendChange(this.syncList[i]);
		} else if ("deleted" === this.syncList[i].action) {
			this.sendDelete(this.syncList[i]);
		}
	}
};

DataSyncController.prototype.sendChange = function(sync) {
	window[sync.type].find(sync.id, $.proxy(function(instance) {
		instance = instance.toJson();
		instance.type = sync.type;
		var json = JSON.stringify(instance);
		var hash = hex_md5(json);

		$.ajax({
			url: "/export",
			context: this,
			type: "POST",
			headers: { "Content-MD5": hash },
			data: json,
			success: function(exportResponse, status, jqXHR) {
				var returnedHash = jqXHR.getResponseHeader("Etag").replace(/\"/g, "");
				if (hash === returnedHash) {
					sync.remove();
				} else {
					this.syncError("Checksum mismatch", sync.type, "Expected: " + hash + ", got: " + returnedHash, sync.id);
				}
			},
			error: function(request, statusText) {
				this.syncError("Send error", sync.type, statusText + ", " + request.status + " (" + request.statusText + ")", sync.id);
			},
			complete: $.proxy(this.changeSent, this)
		});
	}, this));
};

DataSyncController.prototype.sendDelete = function(sync){
	$.ajax({
		url: "/export/" + sync.id,
		context: this,
		type: "DELETE",
		success: function(exportResponse, status, jqXHR) {
			sync.remove();
		},
		error: function(request, statusText) {
			this.syncError("Delete error", sync.type, statusText + ", " + request.status + " (" + request.statusText + ")", sync.id);
		},
		complete: $.proxy(this.changeSent, this)
	});
};

DataSyncController.prototype.changeSent = function() {
	this.syncProcessed++;
	$("#status").val("Exported " + this.syncProcessed + " of " + this.syncList.length + " changes");
	if (this.syncProcessed === this.syncList.length) {
		this.setLastSyncTime();
		Sync.count($.proxy(this.checkForLocalChanges, this));
		if (0 === this.syncErrors.length) {
			$("#syncErrors").hide();
			this.callback(true);
		} else {
			this.showErrors();
		}
	}
};

DataSyncController.prototype.setLastSyncTime = function() {
	var now = new Date();
	var lastSyncTime = new Setting("LastSyncTime", now);
	lastSyncTime.save();
	this.gotLastSyncTime(lastSyncTime);
};

DataSyncController.prototype.doImport = function() {
	this.syncErrors = [];

	Program.removeAll($.proxy(function(errorMessage) {
		this.programsReady = true;
		if (errorMessage) {
			this.syncError("Delete error", "Program", errorMessage);
			this.importDone();
		} else {
			this.importData();
		}
	}, this));
	
	Series.removeAll($.proxy(function(errorMessage) {
		this.seriesReady = true;
		if (errorMessage) {
			this.syncError("Delete error", "Series", errorMessage);
			this.importDone();
		} else {
			this.importData();
		}
	}, this));

	Episode.removeAll($.proxy(function(errorMessage) {
		this.episodesReady = true;
		if (errorMessage) {
			this.syncError("Delete error", "Episode", errorMessage);
			this.importDone();
		} else {
			this.importData();
		}
	}, this));
};

DataSyncController.prototype.importData = function() {
	if (this.programsReady && this.seriesReady && this.episodesReady) {
		this.objectsToImport = 0;
		this.objectsImported = 0;

		$.ajax({
			url: "/import",
			context: this,
			dataType: "json",
			success: function(importObj, status, jqXHR) {
				if (importObj === undefined) {
					importObj = $.parseJSON(jqXHR.responseText);
				}

				var hash = hex_md5(JSON.stringify(importObj));
				var returnedHash = jqXHR.getResponseHeader("Etag").replace(/\"/g, "");
				if (hash === returnedHash) {
					if (importObj.length > 0) {
						this.objectsToImport = importObj.length;
						$("#status").val("Imported " + this.objectsImported + " of " + this.objectsToImport + " ");
						var obj;

						var saveCallback = $.proxy(function(type) {
							return $.proxy(function(id) {
								if (!id) {
									this.syncError("Save error", type, "Error saving " + type.toLowerCase());
								}
								this.objectsImported++;
								$("#status").val("Imported " + this.objectsImported + " of " + this.objectsToImport + " ");
								if (this.objectsImported === this.objectsToImport) {
									this.importDone();
								}
							}, this);
						}, this);

						for (var i = 0; i < importObj.length; i++) {
							obj = window[importObj[i].doc.type].fromJson(importObj[i].doc);
							obj.save(saveCallback(importObj[i].doc.type));
						}
					} else {
						this.syncError("Receive error", "Sync", "No data found");
						this.importDone();
					}
				} else {
					this.syncError("Checksum mismatch", "Sync", "Expected: " + hash + ", got: " + returnedHash);
					this.importDone();
				}
			},
			error: function(request, statusText, errorThrown) {
				this.syncError("Receive error", "Sync", statusText + ", " + request.status + " (" + request.statusText + ")");
				this.importDone();
			}
		});
	}
};

DataSyncController.prototype.importDone = function() {
	if (this.programsReady && this.seriesReady && this.episodesReady) {
		if (0 === this.syncErrors.length) {
			Sync.removeAll($.proxy(function(errorMessage) {
				if (errorMessage) {
					this.syncError("Delete error", "Sync", errorMessage);
					this.showErrors();
				} else {
					this.setLastSyncTime();
					Sync.count($.proxy(this.checkForLocalChanges, this));
					$("#syncErrors").hide();
					this.callback(true);
				}
			}, this));
		} else {
			this.showErrors();
		}
	}
};

DataSyncController.prototype.syncError = function(error, type, message, id) {
	this.syncErrors.push($("<li>").html(error + "<br/>Type: " + type + (id ? " " + id : "")	+ "<br/>" + message));
};

DataSyncController.prototype.showErrors = function() {
	$("#errorList")
		.empty()
		.append.apply($("#errorList"), this.syncErrors);
	$("#syncErrors").show();
	$("#errorList").height(window.innerHeight - $("#errorList").offset().top - 10);
	this.callback(false);
};
