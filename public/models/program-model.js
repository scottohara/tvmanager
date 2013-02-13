/**
 * @file (Models) Program
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		'controllers/application-controller',
		'components/progressBar',
		'framework/uuid',
		'framework/jquery'
	],

	/**
	 * @exports models/program
	 */
	function(ApplicationController, ProgressBar, uuid, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class Program
		 * @classdesc Model for programs
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
		 * @this Program
		 * @constructor Program
		 * @param {String} id - unique identifier of the program
		 * @param {String} programName - name of the program
		 * @param {Number} seriesCount - the number of series for the program
		 * @param {Number} episodeCount - the number of episodes for the program
		 * @param {Number} watchedCount - the number of watched episodes for the program
		 * @param {Number} recordedCount - the number of recorded episodes for the program
		 * @param {Number} expectedCount - the number of expected episodes for the program
		 */
		var Program = function (id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount) {
			this.id = id;
			this.setProgramName(programName);
			this.seriesCount = seriesCount;
			this.progressBar = new ProgressBar(episodeCount, []);
			this.setEpisodeCount(episodeCount);
			this.setWatchedCount(watchedCount);
			this.setRecordedCount(recordedCount);
			this.setExpectedCount(expectedCount);
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method save
		 * @desc Saves the program to the database
		 * @param {Function} callback - a function to call after the database is updated
		 */
		Program.prototype.save = function(callback) {
			// Start a new database transaction
			appController.db.transaction($.proxy(function(tx) {
				// If an id has not been set (ie. is a new program to be added), generate a new UUID
				if (!this.id) {
					this.id = uuid.v4();
				}

				// Execute the SQL to insert/update the program
				tx.executeSql("REPLACE INTO Program (ProgramID, Name) VALUES (?, ?)", [this.id, this.programName], $.proxy(function(tx, resultSet) {
					// Regardless of whether the program existed previously or not, we expect one row to be affected; so it's an error if this isn't the case
					if (!resultSet.rowsAffected) {
						throw new Error("no rows affected");
					}

					// Execute the SQL to flag the program as a pending local change
					tx.executeSql("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Program', ?, 'modified')", [this.id],
						$.proxy(function() {
							// If a callback was provided, call it now with the program's id
							if (callback) {
								callback(this.id);
							}
						}, this),
						function(tx, error) {
							// Something went wrong
							throw error;
						}
					);
				}, this));
			}, this),
			function(error) {
				// Something went wrong. If a callback was provided, call it now with no parameters
				if (callback) {
					callback();
				}
				return "Program.save: " + error.message;
			});
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method remove
		 * @desc Deletes the program from the database
		 */
		Program.prototype.remove = function() {
			// Only proceed if there is an ID to delete
			if (this.id) {
				// Start a new database transaction
				appController.db.transaction($.proxy(function(tx) {
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
				}, this),
				null,
				$.proxy(function() {
					// Clear the instance properties
					this.id = null;
					this.programName = null;
				}, this));
			}
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method toJson
		 * @desc Returns a JSON representation of the program
		 * @returns {Object} the JSON representation of the program
		 */
		Program.prototype.toJson = function() {
			return {
				id: this.id,
				programName: this.programName
			};
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setProgramName
		 * @desc Sets the name of the program
		 * @param {String} programName - name of the program
		 */
		Program.prototype.setProgramName = function(programName) {
			this.programName = programName;

			// Recalculate the program group based on the first letter of the program name
			this.programGroup = programName.substring(0,1).toUpperCase();
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setEpisodeCount
		 * @desc Sets the number of episodes for the program
		 * @param {Number} count - the number of episodes for the program
		 */
		Program.prototype.setEpisodeCount = function(count) {
			this.episodeCount = count;

			// Update the progress bar with the new total
			this.progressBar.setTotal(this.episodeCount);

			// Regenerate the progress bar HTML
			this.setWatchedProgress();
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setWatchedCount
		 * @desc Sets the number of watched episodes for the program
		 * @param {Number} count - the number of watched episodes for the program
		 */
		Program.prototype.setWatchedCount = function(count) {
			this.watchedCount = count;

			// Regenerate the progress bar HTML
			this.setWatchedProgress();
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setWatchedProgress
		 * @desc Regenerates the progress bar HTML after setting the episode or watched count
		 */
		Program.prototype.setWatchedProgress = function() {
			var watchedPercent = 0;
			
			// Calculate the percentage of episodes that are watched
			if (this.watchedCount && this.watchedCount > 0) {
				watchedPercent = this.watchedCount / this.episodeCount * 100;
			}

			// Update the watched section of the progress bar, and regenerate the progress bar HTML
			this.progressBarDisplay = this.progressBar.setSection(0, {
				label: this.watchedCount,
				percent: watchedPercent,
				style: "watched"
			});
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setRecordedCount
		 * @desc Sets the number of recorded episodes for the program
		 * @param {Number} count - the number of recorded episodes for the program
		 */
		Program.prototype.setRecordedCount = function(count) {
			this.recordedCount = count;
			var recordedPercent = 0;

			// Calculate the percentage of episodes that are recorded
			if (this.recordedCount && this.recordedCount > 0) {
				recordedPercent = this.recordedCount / this.episodeCount * 100;
			}

			// Update the recorded section of the progress bar, and regenerate the progress bar HTML
			this.progressBarDisplay = this.progressBar.setSection(1, {
				label: this.recordedCount,
				percent: recordedPercent,
				style: "recorded"
			});
		};

		/**
		 * @memberof Program
		 * @this Program
		 * @instance
		 * @method setExpectedCount
		 * @desc Sets the number of expected episodes for the program
		 * @param {Number} count - the number of expected episodes for the program
		 */
		Program.prototype.setExpectedCount = function(count) {
			this.expectedCount = count;
			var expectedPercent = 0;

			// Calculate the percentage of episodes that are expected
			if (this.expectedCount && this.expectedCount > 0) {
				expectedPercent = this.expectedCount / this.episodeCount * 100;
			}

			// Update the expected section of the progress bar, and regenerate the progress bar HTML
			this.progressBarDisplay = this.progressBar.setSection(2, {
				label: this.expectedCount,
				percent: expectedPercent,
				style: "expected"
			});
		};

		/**
		 * @memberof Program
		 * @method list
		 * @desc Retrieves a list of programs
		 * @param {Function} callback - a function to call passing the list of programs retrieved
		 */
		Program.list = function(callback) {
			var programList = [];

			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the list of programs
				tx.executeSql("SELECT p.ProgramID, p.Name, COUNT(DISTINCT s.SeriesID) AS SeriesCount, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e on s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY p.ProgramID ORDER BY p.Name", [],
					function(tx, resultSet) {
						// Iterate of the rows returned
						for (var i = 0; i < resultSet.rows.length; i++) {
							var prog = resultSet.rows.item(i);

							// Instantiate a new Program object and add it to the array
							programList.push(new Program(prog.ProgramID, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount));
						}

						// Invoke the callback function, passing the list of programs
						callback(programList);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the program list (which should be empty)
						callback(programList);
						return "Program.list: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Program
		 * @method find
		 * @desc Retrieves a specific program by it's unique identifier
		 * @param {String} id - unique identifier of the program
		 * @param {Function} callback - a function to call passing the program retrieved
		 */
		Program.find = function(id, callback) {
			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the program
				tx.executeSql("SELECT ProgramID, Name FROM Program WHERE ProgramID = ?", [id],
					function(tx, resultSet) {
						var prog = resultSet.rows.item(0);

						// Instantiate a new Program object, and invoke the callback function passing the program
						callback(new Program(prog.ProgramID, prog.Name));
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing a null
						callback(null);
						return "Program.find: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Program
		 * @method count
		 * @desc Retrieves a count of programs
		 * @param {Function} callback - a function to call passing the program count
		 */
		Program.count = function(callback) {
			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the count of programs
				tx.executeSql("SELECT COUNT(*) AS ProgramCount FROM Program", [],
					function(tx, resultSet) {
						// Invoke the callback function, passing the program count
						callback(resultSet.rows.item(0).ProgramCount);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing zero
						callback(0);
						return "Program.count: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Program
		 * @method removeAll
		 * @desc Removes all programs from the database
		 * @param {Function} callback - a function to call after removing the programs
		 */
		Program.removeAll = function(callback) {
			// Start a new database transaction
			appController.db.transaction(function(tx) {
				// Execute the SQL to delete the programs
				tx.executeSql("DELETE FROM Program", [],
					function(tx, resultSet) {
						// Invoke the callback function
						callback();
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the error message
						var message = "Program.removeAll: " + error.message;
						callback(message);
						return message;
					}
				);
			});
		};

		/**
		 * @memberof Program
		 * @method fromJson
		 * @desc Returns a new Program object populated from a JSON representation
		 * @param {Object} program - a JSON representation of a program
		 * @returns {Program} the Program object
		 */
		Program.fromJson = function(program) {
			return new Program(program.id, program.programName);
		};

		return Program;
	}
);
