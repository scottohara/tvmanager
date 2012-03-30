var Episode = function (id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId, seriesName, programId, programName) {
	this.id = id;
	this.episodeName = episodeName;
	this.statusDate = statusDate;
	this.unscheduled = unscheduled;
	this.sequence = sequence;
	this.setStatus(status);
	this.setUnverified(unverified);
	this.seriesId = seriesId;
	this.seriesName = seriesName;
	this.programId = programId;
	this.programName = programName;
};

Episode.prototype.save = function(callback) {
	appController.db.transaction($.proxy(function(tx) {
		if (!this.id) {
			this.id = uuid.v4();
		}

		tx.executeSql("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [this.id, this.episodeName, this.seriesId, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence], $.proxy(function(tx, resultSet) {
			if (!resultSet.rowsAffected) {
				throw new Error("no rows affected");
			}

			tx.executeSql("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Episode', ?, 'modified')", [this.id],
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
		return "Episode.save: " + error.message;
	});
};

Episode.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Episode', ?, 'deleted')", [this.id]);
			tx.executeSql("DELETE FROM Episode WHERE EpisodeID = ?", [this.id]);
		}, this),
		null,
		$.proxy(function() {
			this.id = null;
			this.episodeName = null;
			this.seriesId = null;
		}, this));
	}
};

Episode.prototype.toJson = function() {
	return {
		id: this.id,
		episodeName: this.episodeName,
		seriesId: this.seriesId,
		status: this.status,
		statusDate: this.statusDate,
		unverified: this.unverified,
		unscheduled: this.unscheduled,
		sequence: this.sequence
	};
};

Episode.prototype.setStatus = function(status) {
	this.status = status;
	this.setStatusDate(this.statusDate);
};

Episode.prototype.setStatusDate = function(statusDate) {
	this.statusDate = statusDate;

	if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && "" !== this.statusDate) {
		this.statusDateDisplay = "(" + this.statusDate + ")";
	} else {
		this.statusDateDisplay = "";
	}

	this.statusWarning = '';
	if ("Expected" === this.status && "" !== this.statusDate) {
		var today = new Date();
		var currDay = "0" + today.getDate();
		var startMonth = "0" + (today.getMonth() + 1);
		var endMonth = "0";
		if (today.getMonth() < 3) {
			endMonth = String(10 + today.getMonth());
		} else {
			endMonth += String(today.getMonth() - 2);
		}

		var start = startMonth.substr(startMonth.length-2) + currDay.substr(currDay.length-2);
		var end = endMonth.substr(endMonth.length-2) + currDay.substr(currDay.length-2);

		var months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
		var parts = this.statusDate.split("-");
		var tempStatusDate = months[parts[1]] + parts[0];

		if (today.getMonth() < 3) {
			this.statusWarning = (tempStatusDate <= start || tempStatusDate >= end ? 'warning' : '');
		} else {
			this.statusWarning = (tempStatusDate <= start && tempStatusDate >= end ? 'warning' : '');
		}
	}
};

Episode.prototype.setUnverified = function(unverified) {
	this.unverified = unverified;
	if ("Watched" !== this.status && this.unverified) {
		this.unverifiedDisplay = "Unverified";
	} else {
		this.unverifiedDisplay = "";
	}
};

Episode.listBySeries = function(seriesId, callback) {
	var filter = "WHERE e.SeriesID = ? ORDER BY e.Sequence, e.EpisodeID";
	var params = [seriesId];
	Episode.list(filter, params, callback);
};

Episode.listByUnscheduled = function(callback) {
	var filter = "WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)";
	var params = [];
	Episode.list(filter, params, callback);
};

Episode.list = function(filter, params, callback) {
	var episodeList = [];

	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID " + filter, params,
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var ep = resultSet.rows.item(i);
					episodeList.push(new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ("true" === ep.Unverified), ("true" === ep.Unscheduled), ep.Sequence, ep.SeriesID, ep.SeriesName, ep.ProgramID, ep.ProgramName));
				}
				callback(episodeList);
			},
			function(tx, error) {
				callback(episodeList);
				return "Episode.list: " + error.message;
			}
		);
	});
};

Episode.find = function(id, callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode WHERE EpisodeID = ?", [id],
			function(tx, resultSet) {
				var ep = resultSet.rows.item(0);
				callback(new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ("true" === ep.Unverified), ("true" === ep.Unscheduled), ep.Sequence, ep.SeriesID));
			},
			function(tx, error) {
				callback(null);
				return "Episode.find: " + error.message;
			}
		);
	});
};

Episode.totalCount = function(callback) {
	var filter = "";
	var params = [];
	Episode.count(filter, params, callback);
};

Episode.countByStatus = function(status, callback) {
	var filter = "WHERE Status = ?";
	var params = [status];
	Episode.count(filter, params, callback);
};

Episode.count = function(filter, params, callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS EpisodeCount FROM Episode " + filter, params,
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).EpisodeCount);
			},
			function(tx, error) {
				callback(0);
				return "Episode.count: " + error.message;
			}
		);
	});
};

Episode.removeAll = function(callback) {
	appController.db.transaction(function(tx) {
		tx.executeSql("DELETE FROM Episode", [],
			function(tx, resultSet) {
				callback();
			},
			function(tx, error) {
				var message = "Episode.removeAll: " + error.message;
				callback(message);
				return message;
			}
		);
	});
};

Episode.fromJson = function(episode) {
	return new Episode(episode.id, episode.episodeName, episode.status, episode.statusDate, episode.unverified, episode.unscheduled, episode.sequence, episode.seriesId);
};
