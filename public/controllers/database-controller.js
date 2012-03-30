var DatabaseController = function (databaseName, callback, errorCallback) {
	this.name = databaseName;
	this.displayName = "TV Manager";
	this.estimatedSize = "10000";
	this.successCallback = callback;
	this.errorCallback = errorCallback;
	this.initialVersion = "";

	this.expectedVersion = "1.9";

	this.upgrades = [
		{
			version: "",
			upgradeHandler: this.v1_0
		},
		{
			version: "1.0",
			upgradeHandler: this.v1_1
		},
		{
			version: "1.1",
			upgradeHandler: this.v1_2
		},
		{
			version: "1.2",
			upgradeHandler: this.v1_3
		},
		{
			version: "1.3",
			upgradeHandler: this.v1_4
		},
		{
			version: "1.4",
			upgradeHandler: this.v1_5
		},
		{
			version: "1.5",
			upgradeHandler: this.v1_6
		},
		{
			version: "1.6",
			upgradeHandler: this.v1_7
		},
		{
			version: "1.7",
			upgradeHandler: this.v1_8
		},
		{
			version: "1.8",
			upgradeHandler: this.v1_9
		}
	];

	this.openDb();

	if (this.db) {
		this.initialVersion = this.db.version;
		if (this.initialVersion !== this.expectedVersion) {
			var startIndex = 0;
			var endIndex = this.upgrades.length;
			for (var i = 0; i < this.upgrades.length; i++) {
				if (this.upgrades[i].version === this.initialVersion) {
					startIndex = i;
				}
				if (this.upgrades[i].version === this.expectedVersion) {
					endIndex = i;
					break;
				}
			}

			this.db.changeVersion(this.initialVersion, this.expectedVersion,
				$.proxy(function(tx) {
					for (var i = startIndex; i < endIndex; i++) {
						this.upgrades[i].upgradeHandler(tx);
					}
				}, this),
				this.errorCallback,
				$.proxy(this.versionOK, this)
			);
		} else {
			this.versionOK();
		}
	} else {
		this.errorCallback({
			code: 0,
			message: "Unable to open database " + this.name
		});
	}

	return this.db;
};

DatabaseController.prototype.openDb = function() {
	this.db = openDatabase(this.name, "", this.displayName, this.estimatedSize);
};

DatabaseController.prototype.versionOK = function() {
	if (this.initialVersion !== this.expectedVersion) {
		this.openDb();
	}

	this.successCallback({initial: this.initialVersion, current: this.expectedVersion});
};

DatabaseController.prototype.v1_0 = function(tx) {
	tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
	tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
	tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");
};

DatabaseController.prototype.v1_1 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");
};

DatabaseController.prototype.v1_2 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");
};

DatabaseController.prototype.v1_3 = function(tx) {
	tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");
};

DatabaseController.prototype.v1_4 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN Unverified");
};

DatabaseController.prototype.v1_5 = function(tx) {
	tx.executeSql("CREATE TABLE IF NOT EXISTS Setting (Name, Value)");
};

DatabaseController.prototype.v1_6 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN Unscheduled");
};

DatabaseController.prototype.v1_7 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN Sequence");
	tx.executeSql("SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID", [],
		function(tx, resultSet) {
			var seriesId;
			var sequence = 0;
			for (var i = 0; i < resultSet.rows.length; i++) {
				var ep = resultSet.rows.item(i);
				if (seriesId !== ep.SeriesID) {
					sequence = 0;
					seriesId = ep.SeriesID;
				}
				tx.executeSql("UPDATE Episode SET Sequence = ? WHERE rowid = ?", [sequence, ep.rowid]);
				sequence++;
			}
		}
	);
};

DatabaseController.prototype.v1_8 = function(tx) {
	tx.executeSql("ALTER TABLE Program ADD COLUMN ProgramID");
	tx.executeSql("ALTER TABLE Series ADD COLUMN SeriesID");
	tx.executeSql("ALTER TABLE Episode ADD COLUMN EpisodeID");
	tx.executeSql("SELECT rowid FROM Program", [],
		function(tx, resultSet) {
			for (var i = 0; i < resultSet.rows.length; i++) {
				var prog = resultSet.rows.item(i);
				var programId = uuid.v4();
				tx.executeSql("UPDATE Program SET ProgramID = ? WHERE rowid = ?", [programId, prog.rowid]);
				tx.executeSql("UPDATE Series SET ProgramID = ? WHERE ProgramID = ?", [programId, prog.rowid]);
			}
			tx.executeSql("CREATE TABLE tmp_Program (ProgramID PRIMARY KEY NOT NULL, Name)");
			tx.executeSql("INSERT INTO tmp_Program (ProgramID, Name) SELECT ProgramID, Name FROM Program");
			tx.executeSql("DROP TABLE Program");
			tx.executeSql("ALTER TABLE tmp_Program RENAME TO Program");
		}
	);
	tx.executeSql("SELECT rowid FROM Series", [],
		function(tx, resultSet) {
			for (var i = 0; i < resultSet.rows.length; i++) {
				var series = resultSet.rows.item(i);
				var seriesId = uuid.v4();
				tx.executeSql("UPDATE Series SET SeriesID = ? WHERE rowid = ?", [seriesId, series.rowid]);
				tx.executeSql("UPDATE Episode SET SeriesID = ? WHERE SeriesID = ?", [seriesId, series.rowid]);
			}
			tx.executeSql("CREATE TABLE tmp_Series (SeriesID PRIMARY KEY NOT NULL, Name, ProgramID, NowShowing)");
			tx.executeSql("INSERT INTO tmp_Series (SeriesID, Name, ProgramID, NowShowing) SELECT SeriesID, Name, ProgramID, NowShowing FROM Series");
			tx.executeSql("DROP TABLE Series");
			tx.executeSql("ALTER TABLE tmp_Series RENAME TO Series");
		}
	);
	tx.executeSql("SELECT rowid FROM Episode", [],
		function(tx, resultSet) {
			for (var i = 0; i < resultSet.rows.length; i++) {
				var episode = resultSet.rows.item(i);
				var episodeId = uuid.v4();
				tx.executeSql("UPDATE Episode SET EpisodeID = ? WHERE rowid = ?", [episodeId, episode.rowid]);
			}
			tx.executeSql("CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)");
			tx.executeSql("INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode");
			tx.executeSql("DROP TABLE Episode");
			tx.executeSql("ALTER TABLE tmp_Episode RENAME TO Episode");
		}
	);
};

DatabaseController.prototype.v1_9 = function(tx) {
	tx.executeSql("CREATE TABLE IF NOT EXISTS Sync (Type, ID, Action, PRIMARY KEY ( Type, ID ))");
	tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Program', ProgramID, 'modified' FROM Program");
	tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'modified' FROM Series");
	tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'modified' FROM Episode");
	tx.executeSql("DELETE FROM Setting WHERE Name = 'LastSyncHash'");
};
