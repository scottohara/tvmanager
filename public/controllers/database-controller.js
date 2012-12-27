/**
 * @file (Controllers) DatabaseController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class DBUpgrade
 * @classdesc Anonymous object containing the properties of a database upgrade routine
 * @private
 * @property {String} version - the version to upgrade from
 * @property {Function} upgradeHandler - the function containing the database migration logic
 */

/**
 * @class DatabaseController
 * @classdesc Provides access to the HTML5 Web SQL database
 * @property {String} name - the name of the database to use
 * @property {String} displayName - the display name of the database to use
 * @property {String} estimatedSize - the estimated size (in bytes) that the database should be initialised to when created
 * @property {Function} successCallback - a function to call on successfully connecting to the database
 * @property {Function} errorCallback - a function to call on failure to connect to the database
 * @property {String} initialVersion - the initial version of the database on create/open
 * @property {String} expectedVersion - the expected version of the database after all upgrades have been applied
 * @property {Array<DBUpgrade>} upgrades - an array of upgrade routines
 * @property {Database} db - the HTML5 Web SQL database
 * @this DatabaseController
 * @constructor
 * @param {String} databaseName - the name of the database to use
 * @param {Function} callback - a function to call on successfully connecting to the database
 * @param {Function} errorCallback - a function to call on failure to connect to the database
 * @returns {Database} a HTML5 Web SQL database
 */
var DatabaseController = function (databaseName, callback, errorCallback) {
	this.name = databaseName;
	this.displayName = "TV Manager";
	this.estimatedSize = "10000";
	this.successCallback = callback;
	this.errorCallback = errorCallback;
	this.initialVersion = "";

	// Set this to the latest supported database schema version
	this.expectedVersion = "1.9";

	// Add a new object to this array to create a migration to a newer schema version
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

	// Attempt to open the database
	this.openDb();

	// If successful, we should now have a reference to the database
	if (this.db) {
		// Record the current schema version of the database
		this.initialVersion = this.db.version;

		// If the current version is not the expected version, we need to upgrade it
		if (this.initialVersion !== this.expectedVersion) {
			var startIndex = 0;
			var endIndex = this.upgrades.length;

			// Iterate over the list of upgrade routines and determine which ones apply
			for (var i = 0; i < this.upgrades.length; i++) {
				// Set the start index to match our initial version
				if (this.upgrades[i].version === this.initialVersion) {
					startIndex = i;
				}

				// Set the end index to match our expected version
				if (this.upgrades[i].version === this.expectedVersion) {
					endIndex = i;
					break;
				}
			}

			// Pull out only the upgrade routines that need to be applied
			this.upgradesToApply = this.upgrades.slice(startIndex, endIndex);

			// Upgrade the database version 
			this.db.changeVersion(this.initialVersion, this.expectedVersion,
				$.proxy(function(tx) {
					this.tx = tx;

					// Invoke the first upgrade routine
					this.nextUpgrade();
				}, this),
				this.errorCallback,
				$.proxy(this.versionOK, this)
			);
		} else {
			// We're already at the right schema version, so no upgrades needed
			this.versionOK();
		}
	} else {
		// Something went wrong opening the database, so call the error handler
		this.errorCallback({
			code: 0,
			message: "Unable to open database " + this.name
		});
	}

	// Return the reference to the database
	return this.db;
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method openDb
 * @desc Opens the specified HTML5 Web SQL database
 */
DatabaseController.prototype.openDb = function() {
	this.db = openDatabase(this.name, "", this.displayName, this.estimatedSize);
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method versionOK
 * @desc Calls the success handler to signal that the database is ready
 */
DatabaseController.prototype.versionOK = function() {
	// If we're not yet at the expected version (ie. we just upgraded), reopen the database
	if (this.initialVersion !== this.expectedVersion) {
		this.openDb();
	}

	// Call the success handler
	this.successCallback({initial: this.initialVersion, current: this.expectedVersion});
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method nextUpgrade
 * @desc Pops the next upgrade routine off the front of the array and executes the upgrade handler
 */
DatabaseController.prototype.nextUpgrade = function() {
	// Only proceed if we have upgrades left
	if (this.upgradesToApply.length) {
		// Pop the first one off the front of the array and execute the upgrade handler
		$.proxy(this.upgradesToApply.shift().upgradeHandler, this)();
	}
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_0
 * @desc Initialises the database to schema version 1.0
 */
DatabaseController.prototype.v1_0 = function() {
	// Create the Program, Series and Episode tables
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_1
 * @desc Upgrades the database to schema version 1.1
 */
DatabaseController.prototype.v1_1 = function() {
	// Add Episode.Status
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_2
 * @desc Upgrades the database to schema version 1.2
 */
DatabaseController.prototype.v1_2 = function() {
	// Add Episode.StatusDate
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");
	
	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_3
 * @desc Upgrades the database to schema version 1.3
 */
DatabaseController.prototype.v1_3 = function() {
	// Add Series.NowShowing
	this.tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_4
 * @desc Upgrades the database to schema version 1.4
 */
DatabaseController.prototype.v1_4 = function() {
	// Add Episode.Unverified
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Unverified");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_5
 * @desc Upgrades the database to schema version 1.5
 */
DatabaseController.prototype.v1_5 = function() {
	// Create the Setting table
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Setting (Name, Value)");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_6
 * @desc Upgrades the database to schema version 1.6
 */
DatabaseController.prototype.v1_6 = function() {
	// Add Episode.Unscheduled
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Unscheduled");

	// Move to the next upgrade
	this.nextUpgrade();
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_7
 * @desc Upgrades the database to schema version 1.7
 */
DatabaseController.prototype.v1_7 = function() {
	// Add Episode.Sequence
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN Sequence");

	// Iterate over the existing Episode records in Series order, and set the Sequence
	this.tx.executeSql("SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID", [],
		$.proxy(function(tx, resultSet) {
			var seriesId;
			var sequence = 0;
			// Iterate over the rows
			for (var i = 0; i < resultSet.rows.length; i++) {
				var ep = resultSet.rows.item(i);

				// Reset the sequence to zero when the Series changes
				if (seriesId !== ep.SeriesID) {
					sequence = 0;
					seriesId = ep.SeriesID;
				}

				// Set the Episode.Sequence value
				tx.executeSql("UPDATE Episode SET Sequence = ? WHERE rowid = ?", [sequence, ep.rowid]);

				// Increment the sequence
				sequence++;
			}

			// Move to the next upgrade
			this.nextUpgrade();
		}, this)
	);
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_8
 * @desc Upgrades the database to schema version 1.8
 */
DatabaseController.prototype.v1_8 = function() {
	// Declare the number of parallel jobs to complete
	var numSteps = 3;

	// Declare a function to call once all jobs are done
	var upgradeDone = $.proxy(function() {
		if (0 === --numSteps) {
			// Move to the next upgrade
			this.nextUpgrade();
		}
	}, this);

	// Add Program.ProgramID, Series.SeriesID and Episode.EpisodeID
	this.tx.executeSql("ALTER TABLE Program ADD COLUMN ProgramID");
	this.tx.executeSql("ALTER TABLE Series ADD COLUMN SeriesID");
	this.tx.executeSql("ALTER TABLE Episode ADD COLUMN EpisodeID");

	// Iterate over the existing Program records and set the ProgramID
	this.tx.executeSql("SELECT rowid FROM Program", [],
		$.proxy(function(tx, resultSet) {
			// Iterate over the rows
			for (var i = 0; i < resultSet.rows.length; i++) {
				var prog = resultSet.rows.item(i);

				// Generate a new UUID
				var programId = uuid.v4();

				// Update the Program and related Series records with the new identifier
				tx.executeSql("UPDATE Program SET ProgramID = ? WHERE rowid = ?", [programId, prog.rowid]);
				tx.executeSql("UPDATE Series SET ProgramID = ? WHERE ProgramID = ?", [programId, prog.rowid]);
			}

			// Drop and recreate the Program table with a new primary key
			tx.executeSql("CREATE TABLE tmp_Program (ProgramID PRIMARY KEY NOT NULL, Name)");
			tx.executeSql("INSERT INTO tmp_Program (ProgramID, Name) SELECT ProgramID, Name FROM Program");
			tx.executeSql("DROP TABLE Program");
			tx.executeSql("ALTER TABLE tmp_Program RENAME TO Program");

			// Signal the end of this job
			upgradeDone();
		}, this)
	);

	// Iterate over the existing Series records and set the SeriesID
	this.tx.executeSql("SELECT rowid FROM Series", [],
		$.proxy(function(tx, resultSet) {
			// Iterate over the rows
			for (var i = 0; i < resultSet.rows.length; i++) {
				var series = resultSet.rows.item(i);

				// Generate a new UUID
				var seriesId = uuid.v4();

				// Update the Series and related Episode records with the new identifier
				tx.executeSql("UPDATE Series SET SeriesID = ? WHERE rowid = ?", [seriesId, series.rowid]);
				tx.executeSql("UPDATE Episode SET SeriesID = ? WHERE SeriesID = ?", [seriesId, series.rowid]);
			}

			// Drop and recreate the Series table with a new primary key
			tx.executeSql("CREATE TABLE tmp_Series (SeriesID PRIMARY KEY NOT NULL, Name, ProgramID, NowShowing)");
			tx.executeSql("INSERT INTO tmp_Series (SeriesID, Name, ProgramID, NowShowing) SELECT SeriesID, Name, ProgramID, NowShowing FROM Series");
			tx.executeSql("DROP TABLE Series");
			tx.executeSql("ALTER TABLE tmp_Series RENAME TO Series");

			// Signal the end of this job
			upgradeDone();
		}, this)
	);

	// Iterate over the existing Episode records and set the EpisodeID
	this.tx.executeSql("SELECT rowid FROM Episode", [],
		$.proxy(function(tx, resultSet) {
			// Iterate over the rows
			for (var i = 0; i < resultSet.rows.length; i++) {
				var episode = resultSet.rows.item(i);

				// Generate a new UUID
				var episodeId = uuid.v4();

				// Update the Episode records with the new identifier
				tx.executeSql("UPDATE Episode SET EpisodeID = ? WHERE rowid = ?", [episodeId, episode.rowid]);
			}

			// Drop and recreate the Episode table with a new primary key
			tx.executeSql("CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)");
			tx.executeSql("INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode");
			tx.executeSql("DROP TABLE Episode");
			tx.executeSql("ALTER TABLE tmp_Episode RENAME TO Episode");

			// Signal the end of this job
			upgradeDone();
		}, this)
	);
};

/**
 * @memberof DatabaseController
 * @this DatabaseController
 * @instance
 * @method v1_9
 * @desc Upgrades the database to schema version 1.9
 */
DatabaseController.prototype.v1_9 = function() {
	// Create the Sync table
	this.tx.executeSql("CREATE TABLE IF NOT EXISTS Sync (Type, ID, Action, PRIMARY KEY ( Type, ID ))");

	// Populate with all existing records
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Program', ProgramID, 'modified' FROM Program");
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'modified' FROM Series");
	this.tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'modified' FROM Episode");

	// Remove the LastSyncHash setting (no longer used)
	this.tx.executeSql("DELETE FROM Setting WHERE Name = 'LastSyncHash'");

	// Move to the next upgrade
	this.nextUpgrade();
};
