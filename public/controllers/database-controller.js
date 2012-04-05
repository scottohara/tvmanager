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
			this.upgradesToApply = this.upgrades.slice(startIndex, endIndex);

			this.db.changeVersion(this.initialVersion, this.expectedVersion,
				$.proxy(function(tx) {
					this.tx = tx;
					this.nextUpgrade();
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

DatabaseController.prototype.nextUpgrade = function() {
	if (this.upgradesToApply.length) {
		$.proxy(this.upgradesToApply.shift().upgradeHandler, this)();
	}
};

DatabaseController.prototype.v1_0 = function() {
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_1 = function() {
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_2 = function() {
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_3 = function() {
	this.tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_4 = function() {
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Unverified");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_5 = function() {
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Setting (Name, Value)");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_6 = function() {
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Unscheduled");
	this.nextUpgrade();
};

DatabaseController.prototype.v1_7 = function() {
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Sequence");
	this.tx.executeSql("SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID", [],
		$.proxy(function(tx, resultSet) {
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
			this.nextUpgrade();
		}, this)
	);
};

DatabaseController.prototype.v1_8 = function() {
	var numSteps = 3;
	var upgradeDone = $.proxy(function() {
		if (0 === --numSteps) {
			this.nextUpgrade();
		}
	}, this);

	this.tx.executeSql("ALTER TABLE Program ADD COLUMN ProgramID");
	this.tx.executeSql("ALTER TABLE Series ADD COLUMN SeriesID");
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN EpisodeID");
	this.tx.executeSql("SELECT rowid FROM Program", [],
		$.proxy(function(tx, resultSet) {
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
			upgradeDone();
		}, this)
	);
	this.tx.executeSql("SELECT rowid FROM Series", [],
		$.proxy(function(tx, resultSet) {
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
			upgradeDone();
		}, this)
	);
	this.tx.executeSql("SELECT rowid FROM Episode", [],
		$.proxy(function(tx, resultSet) {
			for (var i = 0; i < resultSet.rows.length; i++) {
				var episode = resultSet.rows.item(i);
				var episodeId = uuid.v4();
				tx.executeSql("UPDATE Episode SET EpisodeID = ? WHERE rowid = ?", [episodeId, episode.rowid]);
			}
			tx.executeSql("CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)");
			tx.executeSql("INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode");
			tx.executeSql("DROP TABLE Episode");
			tx.executeSql("ALTER TABLE tmp_Episode RENAME TO Episode");
			upgradeDone();
		}, this)
	);
};

DatabaseController.prototype.v1_9 = function() {
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Sync (Type, ID, Action, PRIMARY KEY ( Type, ID ))");
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Program', ProgramID, 'modified' FROM Program");
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'modified' FROM Series");
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'modified' FROM Episode");
	this.tx.executeSql("DELETE FROM Setting WHERE Name = 'LastSyncHash'");
	this.nextUpgrade();
};
