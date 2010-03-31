function DataSyncController() {

}

DataSyncController.prototype.setup = function() {
    this.header = {
        label: "Import/Export",
        leftButton: {
            eventHandler: this.goBack.bind(this),
            style: "backButton",
            label: "Settings"
        }
    };

		this.activate();
}

DataSyncController.prototype.activate = function() {
		$("import").addEventListener('click', this.dataImport.bind(this));
		$("export").addEventListener('click', this.dataExport.bind(this));
		$("localChanges").value = "Checking...";

		Setting.get("LastSyncTime", this.gotLastSyncTime.bind(this));
		Setting.get("LastSyncHash", this.gotLastSyncHash.bind(this));

		appController.toucheventproxy.enabled = false;
		appController.refreshScroller();
}

DataSyncController.prototype.goBack = function() {
    appController.popView();
}

DataSyncController.prototype.gotLastSyncTime = function(lastSyncTime) {
	if (lastSyncTime.settingValue) {
		var months = {0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" }
		var lastSyncDisplay = new Date(lastSyncTime.settingValue);
		lastSyncDisplay = lastSyncDisplay.getDate() + "-" + months[lastSyncDisplay.getMonth()] + "-" + lastSyncDisplay.getFullYear() + " " + lastSyncDisplay.getHours() + ":" + lastSyncDisplay.getMinutes() + ":" + lastSyncDisplay.getSeconds();
		$("lastSyncTime").value = lastSyncDisplay;
	} else {
		$("lastSyncTime").value = "Unknown";
	}
}

DataSyncController.prototype.gotLastSyncHash = function(lastSyncHash) {
	if (lastSyncHash) {
		this.lastSyncHash = lastSyncHash;
		this.toJson("", this.checkForLocalChanges.bind(this));
	} else {
		this.callback(false)
	}
}

DataSyncController.prototype.checkForLocalChanges = function(data) {
	this.localChanges = (data.hash != this.lastSyncHash.settingValue);
	
	if (this.localChanges) {
		$("localChanges").value = "Data changed since last sync";
	} else {
		$("localChanges").value = "No changes since last sync";
	}
}

DataSyncController.prototype.dataExport = function() {
	if (!this.exporting) {
		this.exporting = true;
		$("statusRow").style.display = "block";
		$("status").value = "Starting export";

		this.callback =	function(successful) {
			var label = "Database has been successfully exported.";

			if (successful) {
				$("statusRow").style.display = "none";
			} else {
				label = "Export failed.";
			}

			appController.showNotice({
				label: label,
				leftButton: {
					eventHandler: appController.hideNotice.bind(this),
					style: "redButton",
					label: "OK"
				}
			});

			this.exporting = false;
		}.bind(this)

		if (window.confirm("Are you sure you want to export?")) {
			this.toJson("Exported", this.doExport.bind(this));
		} else {
			$("status").value = "Export aborted";
			this.callback(false);
		}
	} else {
		$("status").value = "An export is already running";
	}
}

DataSyncController.prototype.dataImport = function() {
	if (!this.importing) {
		this.importing = true;
		$("statusRow").style.display = "block";
		$("status").value = "Starting import";

		this.callback = function(successful) {
			var label = "Database has been successfully imported.";

			if (successful) {
				$("statusRow").style.display = "none";
			} else {
				label = "Import failed.";
			}

			appController.showNotice({
				label: label,
				leftButton: {
					eventHandler: appController.hideNotice.bind(this),
					style: "redButton",
					label: "OK"
				}
			});

			this.importing = false;
		}.bind(this)

		var prompt = "";
		if (this.localChanges) {
			prompt = "Warning: Local changes have been made. ";
		}

		if (window.confirm(prompt + "Are you sure you want to import?")) {
			this.doImport();
		} else {
			$("status").value = "Import aborted";
			this.callback(false);
		}
	} else {
		$("status").value = "An import is already running";
	}
}

DataSyncController.prototype.toJson = function(statusBarAction, callback) {
	Program.list(function(programs) {
		var exportObj = { programs: [] };

		if (programs.length === 0) {
			callback();
		} else {
			var completed = 0;

			for (var i = 0; i < programs.length; i++) {
				$("status").value = statusBarAction + " " + completed + " of " + programs.length;
				exportObj.programs.push({});
				programs[i].toJson(function(index) {
					return function(programJson) {
						exportObj.programs[index] = programJson;
						completed++;
						$("status").value = statusBarAction + " " + completed + " of " + programs.length;
						if (completed === programs.length) {
							$("status").value = "Calculating checksum";
							var json = Object.toJSON(exportObj);
							var pos = 0
							var hash = "";
							while (pos < json.length) {
								hash += hex_md5(json.substr(pos, 10000));
								pos += 10000;
							}

							callback({json: json, hash: hash});
						}
					}.bind(this);
				}.bind(this)(i));
			}
		}
	}.bind(this));
}

DataSyncController.prototype.verifyData = function(data) {
	if (data) {
		new Ajax.Request("getChecksum.asp", {
			method: "get",
			contentType: "text/plain",
			onSuccess: function(response) {
				$("status").value = "Verifying data";
				if (data.hash.valueOf() === response.responseText) {
					$("status").value = "Verify complete";
					this.setLastSyncTime();
					var lastSyncHash = new Setting("LastSyncHash", data.hash);
					lastSyncHash.save(this.callback);
				} else {
					$("status").value = "Verify failed: Checksum mismatch";
					this.callback(false);
				}
			}.bind(this),
			onFailure: function(response) {
				$("status").value = "Verify failed: " + response.statusText;
				this.callback(false);
			}.bind(this)
		});
	} else {
		$("status").value = "Verify failed: No programs found";
		this.callback(false);
	}
}

DataSyncController.prototype.setLastSyncTime = function() {
	var now = new Date();
	var lastSyncTime = new Setting("LastSyncTime", now);
	lastSyncTime.save();
	this.gotLastSyncTime(lastSyncTime);
}

DataSyncController.prototype.doExport = function(data) {
	$("status").value = "Sending data to server";
	new Ajax.Request("export.asp", {
		contentType: "text/plain",
		postBody: data.json,
		onSuccess: function() {
			$("status").value = "Sent data to server";
			this.verifyData(data);
		}.bind(this),
		onFailure: function(response) {
			$("status").value = "Export failed: " + response.statusText;
			this.callback(false);
		}.bind(this)
	});
}

DataSyncController.prototype.doImport = function() {
	new Ajax.Request("export/export.txt", {method: "get", contentType: "text/plain",
		onSuccess:	function(response) {
			var importObj = String(response.responseText).evalJSON();
			var programsCompleted = 0;

			if (importObj.programs.length > 0) {
				$("status").value = "Imported " + programsCompleted + " of " + importObj.programs.length;
				db.transaction(
					function(tx) {
						tx.executeSql("DELETE FROM Episode", []);
						tx.executeSql("DELETE FROM Series", []);
						tx.executeSql("DELETE FROM Program", []);
					}.bind(this),
					function() {}.bind(this),
					function() {
						for (var i = 0; i < importObj.programs.length; i++) {
							var importProgram = importObj.programs[i];
							var program = new Program(null, importProgram.programName);
							program.save(function(importProgram) {
								return function(programId) {
									if (programId) {
										var seriesCompleted = 0;

										if (importProgram.seriesList.length > 0) {
											for (var j = 0; j < importProgram.seriesList.length; j++) {
												var importSeries = importProgram.seriesList[j];
												var series = new Series(null, importSeries.seriesName, importSeries.nowShowing, programId);
												series.save(function(importSeries) {
													return function(seriesId) {
														if (seriesId) {
															for (var k = 0; k < importSeries.episodes.length; k++) {
																var importEpisode = importSeries.episodes[k];
																var episode = new Episode(null, importEpisode.episodeName, importEpisode.status, importEpisode.statusDate, importEpisode.unverified, importEpisode.unscheduled, seriesId);
																episode.save();
															}
															seriesCompleted++;
															if (seriesCompleted === importProgram.seriesList.length) {
																programsCompleted++;
																$("status").value = "Imported " + programsCompleted + " of " + importObj.programs.length;
																if (programsCompleted === importObj.programs.length) {
																	this.toJson("Verifiying", this.verifyData.bind(this));
																}
															}
														} else {
															$("status").value = "Error saving series: " + series.seriesName;
															this.callback(false);
														}
													}.bind(this);
												}.bind(this)(importSeries));
											}
										} else {
											programsCompleted++;
											$("status").value = "Imported " + programsCompleted + " of " + importObj.programs.length;
											if (programsCompleted === importObj.programs.length) {
												this.toJson("Verifiying", this.verifyData.bind(this));
											}
										}
									} else {
										$("status").value = "Error saving program: " + program.programName;
										this.callback(false);
									}
								}.bind(this);
							}.bind(this)(importProgram));
						}
					}.bind(this)
				);
			} else {
				$("status").value = "Import failed: No programs found";
				this.callback(false);
			}
		}.bind(this),
		onFailure: function(response) {
			$("status").value = "Import failed: " + response.statusText;
			this.callback(false);
		}.bind(this)
	});
}