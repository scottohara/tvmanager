function DataSyncController() {

}

DataSyncController.prototype.dataExport = function(statusBar, callback) {
	this.statusBar = statusBar;
	this.callback = callback;

	if (window.confirm("Are you sure you want to export?")) {
		this.toJson("Exported", this.doExport.bind(this));
	} else {
		this.statusBar.value = "Export aborted";
		this.callback(false);
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
				this.statusBar.value = statusBarAction + " " + completed + " of " + programs.length;
				exportObj.programs.push({});
				programs[i].toJson(function(index) {
					return function(programJson) {
						exportObj.programs[index] = programJson;
						completed++;
						this.statusBar.value = statusBarAction + " " + completed + " of " + programs.length;
						if (completed === programs.length) {
							this.statusBar.value = "Calculating checksum";
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
				this.statusBar.value = "Verifying data";
				if (data.hash.valueOf() === response.responseText) {
					this.statusBar.value = "Verify complete";
					this.callback(true);
				} else {
					this.statusBar.value = "Verify failed: Checksum mismatch";
					this.callback(false);
				}
			}.bind(this),
			onFailure: function(response) {
				this.statusBar.value = "Verify failed: " + response.statusText;
				this.callback(false);
			}.bind(this)
		});
	} else {
		this.statusBar.value = "Verify failed: No programs found";
		this.callback(false);
	}
}

DataSyncController.prototype.doExport = function(data) {
	this.statusBar.value = "Sending data to server";
	new Ajax.Request("export.asp", {
		contentType: "text/plain",
		postBody: data.json,
		onSuccess: function() {
			this.statusBar.value = "Sent data to server";
			this.verifyData(data);
		}.bind(this),
		onFailure: function(response) {
			this.statusBar.value = "Export failed: " + response.statusText;
			this.callback(false);
		}.bind(this)
	});
}

DataSyncController.prototype.dataImport = function(statusBar, callback) {
	this.statusBar = statusBar;
	this.callback = callback;

	if (window.confirm("Are you sure you want to import?")) {
		new Ajax.Request("export/export.txt", {method: "get", contentType: "text/plain",
			onSuccess:	function(response) {
				var importObj = String(response.responseText).evalJSON();
				var programsCompleted = 0;

				if (importObj.programs.length > 0) {
					this.statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
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
																	var episode = new Episode(null, importEpisode.episodeName, seriesId, importEpisode.status, importEpisode.statusDate);
																	episode.save();
																}
																seriesCompleted++;
																if (seriesCompleted === importProgram.seriesList.length) {
																	programsCompleted++;
																	this.statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
																	if (programsCompleted === importObj.programs.length) {
																		this.toJson("Verifiying", this.verifyData.bind(this));
																	}
																}
															} else {
																this.statusBar.value = "Error saving series: " + series.seriesName;
																this.callback(false);
															}
														}.bind(this);
													}.bind(this)(importSeries));
												}
											} else {
												programsCompleted++;
												this.statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
												if (programsCompleted === importObj.programs.length) {
													this.toJson("Verifiying", this.verifyData.bind(this));
												}
											}
										} else {
											this.statusBar.value = "Error saving program: " + program.programName;
											this.callback(false);
										}
									}.bind(this);
								}.bind(this)(importProgram));
							}
						}.bind(this)
					);
				} else {
					this.statusBar.value = "Import failed: No programs found";
					this.callback(false);
				}
			}.bind(this),
			onFailure: function(response) {
				this.statusBar.value = "Import failed: " + response.statusText;
				this.callback(false);
			}.bind(this)
		});
	} else {
		this.statusBar.value = "Import aborted";
		this.callback(false);
	}
}