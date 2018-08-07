/**
 * @file (Services) DatabaseService
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module services/database-service
 * @requires uuid/v4
 * @requires components/window
 */
import {
	DatabaseErrorCallback,
	DatabaseSuccessCallback,
	DatabaseUpgrade
} from "services";
import {
	PersistedEpisode,
	PersistedProgram,
	PersistedSeries
} from "models";
import uuid from "uuid/v4";
import window from "components/window";

/**
 * @class DatabaseService
 * @classdesc Provides access to the HTML5 Web SQL database
 * @property {String} databaseName - the name of the database to use
 * @property {Function} successCallback - a function to call on successfully connecting to the database
 * @property {String} initialVersion - the initial version of the database on create/open
 * @property {Database} db - the HTML5 Web SQL database
 * @param {String} databaseName - the name of the database to use
 * @param {Function} callback - a function to call on successfully connecting to the database
 * @param {Function} errorCallback - a function to call on failure to connect to the database
 * @returns {Database} a HTML5 Web SQL database
 */

const ESTIMATED_SIZE = 10000;

export default class DatabaseService {
	private static databaseName: string;

	private static successCallback: DatabaseSuccessCallback;

	private static initialVersion: DOMString = "";

	// Set this to the latest supported database schema version
	private static readonly expectedVersion: DOMString = "1.9";

	private static readonly estimatedSize: number = ESTIMATED_SIZE;

	private static readonly displayName: string = "TV Manager";

	private static db: Database;

	private static upgradesToApply: DatabaseUpgrade[];

	public static connect(databaseName: string, successCallback: DatabaseSuccessCallback, errorCallback: DatabaseErrorCallback): Database {
		this.databaseName = databaseName;
		this.successCallback = successCallback;

		// Attempt to open the database
		this.openDb();

		// If successful, we should now have a reference to the database
		if (this.db) {
			// Record the current schema version of the database
			this.initialVersion = this.db.version;

			// If the current version is not the expected version, we need to upgrade it
			if (this.initialVersion === this.expectedVersion) {
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
				message: `Unable to open database ${this.databaseName}`
			});
		}

		// Return the reference to the database
		return this.db;
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @property {Array<DBUpgrade>} upgrades - an array of upgrade routines
	 * @desc The set of upgrades to migrate to a newer schema version
	 */
	private static get upgrades(): DatabaseUpgrade[] {
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
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method openDb
	 * @desc Opens the specified HTML5 Web SQL database
	 */
	private static openDb(): void {
		this.db = window.openDatabase(this.databaseName, "", this.displayName, this.estimatedSize);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method versionOK
	 * @desc Calls the success handler to signal that the database is ready
	 */
	private static versionOK(): void {
		// If we're not yet at the expected version (ie. we just upgraded), reopen the database
		if (this.initialVersion !== this.expectedVersion) {
			this.openDb();
		}

		// Call the success handler
		this.successCallback({initial: this.initialVersion, current: this.expectedVersion});
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method startUpgrade
	 * @desc Starts the database upgrade process
	 * @param {Function} errorCallback - a function to call on failure to upgrade the database
	 */
	private static startUpgrade(errorCallback: DatabaseErrorCallback): void {
		// Determine which upgrade routines to apply
		let startIndex: number = this.upgrades.findIndex((upgrade: DatabaseUpgrade): boolean => upgrade.version === this.initialVersion),
				endIndex: number = this.upgrades.findIndex((upgrade: DatabaseUpgrade): boolean => upgrade.version === this.expectedVersion);

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
		this.db.changeVersion(this.initialVersion, this.expectedVersion, (tx: SQLTransaction): void => {
			// Invoke the first upgrade routine
			this.nextUpgrade(tx);
		}, errorCallback, this.versionOK.bind(this));
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method nextUpgrade
	 * @desc Pops the next upgrade routine off the front of the array and executes the upgrade handler
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static nextUpgrade(tx: SQLTransaction): void {
		// Only proceed if we have upgrades left
		if (this.upgradesToApply.length) {
			// Pop the first one off the front of the array and execute the upgrade handler
			(this.upgradesToApply.shift() as DatabaseUpgrade).upgradeHandler.bind(this)(tx);
		}
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_0
	 * @desc Initialises the database to schema version 1.0
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_0"(tx: SQLTransaction): void {
		// Create the Program, Series and Episode tables
		tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
		tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
		tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_1
	 * @desc Upgrades the database to schema version 1.1
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_1"(tx: SQLTransaction): void {
		// Add Episode.Status
		tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_2
	 * @desc Upgrades the database to schema version 1.2
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_2"(tx: SQLTransaction): void {
		// Add Episode.StatusDate
		tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_3
	 * @desc Upgrades the database to schema version 1.3
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_3"(tx: SQLTransaction): void {
		// Add Series.NowShowing
		tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_4
	 * @desc Upgrades the database to schema version 1.4
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_4"(tx: SQLTransaction): void {
		// Add Episode.Unverified
		tx.executeSql("ALTER TABLE Episode ADD COLUMN Unverified");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_5
	 * @desc Upgrades the database to schema version 1.5
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_5"(tx: SQLTransaction): void {
		// Create the Setting table
		tx.executeSql("CREATE TABLE IF NOT EXISTS Setting (Name, Value)");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_6
	 * @desc Upgrades the database to schema version 1.6
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_6"(tx: SQLTransaction): void {
		// Add Episode.Unscheduled
		tx.executeSql("ALTER TABLE Episode ADD COLUMN Unscheduled");

		// Move to the next upgrade
		this.nextUpgrade(tx);
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_7
	 * @desc Upgrades the database to schema version 1.7
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_7"(tx: SQLTransaction): void {
		// Add Episode.Sequence
		tx.executeSql("ALTER TABLE Episode ADD COLUMN Sequence");

		// Iterate over the existing Episode records in Series order, and set the Sequence
		tx.executeSql("SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID", [], (innerTx: SQLTransaction, resultSet: SQLResultSet): void => {
			let seriesId = "",
					sequence = 0;

			// Iterate over the rows
			for (let i = 0; i < resultSet.rows.length; i++) {
				const ep: PersistedEpisode = resultSet.rows.item(i);

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
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_8
	 * @desc Upgrades the database to schema version 1.8
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_8"(tx: SQLTransaction): void {
		// Declare the number of parallel jobs to complete
		const numSteps = 3;
		let remainingSteps: number = numSteps;

		// Declare a function to call once all jobs are done
		function upgradeDone(): void {
			if (0 === --remainingSteps) {
				// Move to the next upgrade
				DatabaseService.nextUpgrade(tx);
			}
		}

		// Add Program.ProgramID, Series.SeriesID and Episode.EpisodeID
		tx.executeSql("ALTER TABLE Program ADD COLUMN ProgramID");
		tx.executeSql("ALTER TABLE Series ADD COLUMN SeriesID");
		tx.executeSql("ALTER TABLE Episode ADD COLUMN EpisodeID");

		// Iterate over the existing Program records and set the ProgramID
		tx.executeSql("SELECT rowid FROM Program", [], (innerTx: SQLTransaction, resultSet: SQLResultSet): void => {
			// Iterate over the rows
			for (let i = 0; i < resultSet.rows.length; i++) {
				const prog: PersistedProgram = resultSet.rows.item(i),
							programId: string = uuid();

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
			upgradeDone();
		});

		// Iterate over the existing Series records and set the SeriesID
		tx.executeSql("SELECT rowid FROM Series", [], (innerTx: SQLTransaction, resultSet: SQLResultSet): void => {
			// Iterate over the rows
			for (let i = 0; i < resultSet.rows.length; i++) {
				const series: PersistedSeries = resultSet.rows.item(i),
							seriesId: string = uuid();

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
			upgradeDone();
		});

		// Iterate over the existing Episode records and set the EpisodeID
		tx.executeSql("SELECT rowid FROM Episode", [], (innerTx: SQLTransaction, resultSet: SQLResultSet): void => {
			// Iterate over the rows
			for (let i = 0; i < resultSet.rows.length; i++) {
				const episode: PersistedEpisode = resultSet.rows.item(i),
							episodeId: string = uuid();

				// Update the Episode records with the new identifier
				innerTx.executeSql("UPDATE Episode SET EpisodeID = ? WHERE rowid = ?", [episodeId, episode.rowid]);
			}

			// Drop and recreate the Episode table with a new primary key
			innerTx.executeSql("CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)");
			innerTx.executeSql("INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode");
			innerTx.executeSql("DROP TABLE Episode");
			innerTx.executeSql("ALTER TABLE tmp_Episode RENAME TO Episode");

			// Signal the end of this job
			upgradeDone();
		});
	}

	/**
	 * @memberof DatabaseService
	 * @this DatabaseService
	 * @instance
	 * @method v1_9
	 * @desc Upgrades the database to schema version 1.9
	 * @param {Transaction} tx - the transaction to execute the upgrade in
	 */
	private static "v1_9"(tx: SQLTransaction): void {
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
}