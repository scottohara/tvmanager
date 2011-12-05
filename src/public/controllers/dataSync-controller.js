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
		Setting.get("LastSyncHash", $.proxy(this.gotLastSyncHash, this));
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

DataSyncController.prototype.gotLastSyncHash = function(lastSyncHash) {
	if (lastSyncHash) {
		this.lastSyncHash = lastSyncHash;
		this.toJson("", $.proxy(this.checkForLocalChanges, this));
	} else {
		$("#localChanges").val("Unknown");
	}
};

DataSyncController.prototype.checkForLocalChanges = function(data) {
  if (data) {
		this.localChanges = (data.hash !== this.lastSyncHash.settingValue);
	
		if (this.localChanges) {
			$("#localChanges").val("Data changed since last sync");
		} else {
			$("#localChanges").val("No changes since last sync");
		}
	} else {
		this.localChanges = false;
		$("#localChanges").val("No data");
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
			this.toJson("Exported", $.proxy(this.doExport, this));
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

DataSyncController.prototype.toJson = function(statusBarAction, callback) {
	Program.list(function(programs) {
		var exportObj = {
			databaseVersion: appController.db.version,
			programs: []
		};

		if (0 === programs.length) {
			callback();
		} else {
			var completed = 0;

			var programRetrieved = function(index) {
				return function(programJson) {
					exportObj.programs[index] = programJson;
					completed++;
					$("#status").val(statusBarAction + " " + completed + " of " + programs.length);
					if (completed === programs.length) {
						$("#status").val("Calculating checksum");
						var json = JSON.stringify(exportObj);
						hash = hex_md5(json);
						callback({json: json, hash: hash});
					}
				};
			};

			for (var i = 0; i < programs.length; i++) {
				$("#status").val(statusBarAction + " " + completed + " of " + programs.length);
				exportObj.programs.push({});
				programs[i].toJson(programRetrieved(i));
			}
		}
	});
};

DataSyncController.prototype.verifyData = function(data, hash) {
	if (data) {
		$("#status").val("Verifying data");
		if (data.hash.valueOf() === hash.valueOf()) {
			$("#status").val("Verify complete");
			this.setLastSyncTime();
			var lastSyncHash = new Setting("LastSyncHash", data.hash);
			lastSyncHash.save(this.callback);
		} else {
			$("#status").val("Verify failed: Checksum mismatch (" + data.hash + " != " + hash + ")");
			this.callback(false);
		}
	} else {
		$("#status").val("Verify failed: No programs found");
		this.callback(false);
	}
};

DataSyncController.prototype.setLastSyncTime = function() {
	var now = new Date();
	var lastSyncTime = new Setting("LastSyncTime", now);
	lastSyncTime.save();
	this.gotLastSyncTime(lastSyncTime);
};

DataSyncController.prototype.doExport = function(data) {
	$("#status").val("Sending data to server");
	$.ajax({
		url: "export",
		context: this,
		type: "POST",
		headers: { "Content-MD5": data.hash },
		data: data.json,
		success: function(exportResponse, status, jqXHR) {
			$("#status").val("Sent data to server");
			this.verifyData(data, jqXHR.getResponseHeader("Etag").replace(/\"/g, ""));
		},
		error: function(request, statusText) {
			$("#status").val("Export failed: " + statusText + ", " + request.status + " (" + request.statusText + ")");
			this.callback(false);
		}
	});
};

DataSyncController.prototype.doImport = function() {
	$.ajax({
		url: "import",
		context: this,
		dataType: "json",
		success: function(importObj, status, jqXHR) {
			if (importObj === undefined) {
				importObj = $.parseJSON(jqXHR.responseText);
			}
			
			if (importObj.databaseVersion === appController.db.version) {
				var programsCompleted = 0;

				if (importObj.programs.length > 0) {
					$("#status").val("Imported " + programsCompleted + " of " + importObj.programs.length);
					appController.db.transaction(
						function(tx) {
							tx.executeSql("DELETE FROM Episode", []);
							tx.executeSql("DELETE FROM Series", []);
							tx.executeSql("DELETE FROM Program", []);
						},
						$.proxy(function(error) {
							$("#status").val("Import failed: " + error.message);
							this.callback(false);
						}, this),
						$.proxy(function() {
							var program;

							var programSaved = $.proxy(function(importProgram) {
								return $.proxy(function(programId) {
									if (programId) {
										var seriesCompleted = 0;

										if (importProgram.seriesList.length > 0) {
											var series;

											var seriesSaved = $.proxy(function(importSeries) {
												return $.proxy(function(seriesId) {
													if (seriesId) {
														for (var k = 0; k < importSeries.episodes.length; k++) {
															var importEpisode = importSeries.episodes[k];
															var episode = new Episode(null, importEpisode.episodeName, importEpisode.status, importEpisode.statusDate, importEpisode.unverified, importEpisode.unscheduled, importEpisode.sequence, seriesId);
															episode.save();
														}
														seriesCompleted++;
														if (seriesCompleted === importProgram.seriesList.length) {
															programsCompleted++;
															$("#status").val("Imported " + programsCompleted + " of " + importObj.programs.length);
															if (programsCompleted === importObj.programs.length) {
																this.toJson("Verifiying", $.proxy(function(data) {
																	this.verifyData(data, jqXHR.getResponseHeader("Etag").replace(/\"/g, ""));
																}, this));
															}
														}
													} else {
														$("#status").val("Error saving series: " + series.seriesName);
														this.callback(false);
													}
												}, this);
											}, this);

											for (var j = 0; j < importProgram.seriesList.length; j++) {
												var importSeries = importProgram.seriesList[j];
												series = new Series(null, importSeries.seriesName, importSeries.nowShowing, programId);
												series.save(seriesSaved(importSeries));
											}
										} else {
											programsCompleted++;
											$("#status").val("Imported " + programsCompleted + " of " + importObj.programs.length);
											if (programsCompleted === importObj.programs.length) {
												this.toJson("Verifiying", $.proxy(function(data) {
													this.verifyData(data, jqXHR.getResponseHeader("Etag").replace(/\"/g, ""));
												}, this));
											}
										}
									} else {
										$("#status").val("Error saving program: " + program.programName);
										this.callback(false);
									}
								}, this);
							}, this);

							for (var i = 0; i < importObj.programs.length; i++) {
								var importProgram = importObj.programs[i];
								program = new Program(null, importProgram.programName);
								program.save(programSaved(importProgram));
							}
						}, this)
					);
				} else {
					$("#status").val("Import failed: No programs found");
					this.callback(false);
				}
			} else {
					$("#status").val("Can't import v" + importObj.databaseVersion + " file into v" +  appController.db.version + " database");
					this.callback(false);
			}
		},
		error: function(request, statusText, errorThrown) {
			$("#status").val("Import failed: " + statusText + ", " + request.status + " (" + request.statusText + ")");
			this.callback(false);
		}
	});
};
