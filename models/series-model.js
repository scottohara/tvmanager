var Series = Class.create({
	initialize: function(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount) {
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
	},

	save: function(callback) {
		db.transaction(function(tx) {
			var sql;
			var params;

			if (this.id) {
				sql = "UPDATE Series SET Name = ?, NowShowing = ? WHERE rowid = ?";
				params = [this.seriesName, this.nowShowing, this.id];
			} else {
				sql = "INSERT INTO Series (Name, NowShowing, ProgramID) VALUES (?, ?, ?)";
				params = [this.seriesName, this.nowShowing, this.programId];
			}

			tx.executeSql(sql, params,
				function(tx, resultSet) {
					if (!resultSet.rowsAffected) {
						if (callback) {
							callback();
						} else {
							throw new Error("Series.save: no rows affected");
							return false;
						}
					}
  
					if (!this.id) {
						this.id = resultSet.insertId;
					}

					if (callback) {
						callback(this.id);
					}
				}.bind(this),
				function(tx, error) {
					if (callback) {
						callback();
					} else {
						throw new Error("Series.save: " + error.message);
						return false;
					}
				}.bind(this)
			);
		}.bind(this));
	},

	remove: function() {
		if (this.id) {
			db.transaction(function(tx) {
				tx.executeSql("DELETE FROM Episode WHERE SeriesID = ?", [this.id]);
				tx.executeSql("DELETE FROM Series WHERE rowid = ?", [this.id]);
				this.id = null;
				this.seriesName = null;
				this.nowShowing = null;
				this.programId = null;
			}.bind(this));
		}
	},

	toJson: function(callback) {
		Episode.list(this.id, function(episodes) {
			var json = {
				seriesName: this.seriesName,
				nowShowing: this.nowShowing,
				episodes: []
			}

			for (var i = 0; i < episodes.length; i++) {
				json.episodes.push(episodes[i].toJson());
			}

			callback(json);
		}.bind(this));
	},

	setNowShowing: function(nowShowing) {
		if (!nowShowing) {
			nowShowing = 0;
		}

		if (nowShowing == 0) {
			this.nowShowing = null;
		} else {
			this.nowShowing = nowShowing;
		}

		this.nowShowingDisplay = Series.NOW_SHOWING[nowShowing];
	},

	setEpisodeCount: function(count) {
		this.episodeCount = count;
		this.progressBar.setTotal(this.episodeCount);
		this.setWatchedProgress();
	},

	setWatchedCount: function(count) {
		this.watchedCount = count;
		this.setWatchedProgress();
	},

	setWatchedProgress: function() {
		var watchedPercent = 0;
		if (this.watchedCount && this.watchedCount > 0) {
			watchedPercent = this.watchedCount / this.episodeCount * 100;
		}

		this.progressBarDisplay = this.progressBar.setSection(0, {
			label: this.watchedCount,
			percent: watchedPercent,
			style: "watched"
		});
	},

	setRecordedCount: function(count) {
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
	},

	setExpectedCount: function(count) {
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
	}
});

Series.listByProgram = function(programId, callback) {
	var filter = "WHERE ProgramID = ? GROUP BY s.rowid ORDER BY s.Name";
	var params = [programId];
	Series.list(filter, params, callback);
}

Series.listByNowShowing = function(callback) {
	var filter = "GROUP BY s.rowid HAVING s.NowShowing IS NOT NULL OR COUNT(e3.rowid) > 0 OR COUNT(e4.rowid) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name";
	var params = [];
	Series.list(filter, params, callback);
}

Series.list = function(filter, params, callback) {
	var seriesList = [];

	db.transaction(function(tx) {
		tx.executeSql("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected'" + filter, params,
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var series = resultSet.rows.item(i);
					seriesList.push(new Series(series.rowid, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount));
				}
				callback(seriesList);
			},
			function(tx, error) {
				throw new Error("Series.list: " + error.message);
				callback(seriesList);
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