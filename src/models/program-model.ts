/**
 * @file (Models) Program
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/program-model
 * @requires models/base-model
 * @requires components/progressbar
 * @requires uuid/v4
 */
import {
	CountCallback,
	FindCallback,
	ListCallback,
	PersistedProgram,
	RemoveCallback,
	SaveCallback,
	SerializedProgram
} from "models";
import Base from "models/base-model";
import ProgressBar from "components/progressbar";
import uuid from "uuid/v4";

/**
 * @class Program
 * @classdesc Model for programs
 * @extends Base
 * @this Program
 * @property {String} id - unique identifier of the program
 * @property {String} programName - name of the program
 * @property {Number} seriesCount - the number of series for the program
 * @property {Number} episodeCount - the number of episodes for the program
 * @property {Number} watchedCount - the number of watched episodes for the program
 * @property {Number} recordedCount - the number of recorded episodes for the program
 * @property {Number} expectedCount - the number of expected episodes for the program
 * @property {ProgressBar} progressBar - progress bar component to generate the progress bar HTML
 * @property {String} programGroup - the first letter of the program name
 * @property {String} progressBarDisplay - HTML of the progress bar to display under the program name in any program lists
 * @param {String} id - unique identifier of the program
 * @param {String} programName - name of the program
 * @param {Number} seriesCount - the number of series for the program
 * @param {Number} episodeCount - the number of episodes for the program
 * @param {Number} watchedCount - the number of watched episodes for the program
 * @param {Number} recordedCount - the number of recorded episodes for the program
 * @param {Number} expectedCount - the number of expected episodes for the program
 */
export default class Program extends Base {
	public programName: string | null = null;

	public progressBarDisplay!: string;

	public programGroup = "";

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private progressBar: ProgressBar;

	public constructor(public id: string | null, programName: string | null,
						public seriesCount: number = 0, episodeCount = 0, watchedCount = 0, recordedCount = 0, expectedCount = 0) {
		super();
		this.setProgramName(programName);
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
	}

	/**
	 * @memberof Program
	 * @static
	 * @method list
	 * @desc Retrieves a list of programs
	 * @param {Function} callback - a function to call passing the list of programs retrieved
	 */
	public static list(callback: ListCallback): void {
		const programList: Program[] = [];

		// Start a new readonly database transaction and execute the SQL to retrieve the list of programs
		this.db.readTransaction((tx: SQLTransaction): void => tx.executeSql(`
			SELECT					p.ProgramID,
											p.Name,
											COUNT(DISTINCT s.SeriesID) AS SeriesCount,
											COUNT(e.EpisodeID) AS EpisodeCount,
											COUNT(e2.EpisodeID) AS WatchedCount,
											COUNT(e3.EpisodeID) AS RecordedCount,
											COUNT(e4.EpisodeID) AS ExpectedCount
			FROM						Program p
			LEFT OUTER JOIN	Series s on p.ProgramID = s.ProgramID
			LEFT OUTER JOIN	Episode e on s.SeriesID = e.SeriesID
			LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
			LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
			LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
			GROUP BY		 		p.ProgramID
			ORDER BY p.Name COLLATE NOCASE
		`, [], (_: SQLTransaction, resultSet: SQLResultSet): void => {
			// Iterate of the rows returned
			for (let i = 0; i < resultSet.rows.length; i++) {
				const prog: PersistedProgram = resultSet.rows.item(i);

				// Instantiate a new Program object and add it to the array
				programList.push(new Program(prog.ProgramID, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount));
			}

			// Invoke the callback function, passing the list of programs
			callback(programList);
		}, (): boolean => {
			// Something went wrong. Call the callback passing the program list (which should be empty)
			callback(programList);

			return false;
		}));
	}

	/**
	 * @memberof Program
	 * @static
	 * @method find
	 * @desc Retrieves a specific program by it's unique identifier
	 * @param {String} id - unique identifier of the program
	 * @param {Function} callback - a function to call passing the program retrieved
	 */
	public static find(id: string, callback: FindCallback): void {
		// Start a new readonly database transaction and execute the SQL to retrieve the program
		this.db.readTransaction((tx: SQLTransaction): void => tx.executeSql(`
			SELECT	ProgramID,
							Name
			FROM		Program
			WHERE		ProgramID = ?
		`, [id], (_: SQLTransaction, resultSet: SQLResultSet): void => {
			const prog: PersistedProgram = resultSet.rows.item(0);

			// Instantiate a new Program object, and invoke the callback function passing the program
			callback(new Program(prog.ProgramID, prog.Name));
		}, (): boolean => {
			// Something went wrong. Call the callback passing a null
			callback(null);

			return false;
		}));
	}

	/**
	 * @memberof Program
	 * @static
	 * @method count
	 * @desc Retrieves a count of programs
	 * @param {Function} callback - a function to call passing the program count
	 */
	public static count(callback: CountCallback): void {
		// Start a new readonly database transaction and execute the SQL to retrieve the count of programs
		this.db.readTransaction((tx: SQLTransaction): void => tx.executeSql(`
			SELECT	COUNT(*) AS ProgramCount
			FROM Program
		`, [],
		(_: SQLTransaction, resultSet: SQLResultSet): void => callback(resultSet.rows.item(0).ProgramCount),
		(): boolean => {
			// Something went wrong. Call the callback passing zero
			callback(0);

			return false;
		}));
	}

	/**
	 * @memberof Program
	 * @static
	 * @method removeAll
	 * @desc Removes all programs from the database
	 * @param {Function} callback - a function to call after removing the programs
	 */
	public static removeAll(callback: RemoveCallback): void {
		// Start a new database transaction and execute the SQL to delete the programs
		this.db.transaction((tx: SQLTransaction): void => tx.executeSql("DELETE FROM Program", [],
			(): void =>	callback(),
			(_: SQLTransaction, error: SQLError): boolean => {
				// Something went wrong. Call the callback passing the error message
				const message = `Program.removeAll: ${error.message}`;

				callback(message);

				return false;
			}));
	}

	/**
	 * @memberof Program
	 * @static
	 * @method fromJson
	 * @desc Returns a new Program object populated from a JSON representation
	 * @param {Object} program - a JSON representation of a program
	 * @returns {Program} the Program object
	 */
	public static fromJson(program: SerializedProgram): Program {
		return new Program(program.id, program.programName);
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method save
	 * @desc Saves the program to the database
	 * @param {Function} callback - a function to call after the database is updated
	 */
	public save(callback?: SaveCallback): void {
		// Start a new database transaction
		this.db.transaction((tx: SQLTransaction): void => {
			// If an id has not been set (ie. is a new program to be added), generate a new UUID
			if (!this.id) {
				this.id = uuid();
			}

			// Execute the SQL to insert/update the program
			tx.executeSql(`
				REPLACE INTO Program (ProgramID, Name)
				VALUES (?, ?)
			`, [this.id, this.programName], (innerTx: SQLTransaction, resultSet: SQLResultSet): void => {
				// Regardless of whether the program existed previously or not, we expect one row to be affected; so it's an error if this isn't the case
				if (!resultSet.rowsAffected) {
					throw new Error("no rows affected");
				}

				// Execute the SQL to flag the program as a pending local change
				innerTx.executeSql(`
					INSERT OR IGNORE INTO Sync (Type, ID, Action)
					VALUES ('Program', ?, 'modified')
				`, [this.id], (): void => {
					// If a callback was provided, call it now with the program's id
					if (callback) {
						callback(this.id);
					}
				}, (_: SQLTransaction, error: SQLError): boolean => {
					// Something went wrong
					throw error;
				});
			});
		}, (): void => {
			// Something went wrong. If a callback was provided, call it now with no parameters
			if (callback) {
				callback();
			}
		});
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method remove
	 * @desc Deletes the program from the database
	 */
	public remove(): void {
		let errorCallback: undefined;

		// Only proceed if there is an ID to delete
		if (this.id) {
			// Start a new database transaction
			this.db.transaction((tx: SQLTransaction): void => {
				// Execute the SQL to flag all of the program's episodes as a pending local change
				tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ?)", [this.id]);

				// Execute the SQL to delete all of the program's episodes
				tx.executeSql("DELETE FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ?)", [this.id]);

				// Execute the SQL to flag all of the program's series as a pending local change
				tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'deleted' FROM Series WHERE ProgramID = ?", [this.id]);

				// Execute the SQL to delete all of the program's series
				tx.executeSql("DELETE FROM Series WHERE ProgramID = ?", [this.id]);

				// Execute the SQL to flag the program as a pending local change
				tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Program', ?, 'deleted')", [this.id]);

				// Execute the SQL to delete the program
				tx.executeSql("DELETE FROM Program WHERE ProgramID = ?", [this.id]);
			}, errorCallback, (): void => {
				// Clear the instance properties
				this.id = null;
				this.programName = null;
			});
		}
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method toJson
	 * @desc Returns a JSON representation of the program
	 * @returns {Object} the JSON representation of the program
	 */
	public toJson(): SerializedProgram {
		return {
			id: this.id,
			programName: this.programName,
			type: "Program"
		};
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setProgramName
	 * @desc Sets the name of the program
	 * @param {String} programName - name of the program
	 */
	public setProgramName(programName: string | null): void {
		this.programName = programName;

		// Recalculate the program group based on the first letter of the program name
		this.programGroup = programName ? programName.substring(0, 1).toUpperCase() : "";
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setEpisodeCount
	 * @desc Sets the number of episodes for the program
	 * @param {Number} count - the number of episodes for the program
	 */
	public setEpisodeCount(count: number): void {
		this.episodeCount = count;

		// Update the progress bar with the new total
		this.progressBar.setTotal(this.episodeCount);

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setWatchedCount
	 * @desc Sets the number of watched episodes for the program
	 * @param {Number} count - the number of watched episodes for the program
	 */
	public setWatchedCount(count: number): void {
		this.watchedCount = count;

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setRecordedCount
	 * @desc Sets the number of recorded episodes for the program
	 * @param {Number} count - the number of recorded episodes for the program
	 */
	public setRecordedCount(count: number): void {
		const PERCENT = 100,
					RECORDED = 1;
		let recordedPercent = 0;

		this.recordedCount = count;

		// Calculate the percentage of episodes that are recorded
		recordedPercent = this.recordedCount / this.episodeCount * PERCENT;

		// Update the recorded section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(RECORDED, {
			label: this.recordedCount,
			percent: recordedPercent,
			style: "recorded"
		});
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setExpectedCount
	 * @desc Sets the number of expected episodes for the program
	 * @param {Number} count - the number of expected episodes for the program
	 */
	public setExpectedCount(count: number): void {
		const PERCENT = 100,
					EXPECTED = 2;
		let expectedPercent = 0;

		this.expectedCount = count;

		// Calculate the percentage of episodes that are expected
		expectedPercent = this.expectedCount / this.episodeCount * PERCENT;

		// Update the expected section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(EXPECTED, {
			label: this.expectedCount,
			percent: expectedPercent,
			style: "expected"
		});
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setWatchedProgress
	 * @desc Regenerates the progress bar HTML after setting the episode or watched count
	 */
	private setWatchedProgress(): void {
		const PERCENT = 100,
					WATCHED = 0;
		let watchedPercent = 0;

		// Calculate the percentage of episodes that are watched
		watchedPercent = this.watchedCount / this.episodeCount * PERCENT;

		// Update the watched section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(WATCHED, {
			label: this.watchedCount,
			percent: watchedPercent,
			style: "watched"
		});
	}
}