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
		if (!this.id) {
			this.id = uuid.v4();
		}

		tx.executeSql("REPLACE INTO Program (ProgramID, Name) VALUES (?, ?)", [this.id, this.programName], $.proxy(function(tx, resultSet) {
			if (!resultSet.rowsAffected) {
				throw new Error("no rows affected");
			}

			tx.executeSql("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Program', ?, 'modified')", [this.id],
				$.proxy(function() {
					if (callback) {
						callback(this.id);
					}
				}, this),
				function(tx, error) {
					throw error;
				}
			);
		}, this));
	}, this),
	function(error) {
		if (callback) {
			callback();
		}
		return "Program.save: " + error.message;
	});
};

Program.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ?)", [this.id]);
			tx.executeSql("DELETE FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ?)", [this.id]);
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'deleted' FROM Series WHERE ProgramID = ?", [this.id]);
			tx.executeSql("DELETE FROM Series WHERE ProgramID = ?", [this.id]);
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Program', ?, 'deleted')", [this.id]);
			tx.executeSql("DELETE FROM Program WHERE ProgramID = ?", [this.id]);
		}, this),
		null,
		$.proxy(function() {
			this.id = null;
			this.programName = null;
		}, this));
	}
};

Program.prototype.toJson = function() {
	return {
		id: this.id,
		programName: this.programName
	};
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
		tx.executeSql("SELECT p.ProgramID, p.Name, COUNT(DISTINCT s.SeriesID) AS SeriesCount, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e on s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY p.ProgramID ORDER BY p.Name", [],
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var prog = resultSet.rows.item(i);
					programList.push(new Program(prog.ProgramID, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount));
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

Program.find = function(id, callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT ProgramID, Name FROM Program WHERE ProgramID = ?", [id],
			function(tx, resultSet) {
				var prog = resultSet.rows.item(0);
				callback(new Program(prog.ProgramID, prog.Name));
			},
			function(tx, error) {
				callback(null);
				return "Program.find: " + error.message;
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

Program.removeAll = function(callback) {
	appController.db.transaction(function(tx) {
		tx.executeSql("DELETE FROM Program", [],
			function(tx, resultSet) {
				callback();
			},
			function(tx, error) {
				var message = "Program.removeAll: " + error.message;
				callback(message);
				return message;
			}
		);
	});
};

Program.fromJson = function(program) {
	return new Program(program.id, program.programName);
};
