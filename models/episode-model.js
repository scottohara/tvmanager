var Episode = Class.create({
	initialize: function(id, episodeName, status, statusDate, unverified, unscheduled, seriesId, seriesName, programId, programName) {
		this.id = id;
		this.episodeName = episodeName;
		this.statusDate = statusDate;
		this.unscheduled = unscheduled;
		this.setStatus(status);
		this.setUnverified(unverified);
		this.seriesId = seriesId;
		this.seriesName = seriesName;
		this.programId = programId;
		this.programName = programName;
	},

	save: function() {
		db.transaction(function(tx) {
			var sql;
			var params;

			if (this.id) {
				sql = "UPDATE Episode SET Name = ?, Status = ?, StatusDate = ?, Unverified = ?, Unscheduled = ? WHERE rowid = ?";
				params = [this.episodeName, this.status, this.statusDate, this.unverified, this.unscheduled, this.id];
			} else {
				sql = "INSERT INTO Episode (Name, SeriesID, Status, StatusDate, Unverified, Unscheduled) VALUES (?, ?, ?, ?, ?, ?)";
				params = [this.episodeName, this.seriesId, this.status, this.statusDate, this.unverified, this.unscheduled];
			}

			tx.executeSql(sql, params,
				function(tx, resultSet) {
					if (!resultSet.rowsAffected) {
						throw new Error("Episode.save: no rows affected");
						return false;
					}
  
					if (!this.id) {
						this.id = resultSet.insertId;
					}
				}.bind(this),
				function(tx, error) {
					throw new Error("Episode.save: " + error.message);
					return false;
				}.bind(this)
			);
		}.bind(this));
	},

	remove: function() {
		if (this.id) {
			db.transaction(function(tx) {
				tx.executeSql("DELETE FROM Episode WHERE rowid = ?", [this.id]);
				this.id = null;
				this.episodeName = null;
				this.seriesId = null;
			}.bind(this));
		}
	},

	toJson: function() {
		return {
			episodeName: this.episodeName,
			status: this.status,
			statusDate: this.statusDate,
			unverified: this.unverified,
			unscheduled: this.unscheduled
		}
	},

	setStatus: function(status) {
		this.status = status;
		this.setStatusDate(this.statusDate);
	},

	setStatusDate: function(statusDate) {
		this.statusDate = statusDate;

		if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && this.statusDate != "") {
			this.statusDateDisplay = "(" + this.statusDate + ")";
		} else {
			this.statusDateDisplay = "";
		}
	},

	setUnverified: function(unverified) {
		this.unverified = unverified;
		if ("Watched" != this.status && this.unverified) {
			this.unverifiedDisplay = "Unverified";
		} else {
			this.unverifiedDisplay = "";
		}
	}
});

Episode.listBySeries = function(seriesId, callback) {
	var filter = "WHERE e.SeriesID = ?";
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

	db.transaction(function(tx) {
		tx.executeSql("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid " + filter, params,
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var ep = resultSet.rows.item(i);
					episodeList.push(new Episode(ep.rowid, ep.Name, ep.Status, ep.StatusDate, (ep.Unverified === "true"), (ep.Unscheduled === "true"), ep.SeriesID, ep.SeriesName, ep.ProgramID, ep.ProgramName));
				}
				callback(episodeList);
			},
			function(tx, error) {
				throw new Error("Episode.list: " + error.message);
				callback(episodeList);
			}
		);
	});
};

Episode.count = function(callback) {
	db.transaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS EpisodeCount FROM Episode", [],
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).EpisodeCount);
			},
			function(tx, error) {
				throw new Error("Episode.count: " + error.message);
				callback(0);
			}
		);
	});
}