/**
 * @file (Controllers) DatabaseController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"framework/uuid",
		"components/window"
	],

	/**
	 * @exports controllers/database-controller
	 */
	(uuid, window) => {
		"use strict";

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
		 * @property {Function} successCallback - a function to call on successfully connecting to the database
		 * @property {String} initialVersion - the initial version of the database on create/open
		 * @property {Database} db - the HTML5 Web SQL database
		 */
		class DatabaseController {
			/**
			 * @constructor DatabaseController
			 * @this DatabaseController
			 * @param {String} databaseName - the name of the database to use
			 * @param {Function} callback - a function to call on successfully connecting to the database
			 * @param {Function} errorCallback - a function to call on failure to connect to the database
			 * @returns {Database} a HTML5 Web SQL database
			 */
			constructor(databaseName, callback, errorCallback) {
				this.name = databaseName;
				this.successCallback = callback;
				this.initialVersion = "";

				// Attempt to open the database
				this.openDb();

				// If successful, we should now have a reference to the database
				if (this.db) {
					// Record the current schema version of the database
					this.initialVersion = this.db.version;

					// If the current version is not the expected version, we need to upgrade it
					if (this.initialVersion === DatabaseController.expectedVersion) {
						// We're already at the right schema version, so no upgrades needed
						this.versionOK();
					} else {
						// Start the upgrade
						this.startUpgrade(errorCallback);
					}
				} else {
					// Something went wrong opening the database, so call the error handler
					errorCallback({
						code: 0,
						message: `Unable to open database ${this.name}`
					});
				}

				// Return the reference to the database
				return this.db;
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
		 	 * @property {Array<DBUpgrade>} upgrades - an array of upgrade routines
			 * @desc The set of upgrades to migrate to a newer schema version
			 */
			get upgrades() {
				// Add a new object to this array to create a migration to a newer schema version
				return [
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
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method openDb
			 * @desc Opens the specified HTML5 Web SQL database
			 */
			openDb() {
				this.db = window.openDatabase(this.name, "", DatabaseController.displayName, DatabaseController.estimatedSize);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method versionOK
			 * @desc Calls the success handler to signal that the database is ready
			 */
			versionOK() {
				// If we're not yet at the expected version (ie. we just upgraded), reopen the database
				if (this.initialVersion !== DatabaseController.expectedVersion) {
					this.openDb();
				}

				// Call the success handler
				this.successCallback({initial: this.initialVersion, current: DatabaseController.expectedVersion});
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method startUpgrade
			 * @desc Starts the database upgrade process
			 * @param {Function} errorCallback - a function to call on failure to upgrade the database
			 */
			startUpgrade(errorCallback) {
				// Determine which upgrade routines to apply
				let startIndex = this.upgrades.findIndex(upgrade => upgrade.version === this.initialVersion),
						endIndex = this.upgrades.findIndex(upgrade => upgrade.version === DatabaseController.expectedVersion);

				// If either version was not found, set to the start or end (respectively)
				if (-1 === startIndex) {
					startIndex = 0;
				}

				if (-1 === endIndex) {
					endIndex = this.upgrades.length;
				}

				// Pull out only the upgrade routines that need to be applied
				this.upgradesToApply = this.upgrades.slice(startIndex, endIndex);

				// Upgrade the database version
				this.db.changeVersion(this.initialVersion, DatabaseController.expectedVersion, tx => {
					// Invoke the first upgrade routine
					this.nextUpgrade(tx);
				}, errorCallback, this.versionOK.bind(this));
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method nextUpgrade
			 * @desc Pops the next upgrade routine off the front of the array and executes the upgrade handler
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			nextUpgrade(tx) {
				// Only proceed if we have upgrades left
				if (this.upgradesToApply.length) {
					// Pop the first one off the front of the array and execute the upgrade handler
					this.upgradesToApply.shift().upgradeHandler.bind(this)(tx);
				}
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_0
			 * @desc Initialises the database to schema version 1.0
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_0"(tx) {
				// Create the Program, Series and Episode tables
				tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
				tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
				tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_1
			 * @desc Upgrades the database to schema version 1.1
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_1"(tx) {
				// Add Episode.Status
				tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_2
			 * @desc Upgrades the database to schema version 1.2
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_2"(tx) {
				// Add Episode.StatusDate
				tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_3
			 * @desc Upgrades the database to schema version 1.3
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_3"(tx) {
				// Add Series.NowShowing
				tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_4
			 * @desc Upgrades the database to schema version 1.4
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_4"(tx) {
				// Add Episode.Unverified
				tx.executeSql("ALTER TABLE Episode ADD COLUMN Unverified");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_5
			 * @desc Upgrades the database to schema version 1.5
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_5"(tx) {
				// Create the Setting table
				tx.executeSql("CREATE TABLE IF NOT EXISTS Setting (Name, Value)");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_6
			 * @desc Upgrades the database to schema version 1.6
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_6"(tx) {
				// Add Episode.Unscheduled
				tx.executeSql("ALTER TABLE Episode ADD COLUMN Unscheduled");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_7
			 * @desc Upgrades the database to schema version 1.7
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_7"(tx) {
				// Add Episode.Sequence
				tx.executeSql("ALTER TABLE Episode ADD COLUMN Sequence");

				// Iterate over the existing Episode records in Series order, and set the Sequence
				tx.executeSql("SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID", [], (innerTx, resultSet) => {
					let seriesId,
							sequence = 0;

					// Iterate over the rows
					for (let i = 0; i < resultSet.rows.length; i++) {
						const ep = resultSet.rows.item(i);

						// Reset the sequence to zero when the Series changes
						if (seriesId !== ep.SeriesID) {
							sequence = 0;
							seriesId = ep.SeriesID;
						}

						// Set the Episode.Sequence value
						innerTx.executeSql("UPDATE Episode SET Sequence = ? WHERE rowid = ?", [sequence, ep.rowid]);

						// Increment the sequence
						sequence++;
					}

					// Move to the next upgrade
					this.nextUpgrade(tx);
				});
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_8
			 * @desc Upgrades the database to schema version 1.8
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_8"(tx) {
				// Declare the number of parallel jobs to complete
				const numSteps = 3;
				let remainingSteps = numSteps;

				// Declare a function to call once all jobs are done
				function upgradeDone(controller) {
					if (0 === --remainingSteps) {
						// Move to the next upgrade
						controller.nextUpgrade(tx);
					}
				}

				// Add Program.ProgramID, Series.SeriesID and Episode.EpisodeID
				tx.executeSql("ALTER TABLE Program ADD COLUMN ProgramID");
				tx.executeSql("ALTER TABLE Series ADD COLUMN SeriesID");
				tx.executeSql("ALTER TABLE Episode ADD COLUMN EpisodeID");

				// Iterate over the existing Program records and set the ProgramID
				tx.executeSql("SELECT rowid FROM Program", [], (innerTx, resultSet) => {
					// Iterate over the rows
					for (let i = 0; i < resultSet.rows.length; i++) {
						const prog = resultSet.rows.item(i),
									programId = uuid.v4();

						// Update the Program and related Series records with the new identifier
						innerTx.executeSql("UPDATE Program SET ProgramID = ? WHERE rowid = ?", [programId, prog.rowid]);
						innerTx.executeSql("UPDATE Series SET ProgramID = ? WHERE ProgramID = ?", [programId, prog.rowid]);
					}

					// Drop and recreate the Program table with a new primary key
					innerTx.executeSql("CREATE TABLE tmp_Program (ProgramID PRIMARY KEY NOT NULL, Name)");
					innerTx.executeSql("INSERT INTO tmp_Program (ProgramID, Name) SELECT ProgramID, Name FROM Program");
					innerTx.executeSql("DROP TABLE Program");
					innerTx.executeSql("ALTER TABLE tmp_Program RENAME TO Program");

					// Signal the end of this job
					upgradeDone(this);
				});

				// Iterate over the existing Series records and set the SeriesID
				tx.executeSql("SELECT rowid FROM Series", [], (innerTx, resultSet) => {
					// Iterate over the rows
					for (let i = 0; i < resultSet.rows.length; i++) {
						const series = resultSet.rows.item(i),
									seriesId = uuid.v4();

						// Update the Series and related Episode records with the new identifier
						innerTx.executeSql("UPDATE Series SET SeriesID = ? WHERE rowid = ?", [seriesId, series.rowid]);
						innerTx.executeSql("UPDATE Episode SET SeriesID = ? WHERE SeriesID = ?", [seriesId, series.rowid]);
					}

					// Drop and recreate the Series table with a new primary key
					innerTx.executeSql("CREATE TABLE tmp_Series (SeriesID PRIMARY KEY NOT NULL, Name, ProgramID, NowShowing)");
					innerTx.executeSql("INSERT INTO tmp_Series (SeriesID, Name, ProgramID, NowShowing) SELECT SeriesID, Name, ProgramID, NowShowing FROM Series");
					innerTx.executeSql("DROP TABLE Series");
					innerTx.executeSql("ALTER TABLE tmp_Series RENAME TO Series");

					// Signal the end of this job
					upgradeDone(this);
				});

				// Iterate over the existing Episode records and set the EpisodeID
				tx.executeSql("SELECT rowid FROM Episode", [], (innerTx, resultSet) => {
					// Iterate over the rows
					for (let i = 0; i < resultSet.rows.length; i++) {
						const episode = resultSet.rows.item(i),
									episodeId = uuid.v4();

						// Update the Episode records with the new identifier
						innerTx.executeSql("UPDATE Episode SET EpisodeID = ? WHERE rowid = ?", [episodeId, episode.rowid]);
					}

					// Drop and recreate the Episode table with a new primary key
					innerTx.executeSql("CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)");
					innerTx.executeSql("INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode");
					innerTx.executeSql("DROP TABLE Episode");
					innerTx.executeSql("ALTER TABLE tmp_Episode RENAME TO Episode");

					// Signal the end of this job
					upgradeDone(this);
				});
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @instance
			 * @method v1_9
			 * @desc Upgrades the database to schema version 1.9
			 * @param {Transaction} tx - the transaction to execute the upgrade in
			 */
			"v1_9"(tx) {
				// Create the Sync table
				tx.executeSql("CREATE TABLE IF NOT EXISTS Sync (Type, ID, Action, PRIMARY KEY ( Type, ID ))");

				// Populate with all existing records
				tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Program', ProgramID, 'modified' FROM Program");
				tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'modified' FROM Series");
				tx.executeSql("INSERT INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'modified' FROM Episode");

				// Remove the LastSyncHash setting (no longer used)
				tx.executeSql("DELETE FROM Setting WHERE Name = 'LastSyncHash'");

				// Move to the next upgrade
				this.nextUpgrade(tx);
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @property {String} displayName - the display name
			 * @desc The display name of the database to use
			 */
			static get displayName() {
				return "TV Manager";
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
			 * @property {String} estimatedSize - the estimated size (in bytes)
			 * @desc The estimated size that the database should be initalised to when created
			 */
			static get estimatedSize() {
				return "10000";
			}

			/**
			 * @memberof DatabaseController
			 * @this DatabaseController
		 	 * @property {String} expectedVersion - the expected database schema version
			 * @desc The expected version of the database after all upgrades have been applied
			 */
			static get expectedVersion() {
				// Set this to the latest supported database schema version
				return "1.9";
			}
		}

		return DatabaseController;
	}
);