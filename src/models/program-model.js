var Program = function (id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount) {
	this.id = id;
	this.setProgramName(programName);
	this.seriesCount = seriesCount;
	this.progressBar = new ProgressBar(episodeCount, []);
	this.setEpisodeCount(episodeCount);
	this.setWatchedCount(watchedCount);
	this.setRecordedCount(recordedCount);
	this.setExpectedCount(expectedCount);
};

Program.prototype.save = function(callback) {
	appController.db.transaction($.proxy(function(tx) {
		var sql;
		var params;

		if (this.id) {
			sql = "UPDATE Program SET Name = ? WHERE rowid = ?";
			params = [this.programName, this.id];
		} else {
			sql = "INSERT INTO Program (Name) VALUES (?)";
			params = [this.programName];
		}

		tx.executeSql(sql, params,
			$.proxy(function(tx, resultSet) {
				if (!resultSet.rowsAffected) {
					if (callback) {
						callback();
					}
					throw new Error("Program.save: no rows affected");
				}

				if (!this.id) {
					this.id = resultSet.insertId;
				}

				if (callback) {
					callback(this.id);
				}
			}, this),
			function(tx, error) {
				if (callback) {
					callback();
				}
				return "Program.save: " + error.message;
			}
		);
	}, this));
};

Program.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("DELETE FROM Episode WHERE SeriesID IN (SELECT rowid FROM Series WHERE ProgramID = ?)", [this.id]);
			tx.executeSql("DELETE FROM Series WHERE ProgramID = ?", [this.id]);
			tx.executeSql("DELETE FROM Program WHERE rowid = ?", [this.id]);
		}, this),
		null,
		$.proxy(function() {
			this.id = null;
			this.programName = null;
		}, this));
	}
};

Program.prototype.toJson = function(callback) {
	Series.listByProgram(this.id, $.proxy(function(seriesList) {
		var json = {
			programName: this.programName,
			seriesList: []
		};

		if (0 === seriesList.length) {
			callback(json);
		} else {
			var completed = 0;

			for (var i = 0; i < seriesList.length; i++) {
				json.seriesList.push({});
				seriesList[i].toJson((function(index) {
					return function(seriesJson) {
						json.seriesList[index] = seriesJson;
						completed++;
						if (completed === seriesList.length) {
							callback(json);
						}
					};
				}(i)));
			}
		}
	}, this));
};

Program.prototype.setProgramName = function(programName) {
	this.programName = programName;
	this.programGroup = programName.substring(0,1).toUpperCase();
};

Program.prototype.setEpisodeCount = function(count) {
	this.episodeCount = count;
	this.progressBar.setTotal(this.episodeCount);
	this.setWatchedProgress();
};

Program.prototype.setWatchedCount = function(count) {
	this.watchedCount = count;
	this.setWatchedProgress();
};

Program.prototype.setWatchedProgress = function() {
	var watchedPercent = 0;
	if (this.watchedCount && this.watchedCount > 0) {
		watchedPercent = this.watchedCount / this.episodeCount * 100;
	}

	this.progressBarDisplay = this.progressBar.setSection(0, {
		label: this.watchedCount,
		percent: watchedPercent,
		style: "watched"
	});
};

Program.prototype.setRecordedCount = function(count) {
	this.recordedCount = count;
	var recordedPercent = 0;
	if (this.recordedCount && this.recordedCount > 0) {
		recordedPercent = this.recordedCount / this.episodeCount * 100;
	}

	this.progressBarDisplay = this.progressBar.setSection(1, {
		label: this.recordedCount,
		percent: recordedPercent,
		style: "recorded"
	});
};

Program.prototype.setExpectedCount = function(count) {
	this.expectedCount = count;
	var expectedPercent = 0;
	if (this.expectedCount && this.expectedCount > 0) {
		expectedPercent = this.expectedCount / this.episodeCount * 100;
	}

	this.progressBarDisplay = this.progressBar.setSection(2, {
		label: this.expectedCount,
		percent: expectedPercent,
		style: "expected"
	});
};

Program.list = function(callback) {
	var programList = [];

	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT p.rowid, p.Name, COUNT(DISTINCT s.rowid) AS SeriesCount, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.rowid = s.ProgramID LEFT OUTER JOIN Episode e on s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY p.rowid ORDER BY p.Name", [],
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var prog = resultSet.rows.item(i);
					programList.push(new Program(prog.rowid, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount));
				}
				callback(programList);
			},
			function(tx, error) {
				callback(programList);
				return "Program.list: " + error.message;
			}
		);
	});
};

Program.count = function(callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS ProgramCount FROM Program", [],
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).ProgramCount);
			},
			function(tx, error) {
				callback(0);
				return "Program.count: " + error.message;
			}
		);
	});
};