function DataSyncController() {

}

DataSyncController.prototype.dataExport = function(callback) {
	Program.list(function(programs) {
		var json = { programs: [] };

		if (programs.length === 0) {
			callback(false);
		} else {
			var completed = 0;

			for (var i = 0; i < programs.length; i++) {
				json.programs.push({});
				programs[i].toJson(function(index) {
					return function(programJson) {
						json.programs[index] = programJson;
						completed++;
						if (completed === programs.length) {
							new Ajax.Request("export.asp", {contentType: "text/plain", postBody: Object.toJSON(json), onComplete: function() { callback(true); }.bind(this) });
						}
					}.bind(this);
				}.bind(this)(i));
			}
		}
	}.bind(this));
}

DataSyncController.prototype.dataImport = function(statusBar, callback) {
	new Ajax.Request("export/export.txt", {method: "get", contentType: "text/plain",
		onSuccess:	function(response) {
			var importObj = String(response.responseText).evalJSON();
			var programsCompleted = 0;

			if (importObj.programs.length > 0) {
				statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
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
																statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
																if (programsCompleted === importObj.programs.length) {
																	callback(true);
																}
															}
														} else {
															callback(false);
														}
													}.bind(this);
												}.bind(this)(importSeries));
											}
										} else {
											programsCompleted++;
											statusBar.value = "Imported " + programsCompleted + " of " + importObj.programs.length;
											if (programsCompleted === importObj.programs.length) {
												callback(true);
											}
										}
									} else {
										callback(false);
									}
								}.bind(this);
							}.bind(this)(importProgram));
						}
					}.bind(this)
				);
			} else {
				callback(false);
			}
		}.bind(this),
		onFailure: function() {
			callback(false);
		}.bind(this)
	});
}

