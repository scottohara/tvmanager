function Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId, seriesName, programId, programName) {
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
}

Episode.prototype.save = function() {
	appController.db.transaction($.proxy(function(tx) {
		var sql;
		var params;

		if (this.id) {
			sql = "UPDATE Episode SET Name = ?, Status = ?, StatusDate = ?, Unverified = ?, Unscheduled = ?, Sequence = ? WHERE rowid = ?";
			params = [this.episodeName, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence, this.id];
		} else {
			sql = "INSERT INTO Episode (Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (?, ?, ?, ?, ?, ?, ?)";
			params = [this.episodeName, this.seriesId, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence];
		}

		tx.executeSql(sql, params,
			$.proxy(function(tx, resultSet) {
				if (!resultSet.rowsAffected) {
					throw new Error("Episode.save: no rows affected");
				}

				if (!this.id) {
					this.id = resultSet.insertId;
				}
			}, this),
			function(tx, error) {
				return "Episode.save: " + error.message;
			}
		);
	}, this));
}

Episode.prototype.remove = function() {
	if (this.id) {
		appController.db.transaction($.proxy(function(tx) {
			tx.executeSql("DELETE FROM Episode WHERE rowid = ?", [this.id]);
		}, this),
		null,
		$.proxy(function() {
			this.id = null;
			this.episodeName = null;
			this.seriesId = null;
		}, this));
	}
}

Episode.prototype.toJson = function() {
	return {
		episodeName: this.episodeName,
		status: this.status,
		statusDate: this.statusDate,
		unverified: this.unverified,
		unscheduled: this.unscheduled,
		sequence: this.sequence
	}
}

Episode.prototype.setStatus = function(status) {
	this.status = status;
	this.setStatusDate(this.statusDate);
}

Episode.prototype.setStatusDate = function(statusDate) {
	this.statusDate = statusDate;

	if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && this.statusDate != "") {
		this.statusDateDisplay = "(" + this.statusDate + ")";
	} else {
		this.statusDateDisplay = "";
	}

	this.statusWarning = '';
	if ("Expected" === this.status && this.statusDate != "") {
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
}

Episode.prototype.setUnverified = function(unverified) {
	this.unverified = unverified;
	if ("Watched" != this.status && this.unverified) {
		this.unverifiedDisplay = "Unverified";
	} else {
		this.unverifiedDisplay = "";
	}
}

Episode.listBySeries = function(seriesId, callback) {
	var filter = "WHERE e.SeriesID = ? ORDER BY e.Sequence, e.rowid";
	var params = [seriesId];
	Episode.list(filter, params, callback);
}

Episode.listByUnscheduled = function(callback) {
	var filter = "WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)";
	var params = [];
	Episode.list(filter, params, callback);
}

Episode.list = function(filter, params, callback) {
	var episodeList = [];

	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid " + filter, params,
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var ep = resultSet.rows.item(i);
					episodeList.push(new Episode(ep.rowid, ep.Name, ep.Status, ep.StatusDate, (ep.Unverified === "true"), (ep.Unscheduled === "true"), ep.Sequence, ep.SeriesID, ep.SeriesName, ep.ProgramID, ep.ProgramName));
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

Episode.count = function(callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS EpisodeCount FROM Episode", [],
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).EpisodeCount);
			},
			function(tx, error) {
				callback(0);
				return "Episode.count: " + error.message;
			}
		);
	});
}