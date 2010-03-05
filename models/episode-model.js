var Episode = Class.create({
	initialize: function(id, episodeName, seriesId, status, statusDate, unverified) {
		this.id = id;
		this.episodeName = episodeName;
		this.seriesId = seriesId;
		this.statusDate = statusDate;
		this.setStatus(status);
		this.setUnverified(unverified);
	},

	save: function() {
		db.transaction(function(tx) {
			var sql;
			var params;

			if (this.id) {
				sql = "UPDATE Episode SET Name = ?, Status = ?, StatusDate = ?, Unverified = ? WHERE rowid = ?";
				params = [this.episodeName, this.status, this.statusDate, this.unverified, this.id];
			} else {
				sql = "INSERT INTO Episode (Name, SeriesID, Status, StatusDate, Unverified) VALUES (?, ?, ?, ?, ?)";
				params = [this.episodeName, this.seriesId, this.status, this.statusDate, this.unverified];
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
			unverified: this.unverified
		}
	},

	setStatus: function(status) {
		this.status = status;
		this.setStatusDate(this.statusDate);
	},

	setStatusDate: function(statusDate) {
		this.statusDate = statusDate;

		if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status) && this.statusDate != "") {
			this.statusDateDisplay = "(" + this.statusDate + ")";
		} else {
			this.statusDateDisplay = "";
		}
	},

	setUnverified: function(unverified) {
		this.unverified = unverified;
		if (this.unverified) {
			this.unverifiedDisplay = "Unverified";
		} else {
			this.unverifiedDisplay = "";
		}
	}
});

Episode.list = function(seriesId, callback) {
	var episodeList = [];

	db.transaction(function(tx) {
		tx.executeSql("SELECT rowid, Name, Status, StatusDate, Unverified FROM Episode WHERE SeriesID = ?", [seriesId],
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var ep = resultSet.rows.item(i);
					episodeList.push(new Episode(ep.rowid, ep.Name, seriesId, ep.Status, ep.StatusDate, (ep.Unverified === "true")));
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