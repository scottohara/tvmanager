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
		var sql;
		var params;

		if (this.id) {
			sql = "UPDATE Series SET Name = ?, NowShowing = ?, ProgramID = ? WHERE rowid = ?";
			params = [this.seriesName, this.nowShowing, this.programId, this.id];
		} else {
			sql = "INSERT INTO Series (Name, NowShowing, ProgramID) VALUES (?, ?, ?)";
			params = [this.seriesName, this.nowShowing, this.programId];
		}

		tx.executeSql(sql, params,
			$.proxy(function(tx, resultSet) {
				if (!resultSet.rowsAffected) {
					if (callback) {
						callback();
					}
					throw new Error("Series.save: no rows affected");
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
				return "Series.save: " + error.message;
			}
		);
	}, this));
};

Series.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("DELETE FROM Episode WHERE SeriesID = ?", [this.id]);
			tx.executeSql("DELETE FROM Series WHERE rowid = ?", [this.id]);
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

Series.prototype.toJson = function(callback) {
	Episode.listBySeries(this.id, $.proxy(function(episodes) {
		var json = {
			seriesName: this.seriesName,
			nowShowing: this.nowShowing,
			episodes: []
		};

		for (var i = 0; i < episodes.length; i++) {
			json.episodes.push(episodes[i].toJson());
		}

		callback(json);
	}, this));
};

Series.prototype.setNowShowing = function(nowShowing) {
	if (!nowShowing) {
		nowShowing = 0;
	}

	if (0 === nowShowing) {
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
	baseData: "SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID",
	summaryData: "COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount",
	entityList: "FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected'"
};

Series.listByProgram = function(programId, callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + " " + Series.standardQuery.entityList;
	var filter = "WHERE ProgramID = ? GROUP BY s.rowid ORDER BY s.Name";
	var params = [programId];
	Series.list(query, filter, params, callback);
};

Series.listByNowShowing = function(callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + ", SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount " + Series.standardQuery.entityList;
	var filter = "GROUP BY s.rowid HAVING s.NowShowing IS NOT NULL OR COUNT(e3.rowid) > 0 OR COUNT(e4.rowid) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name";
	var params = [];
	Series.list(query, filter, params, callback);
};

Series.listByStatus = function(callback, status) {
	var query = Series.standardQuery.baseData + ", COUNT(e.rowid) AS EpisodeCount, COUNT(e.rowid) AS " + status + "Count FROM Program p JOIN Series s ON p.rowid = s.ProgramID JOIN Episode e ON s.rowid = e.SeriesID";
	var filter = "WHERE e.Status = ? GROUP BY s.rowid ORDER BY p.Name, s.Name";
	var params = [status];
	Series.list(query, filter, params, callback);
};

Series.listByIncomplete = function(callback) {
	var query = Series.standardQuery.baseData + ", " + Series.standardQuery.summaryData + " " + Series.standardQuery.entityList;
	var filter = "GROUP BY s.rowid HAVING COUNT(e.rowid) > COUNT(e2.rowid) AND COUNT(e2.rowid) > 0 ORDER BY p.Name, s.Name";
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
					seriesList.push(new Series(series.rowid, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount));
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