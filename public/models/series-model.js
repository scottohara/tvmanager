var Series = function (id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount) {
		this.id = id;
		this.seriesName = seriesName;
		this.setNowShowing(nowShowing);
		this.programId = programId;
		this.programName = programName;
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
		this.setMissedCount(missedCount);
		this.setStatusWarning(statusWarningCount);
};

Series.prototype.save = function(callback) {
	appController.db.transaction($.proxy(function(tx) {
		if (!this.id) {
			this.id = uuid.v4();
		}

		tx.executeSql("REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID) VALUES (?, ?, ?, ?)", [this.id, this.seriesName, this.nowShowing, this.programId],	$.proxy(function(tx, resultSet) {
			if (!resultSet.rowsAffected) {
				throw new Error("no rows affected");
			}

			tx.executeSql("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Series', ?, 'modified')", [this.id],
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
		return "Series.save: " + error.message;
	});
};

Series.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID = ?", [this.id]);
			tx.executeSql("DELETE FROM Episode WHERE SeriesID = ?", [this.id]);
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Series', ?, 'deleted')", [this.id]);
			tx.executeSql("DELETE FROM Series WHERE SeriesID = ?", [this.id]);
		}, this),
		null,
		$.proxy(function() {
			this.id = null;
			this.seriesName = null;
			this.nowShowing = null;
			this.programId = null;
		}, this));
	}
};

Series.prototype.toJson = function() {
	return {
		id: this.id,
		seriesName: this.seriesName,
		nowShowing: this.nowShowing,
		programId: this.programId
	};
};

Series.prototype.setNowShowing = function(nowShowing) {
	if (!nowShowing) {
		nowShowing = 0;
	}

	if (0 === parseInt(nowShowing, 10)) {
		this.nowShowing = null;
	} else {
		this.nowShowing = nowShowing;
	}

	this.nowShowingDisplay = Series.NOW_SHOWING[nowShowing];
};

Series.prototype.setEpisodeCount = function(count) {
	this.episodeCount = count;
	this.progressBar.setTotal(this.episodeCount);
	this.setWatchedProgress();
};

Series.prototype.setWatchedCount = function(count) {
	this.watchedCount = count;
	this.setWatchedProgress();
};

Series.prototype.setWatchedProgress = function() {
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

Series.prototype.setRecordedCount = function(count) {
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

Series.prototype.setExpectedCount = function(count) {
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

Series.prototype.setMissedCount = function(count) {
	this.missedCount = count;
	var missedPercent = 0;
	if (this.missedCount && this.missedCount > 0) {
		missedPercent = this.missedCount / this.episodeCount * 100;
	}

	this.progressBarDisplay = this.progressBar.setSection(3, {
		label: this.missedCount,
		percent: missedPercent,
		style: "missed"
	});
};

Series.prototype.setStatusWarning = function(count) {
	this.statusWarningCount = count;
	if (this.statusWarningCount > 0) {
		this.statusWarning = 'warning';
	}	else {
		this.statusWarning = '';
	}
};

Series.standardQuery = {
	baseData: "SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID",
	summaryData: "COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount",
	entityList: "FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'"
};

Series.listByProgram = function(programId, callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + " " + Series.standardQuery.entityList;
	var filter = "WHERE p.ProgramID = ? GROUP BY s.SeriesID ORDER BY s.Name";
	var params = [programId];
	Series.list(query, filter, params, callback);
};

Series.listByNowShowing = function(callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + ", SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount " + Series.standardQuery.entityList;
	var filter = "GROUP BY s.SeriesID HAVING s.NowShowing IS NOT NULL OR COUNT(e3.EpisodeID) > 0 OR COUNT(e4.EpisodeID) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name";
	var params = [];
	Series.list(query, filter, params, callback);
};

Series.listByStatus = function(callback, status) {
	var query = Series.standardQuery.baseData + ", COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e.EpisodeID) AS " + status + "Count FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID JOIN Episode e ON s.SeriesID = e.SeriesID";
	var filter = "WHERE e.Status = ? GROUP BY s.SeriesID ORDER BY p.Name, s.Name";
	var params = [status];
	Series.list(query, filter, params, callback);
};

Series.listByIncomplete = function(callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + " " + Series.standardQuery.entityList;
	var filter = "GROUP BY s.SeriesID HAVING COUNT(e.EpisodeID) > COUNT(e2.EpisodeID) AND COUNT(e2.EpisodeID) > 0 ORDER BY p.Name, s.Name";
	var params = [];
	Series.list(query, filter, params, callback);
};

Series.list = function(query, filter, params, callback) {
	var seriesList = [];

	appController.db.readTransaction(function(tx) {
		tx.executeSql(query + " " + filter, params,
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var series = resultSet.rows.item(i);
					seriesList.push(new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount));
				}
				callback(seriesList);
			},
			function(tx, error) {
				callback(seriesList);
				return "Series.list: " + error.message;
			}
		);
	});
};

Series.find = function(id, callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT SeriesID, Name, ProgramID, NowShowing FROM Series WHERE SeriesID = ?", [id],
			function(tx, resultSet) {
				var series = resultSet.rows.item(0);
				callback(new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID));
			},
			function(tx, error) {
				callback(null);
				return "Series.find: " + error.message;
			}
		);
	});
};

Series.count = function(callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS SeriesCount FROM Series", [],
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).SeriesCount);
			},
			function(tx, error) {
				callback(0);
				return "Series.count: " + error.message;
			}
		);
	});
};

Series.removeAll = function(callback) {
	appController.db.transaction(function(tx) {
		tx.executeSql("DELETE FROM Series", [],
			function(tx, resultSet) {
				callback();
			},
			function(tx, error) {
				var message = "Series.removeAll: " + error.message;
				callback(message);
				return message;
			}
		);
	});
};

Series.fromJson = function(series) {
	return new Series(series.id, series.seriesName, series.nowShowing, series.programId);
};

Series.NOW_SHOWING = {
	0: "Not Showing",
	1: "Mondays",
	2: "Tuesdays",
	3: "Wednesdays",
	4: "Thursdays",
	5: "Fridays",
	6: "Saturdays",
	7: "Sundays",
	8: "Daily"
};
