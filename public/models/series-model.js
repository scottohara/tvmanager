/**
 * @file (Models) Series
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller",
		"components/progressBar",
		"framework/uuid"
	],

	/**
	 * @exports models/series
	 */
	(ApplicationController, ProgressBar, uuid) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class Series
		 * @classdesc Model for series
		 * @property {String} id - unique identifier of the series
		 * @property {String} seriesName - name of the series
		 * @property {Number} nowShowing - the now showing status
		 * @property {String} programId - unique identifier of the program that the series belongs to
		 * @property {String} programName - name of the program that the series belongs to
		 * @property {Number} episodeCount - the number of episodes for the series
		 * @property {Number} watchedCount - the number of watched episodes for the series
		 * @property {Number} recordedCount - the number of recorded episodes for the series
		 * @property {Number} expectedCount - the number of expected episodes for the series
		 * @property {Number} missedCount - the number of missed episodes for the series
		 * @property {Number} statusWarningCount - the number of expected episodes past their status date for the series
		 * @property {ProgressBar} progressBar - progress bar component to generate the progress bar HTML
		 * @property {String} nowShowingDisplay - the display value of the now showing status, use for grouping in the schedule view
		 * @property {String} progressBarDisplay - HTML of the progress bar to display under the series name in any series lists
		 * @property {String} statusWarning - a CSS class name to use to indicate that one or more expected episodes for the series have passed their expected date
		 */
		class Series {
			/**
			 * @constructor Series
			 * @this Series
			 * @param {String} id - unique identifier of the series
			 * @param {String} seriesName - name of the series
			 * @param {Number} nowShowing - the now showing status
			 * @param {String} programId - unique identifier of the program that the series belongs to
			 * @param {String} programName - name of the program that the series belongs to
			 * @param {Number} episodeCount - the number of episodes for the series
			 * @param {Number} watchedCount - the number of watched episodes for the series
			 * @param {Number} recordedCount - the number of recorded episodes for the series
			 * @param {Number} expectedCount - the number of expected episodes for the series
			 * @param {Number} missedCount - the number of missed episodes for the series
			 * @param {Number} statusWarningCount - the number of expected episodes past their status date for the series
			 */
			constructor(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount) {
				this.id = id;
				this.seriesName = seriesName;
				this.setNowShowing(nowShowing);
				this.programId = programId;
				this.programName = programName;
				this.progressBar = new ProgressBar(episodeCount, []);
				this.setEpisodeCount(episodeCount);
				this.setWatchedCount(watchedCount);
				this.setRecordedCount(recordedCount);
				this.setExpectedCount(expectedCount);
				this.setMissedCount(missedCount);
				this.setStatusWarning(statusWarningCount);
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method save
			 * @desc Saves the series to the database
			 * @param {Function} callback - a function to call after the database is updated
			 */
			save(callback) {
				// Start a new database transaction
				appController.db.transaction(tx => {
					// If an id has not been set (ie. is a new series to be added), generate a new UUID
					if (!this.id) {
						this.id = uuid.v4();
					}

					// Execute the SQL to insert/update the program
					tx.executeSql(`
							REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID)
							VALUES (?, ?, ?, ?)
						`,
						[this.id, this.seriesName, this.nowShowing, this.programId],
						(innerTx, resultSet) => {
							// Regardless of whether the series existed previously or not, we expect one row to be affected; so it's an error if this isn't the case
							if (!resultSet.rowsAffected) {
								throw new Error("no rows affected");
							}

							// Execute the SQL to flag the series as a pending local change
							innerTx.executeSql(`
									INSERT OR IGNORE INTO Sync (Type, ID, Action)
									VALUES ('Series', ?, 'modified')
								`,
								[this.id],
								() => {
									// If a callback was provided, call it now with the series' id
									if (callback) {
										callback(this.id);
									}
								},
								(_, error) => {
									// Something went wrong
									throw error;
								}
							);
						}
					);
				}, error => {
					// Something went wrong. If a callback was provided, call it now with no parameters
					if (callback) {
						callback();
					}

					return `Series.save: ${error.message}`;
				});
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method remove
			 * @desc Deletes the series from the database
			 */
			remove() {
				// Only proceed if there is an ID to delete
				if (this.id) {
					// Start a new database transaction
					appController.db.transaction(tx => {
						// Execute the SQL to flag all of the series' episodes as a pending local change
						tx.executeSql("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID = ?", [this.id]);

						// Execute the SQL to delete all of the series' episodes
						tx.executeSql("DELETE FROM Episode WHERE SeriesID = ?", [this.id]);

						// Execute the SQL to flag the series as a pending local change
						tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Series', ?, 'deleted')", [this.id]);

						// Execute the SQL to delete the series
						tx.executeSql("DELETE FROM Series WHERE SeriesID = ?", [this.id]);
					}, null, () => {
						// Clear the instance properties
						this.id = null;
						this.seriesName = null;
						this.nowShowing = null;
						this.programId = null;
					});
				}
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method toJson
			 * @desc Returns a JSON representation of the series
			 * @returns {Object} the JSON representation of the series
			 */
			toJson() {
				return {
					id: this.id,
					seriesName: this.seriesName,
					nowShowing: this.nowShowing,
					programId: this.programId
				};
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setNowShowing
			 * @desc Sets the now showing status of the series
			 * @param {Number} nowShowing - the now showing status of the series
			 */
			setNowShowing(nowShowing) {
				const showing = Number(nowShowing) || 0;

				// If the value passed (or defaulted) is "Not Showing", clear the property
				if (0 === showing) {
					this.nowShowing = null;
				} else {
					// Otherwise set it to the passed value
					this.nowShowing = showing;
				}

				// Update the now showing display value
				this.nowShowingDisplay = Series.NOW_SHOWING[showing];
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setEpisodeCount
			 * @desc Sets the number of episodes for the series
			 * @param {Number} count - the number of episodes for the series
			 */
			setEpisodeCount(count) {
				this.episodeCount = count;

				// Update the progress bar with the new total
				this.progressBar.setTotal(this.episodeCount);

				// Regenerate the progress bar HTML
				this.setWatchedProgress();
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setWatchedCount
			 * @desc Sets the number of watched episodes for the series
			 * @param {Number} count - the number of watched episodes for the series
			 */
			setWatchedCount(count) {
				this.watchedCount = count;

				// Regenerate the progress bar HTML
				this.setWatchedProgress();
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setWatchedProgress
			 * @desc Regenerates the progress bar HTML after setting the episode or watched count
			 */
			setWatchedProgress() {
				const PERCENT = 100,
							WATCHED = 0;
				let watchedPercent = 0;

				// Calculate the percentage of episodes that are watched
				if (this.watchedCount && this.watchedCount > 0) {
					watchedPercent = this.watchedCount / this.episodeCount * PERCENT;
				}

				// Update the watched section of the progress bar, and regenerate the progress bar HTML
				this.progressBarDisplay = this.progressBar.setSection(WATCHED, {
					label: this.watchedCount,
					percent: watchedPercent,
					style: "watched"
				});
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setRecordedCount
			 * @desc Sets the number of recorded episodes for the series
			 * @param {Number} count - the number of recorded episodes for the series
			 */
			setRecordedCount(count) {
				const PERCENT = 100,
							RECORDED = 1;
				let recordedPercent = 0;

				this.recordedCount = count;

				// Calculate the percentage of episodes that are recorded
				if (this.recordedCount && this.recordedCount > 0) {
					recordedPercent = this.recordedCount / this.episodeCount * PERCENT;
				}

				// Update the recorded section of the progress bar, and regenerate the progress bar HTML
				this.progressBarDisplay = this.progressBar.setSection(RECORDED, {
					label: this.recordedCount,
					percent: recordedPercent,
					style: "recorded"
				});
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setExpectedCount
			 * @desc Sets the number of expected episodes for the series
			 * @param {Number} count - the number of expected episodes for the series
			 */
			setExpectedCount(count) {
				const	PERCENT = 100,
							EXPECTED = 2;
				let expectedPercent = 0;

				this.expectedCount = count;

				// Calculate the percentage of episodes that are expected
				if (this.expectedCount && this.expectedCount > 0) {
					expectedPercent = this.expectedCount / this.episodeCount * PERCENT;
				}

				// Update the expected section of the progress bar, and regenerate the progress bar HTML
				this.progressBarDisplay = this.progressBar.setSection(EXPECTED, {
					label: this.expectedCount,
					percent: expectedPercent,
					style: "expected"
				});
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setMissedCount
			 * @desc Sets the number of missed episodes for the series
			 * @param {Number} count - the number of missed episodes for the series
			 */
			setMissedCount(count) {
				const PERCENT = 100,
							MISSED = 3;
				let missedPercent = 0;

				this.missedCount = count;

				// Calculate the percentage of episodes that are missed
				if (this.missedCount && this.missedCount > 0) {
					missedPercent = this.missedCount / this.episodeCount * PERCENT;
				}

				// Update the missed section of the progress bar, and regenerate the progress bar HTML
				this.progressBarDisplay = this.progressBar.setSection(MISSED, {
					label: this.missedCount,
					percent: missedPercent,
					style: "missed"
				});
			}

			/**
			 * @memberof Series
			 * @this Series
			 * @instance
			 * @method setStatusWarning
			 * @desc Sets the number of expected episodes past their status date for the series
			 * @param {Number} count - the number of expected episodes past their status date for the series
			 */
			setStatusWarning(count) {
				this.statusWarningCount = count;

				// If there are one or more episodes with a warning, highlight the series with a warning also
				if (this.statusWarningCount > 0) {
					this.statusWarning = "warning";
				}	else {
					this.statusWarning = "";
				}
			}

			/**
			 * @memberof Series
			 * @inner standardQuery
			 * @desc Defines the standard SELECT, aggregate and FROM clauses for retrieving a list of series
			 */
			static get standardQuery() {
				return {
					baseData: `
						SELECT	p.Name AS ProgramName,
										s.SeriesID,
										s.Name,
										s.NowShowing,
										s.ProgramID,
					`,
					summaryData: `
						COUNT(e.EpisodeID) AS EpisodeCount,
						COUNT(e2.EpisodeID) AS WatchedCount,
						COUNT(e3.EpisodeID) AS RecordedCount,
						COUNT(e4.EpisodeID) AS ExpectedCount
					`,
					entityList: `
						FROM						Program p
						JOIN						Series s ON p.ProgramID = s.ProgramID
						LEFT OUTER JOIN	Episode e ON s.SeriesID = e.SeriesID
						LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
						LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
						LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
					`
				};
			}

			/**
			 * @memberof Series
			 * @method listByProgram
			 * @desc Retrieves a list of series for a given program
			 * @param {String} programId - the unique identifier of the program to retrieve
			 * @param {Function} callback - a function to call passing the list of series retrieved
			 */
			static listByProgram(programId, callback) {
				// Set the SELECT and FROM clauses to use the standard
				// Set the WHERE clause to filter by the specified program, the GROUP BY clause to aggregate by series, and the ORDER BY clause to sort by series name
				const query = `
								${this.standardQuery.baseData}
								${this.standardQuery.summaryData}
								${this.standardQuery.entityList}
							`,
							filter = `
								WHERE			p.ProgramID = ?
								GROUP BY	s.SeriesID
								ORDER BY	s.Name COLLATE NOCASE
							`,
							params = [programId];

				// Get the list of series
				this.list(query, filter, params, callback);
			}

			/**
			 * @memberof Series
			 * @method listByNowShowing
			 * @desc Retrieves a list of series that are currently showing, or have recorded/expected episodes
			 * @param {Function} callback - a function to call passing the list of series retrieved
			 */
			static listByNowShowing(callback) {
				// Set the SELECT and FROM clauses to use the standard, plus a calculation of the number of episodes with a warning
				// Set the GROUP BY clause to aggregate by series, the HAVING clause to filter by now showing or recorded/expected counts, and the ORDER BY clause to sort by now showing and program name
				const	monthNumberCase = `
								CASE SUBSTR(e4.StatusDate, 4, 3)
									WHEN 'Jan' THEN '01'
									WHEN 'Feb' THEN '02'
									WHEN 'Mar' THEN '03'
									WHEN 'Apr' THEN '04'
									WHEN 'May' THEN '05'
									WHEN 'Jun' THEN '06'
									WHEN 'Jul' THEN '07'
									WHEN 'Aug' THEN '08'
									WHEN 'Sep' THEN '09'
									WHEN 'Oct' THEN '10'
									WHEN 'Nov' THEN '11'
									WHEN 'Dec' THEN '12'
								END
							`,
							query = `
								${this.standardQuery.baseData}
								${this.standardQuery.summaryData},
								SUM(CASE
									WHEN e4.StatusDate IS NULL THEN 0
									WHEN STRFTIME('%m', 'now') < '04' THEN
										CASE
											WHEN STRFTIME('%m%d', 'now') < (${monthNumberCase} || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (${monthNumberCase} || SUBSTR(e4.StatusDate, 1, 2)) THEN 0
											ELSE 1
										END
									ELSE
										CASE
											WHEN STRFTIME('%m%d', 'now') < (${monthNumberCase} || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (${monthNumberCase} || SUBSTR(e4.StatusDate, 1, 2)) THEN 0
											ELSE 1
										END
								END) AS StatusWarningCount
								${this.standardQuery.entityList}
							`,
							filter = `
								GROUP BY	s.SeriesID
								HAVING		s.NowShowing IS NOT NULL OR
													COUNT(e3.EpisodeID) > 0 OR
													COUNT(e4.EpisodeID) > 0
								ORDER BY	CASE
														WHEN s.NowShowing IS NULL THEN 1
														ELSE 0
													END,
													s.NowShowing,
													p.Name COLLATE NOCASE
							`,
							params = [];

				// Get the list of series
				this.list(query, filter, params, callback);
			}

			/**
			 * @memberof Series
			 * @method listByStatus
			 * @desc Retrieves a list of series that have one or more episodes with a given status
			 * @param {Function} callback - a function to call passing the list of series retrieved
			 * @param {String} status - the episode status
			 */
			static listByStatus(callback, status) {
				// Set the SELECT clause to the standard, plus a calculation of the number of episodes in the specified status
				// Set the WHERE clause to filter by the specified status, the GROUP BY clause to aggregate by series, and the ORDER BY clause to sort by program name and series name
				const query = `
								${this.standardQuery.baseData}
											COUNT(e.EpisodeID) AS EpisodeCount,
											COUNT(e.EpisodeID) AS ${status}Count
								FROM	Program p
								JOIN	Series s ON p.ProgramID = s.ProgramID
								JOIN	Episode e ON s.SeriesID = e.SeriesID
							`,
							filter = `
								WHERE			e.Status = ?
								GROUP BY	s.SeriesID
								ORDER BY	p.Name COLLATE NOCASE,
													s.Name COLLATE NOCASE
							`,
							params = [status];

				// Get the list of series
				this.list(query, filter, params, callback);
			}

			/**
			 * @memberof Series
			 * @method listByIncomplete
			 * @desc Retrieves a list of series that have some, but not all, episodes watched
			 * @param {Function} callback - a function to call passing the list of series retrieved
			 */
			static listByIncomplete(callback) {
				// Set the SELECT and FROM clauses to use the standard
				// Set the GROUP BY clause to aggregate by series, the HAVING clause to filter by any series that have some but not all episodes watched, and the ORDER BY clause to sort by program name and series name
				const query = `
								${this.standardQuery.baseData}
								${this.standardQuery.summaryData}
								${this.standardQuery.entityList}
							`,
							filter = `
								GROUP BY	s.SeriesID
								HAVING		COUNT(e.EpisodeID) > COUNT(e2.EpisodeID) AND
													COUNT(e2.EpisodeID) > 0
								ORDER BY	p.Name COLLATE NOCASE,
													s.Name COLLATE NOCASE
							`,
							params = [];

				// Get the list of series
				this.list(query, filter, params, callback);
			}

			/**
			 * @memberof Series
			 * @method list
			 * @desc Retrieves a list of series
			 * @param {String} query - a SQL SELECT/FROM clause
			 * @param {String} filter - a parameterised SQL WHERE/GROUP BY/HAVING/ORDER BY clause
			 * @param {Array<String>} params - an array of parameter values for the filter
			 * @param {Function} callback - a function to call passing the list of series retrieved
			 */
			static list(query, filter, params, callback) {
				const seriesList = [];

				// Start a new readonly database transaction and execute the SQL to retrieve the list of series
				appController.db.readTransaction(tx => tx.executeSql(`
						${query}
						${filter}
					`,
					params,
					(_, resultSet) => {
						// Iterate of the rows returned
						for (let i = 0; i < resultSet.rows.length; i++) {
							const series = resultSet.rows.item(i);

							// Instantiate a new Series object and add it to the array
							seriesList.push(new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount));
						}

						// Invoke the callback function, passing the list of series
						callback(seriesList);
					}, (_, error) => {
						// Something went wrong. Call the callback passing the series list (which should be empty)
						callback(seriesList);

						return `Series.list: ${error.message}`;
					}
				));
			}

			/**
			 * @memberof Series
			 * @method find
			 * @desc Retrieves a specific series by it's unique identifier
			 * @param {String} id - unique identifier of the series
			 * @param {Function} callback - a function to call passing the series retrieved
			 */
			static find(id, callback) {
				// Start a new readonly database transaction and execute the SQL to retrieve the series
				appController.db.readTransaction(tx => tx.executeSql(`
						SELECT	SeriesID,
										Name,
										ProgramID,
										NowShowing
						FROM		Series
						WHERE		SeriesID = ?
					`,
					[id],
					(_, resultSet) => {
						const series = resultSet.rows.item(0);

						// Instantiate a new Series object, and invoke the callback function passing the series
						callback(new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID));
					}, (_, error) => {
						// Something went wrong. Call the callback passing a null
						callback(null);

						return `Series.find: ${error.message}`;
					}
				));
			}

			/**
			 * @memberof Series
			 * @method count
			 * @desc Retrieves a count of series
			 * @param {Function} callback - a function to call passing the series count
			 */
			static count(callback) {
				// Start a new readonly database transaction and execute the SQL to retrieve the count of series
				appController.db.readTransaction(tx => tx.executeSql(`
						SELECT	COUNT(*) AS SeriesCount
						FROM		Series
					`,
					[],
					(_, resultSet) => callback(resultSet.rows.item(0).SeriesCount),
					(_, error) => {
						// Something went wrong. Call the callback passing zero
						callback(0);

						return `Series.count: ${error.message}`;
					}
				));
			}

			/**
			 * @memberof Series
			 * @method removeAll
			 * @desc Removes all series from the database
			 * @param {Function} callback - a function to call after removing the series
			 */
			static removeAll(callback) {
				// Start a new database transaction and execute the SQL to delete the series
				appController.db.transaction(tx => tx.executeSql("DELETE FROM Series", [],
					() => callback(),
					(_, error) => {
						// Something went wrong. Call the callback passing the error message
						const message = `Series.removeAll: ${error.message}`;

						callback(message);

						return message;
					}
				));
			}

			/**
			 * @memberof Series
			 * @method fromJson
			 * @desc Returns a new Series object populated from a JSON representation
			 * @param {Object} series - a JSON representation of a series
			 * @returns {Series} the Series object
			 */
			static fromJson(series) {
				return new Series(series.id, series.seriesName, series.nowShowing, series.programId);
			}

			/**
			 * @memberof Series
			 * @enum NOW_SHOWING
			 * @desc Enumerated list of Now Showing values
			 */
			static get NOW_SHOWING() {
				return {
					0: "Not Showing",
					1: "Mondays",
					2: "Tuesdays",
					3: "Wednesdays",
					4: "Thursdays",
					5: "Fridays",
					6: "Saturdays",
					7: "Sundays",
					8: "Daily"
				};
			}
		}

		return Series;
	}
);