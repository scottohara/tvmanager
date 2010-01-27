var Episode = Class.create({
	initialize: function(id, episodeName, seriesId, status, statusDate) {
		this.id = id;
		this.episodeName = episodeName;
		this.seriesId = seriesId;
		this.statusDate = statusDate;
		this.setStatus(status);
	},

	save: function() {
		db.transaction(function(tx) {
			var sql;
			var params;

			if (this.id) {
				sql = "UPDATE Episode SET Name = ?, Status = ?, StatusDate = ? WHERE rowid = ?";
				params = [this.episodeName, this.status, this.statusDate, this.id];
			} else {
				sql = "INSERT INTO Episode (Name, SeriesID, Status, StatusDate) VALUES (?, ?, ?, ?)";
				params = [this.episodeName, this.seriesId, this.status, this.statusDate];
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
			statusDate: this.statusDate
		}
	},

	setStatus: function(status) {
		this.status = status;

		if (("Recorded" === this.status || "Expected" === this.status) && this.statusDate != "") {
			this.statusDateDisplay = "(" + this.statusDate + ")";
		} else {
			this.statusDateDisplay = "";
		}
	}
});

Episode.list = function(seriesId, callback) {
	var episodeList = [];

	db.transaction(function(tx) {
		tx.executeSql("SELECT rowid, Name, Status, StatusDate FROM Episode WHERE SeriesID = ?", [seriesId],
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var ep = resultSet.rows.item(i);
					episodeList.push(new Episode(ep.rowid, ep.Name, seriesId, ep.Status, ep.StatusDate));
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