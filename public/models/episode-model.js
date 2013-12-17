/**
 * @file (Models) Episode
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller",
		"framework/uuid",
		"framework/jquery"
	],

	/**
	 * @exports models/episode
	 */
	function(ApplicationController, uuid, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class Episode
		 * @classdesc Model for episodes
		 * @property {String} id - unique identifier of the episode
		 * @property {String} episodeName - name of the episode
		 * @property {String} status - the episode status
		 * @property {String} statusDate - the date of the episode status
		 * @property {Boolean} unverified - indicates whether the episode is verified or not
		 * @property {Boolean} unscheduled - indicates if the episode is unscheduled
		 * @property {Number} sequence - order in which the episode appears in the series
		 * @property {String} seriesId - unique identifier of the series that the episode belongs to
		 * @property {String} seriesName - name of the series that the episode belongs to
		 * @property {String} programId - unique identifier of the program that the episode belongs to
		 * @property {String} programName - name of the program that the episode belongs to
		 * @property {String} statusDateDisplay - the date to display under the episode name in any episode lists
		 * @property {String} statusWarning - a CSS class name to use to indicate that an expected episode has passed it's expected date
		 * @property {String} unverifiedDisplay - a partial CSS class name to control the status icon displayed next to an episode in any episode lists
		 * @this Episode
		 * @constructor Episode
		 * @param {String} id - unique identifier of the episode
		 * @param {String} episodeName - name of the episode
		 * @param {String} status - the episode status
		 * @param {String} statusDate - the date of the episode status
		 * @param {Boolean} unverified - indicates whether the episode is verified or not
		 * @param {Boolean} unscheduled - indicates if the episode is unscheduled
		 * @param {Number} sequence - order in which the episode appears in the series
		 * @param {String} seriesId - unique identifier of the series that the episode belongs to
		 * @param {String} seriesName - name of the series that the episode belongs to
		 * @param {String} programId - unique identifier of the program that the episode belongs to
		 * @param {String} programName - name of the program that the episode belongs to
		 */
		var Episode = function (id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId, seriesName, programId, programName) {
			this.id = id;
			this.episodeName = episodeName;
			this.statusDate = statusDate;
			this.unscheduled = unscheduled;
			this.sequence = sequence;
			this.setStatus(status);
			this.setUnverified(unverified);
			this.seriesId = seriesId;
			this.seriesName = seriesName;
			this.programId = programId;
			this.programName = programName;
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method save
		 * @desc Saves the episode to the database
		 * @param {Function} callback - a function to call after the database is updated
		 */
		Episode.prototype.save = function(callback) {
			// Start a new database transaction
			appController.db.transaction($.proxy(function(tx) {
				// If an id has not been set (ie. is a new episode to be added), generate a new UUID
				if (!this.id) {
					this.id = uuid.v4();
				}

				// Execute the SQL to insert/update the episode
				tx.executeSql("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [this.id, this.episodeName, this.seriesId, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence], $.proxy(function(tx, resultSet) {
					// Regardless of whether the episode existed previously or not, we expect one row to be affected; so it's an error if this isn't the case
					if (!resultSet.rowsAffected) {
						throw new Error("no rows affected");
					}

					// Execute the SQL to flag the episode as a pending local change
					tx.executeSql("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Episode', ?, 'modified')", [this.id],
						$.proxy(function() {
							// If a callback was provided, call it now with the episode's id
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
				return "Episode.save: " + error.message;
			});
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method remove
		 * @desc Deletes the episode from the database
		 */
		Episode.prototype.remove = function() {
			// Only proceed if there is an ID to delete
			if (this.id) {
				// Start a new database transaction
				appController.db.transaction($.proxy(function(tx) {
					// Execute the SQL to flag the episode as a pending local change
					tx.executeSql("REPLACE INTO Sync (Type, ID, Action) VALUES ('Episode', ?, 'deleted')", [this.id]);

					// Execute the SQL to delete the episode
					tx.executeSql("DELETE FROM Episode WHERE EpisodeID = ?", [this.id]);
				}, this),
				null,
				$.proxy(function() {
					// Clear the instance properties
					this.id = null;
					this.episodeName = null;
					this.seriesId = null;
				}, this));
			}
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method toJson
		 * @desc Returns a JSON representation of the episode
		 * @returns {Object} the JSON representation of the episode
		 */
		Episode.prototype.toJson = function() {
			return {
				id: this.id,
				episodeName: this.episodeName,
				seriesId: this.seriesId,
				status: this.status,
				statusDate: this.statusDate,
				unverified: this.unverified,
				unscheduled: this.unscheduled,
				sequence: this.sequence
			};
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method setStatus
		 * @desc Sets the status of the episode
		 * @param {String} status - the episode status
		 */
		Episode.prototype.setStatus = function(status) {
			this.status = status;
			
			// Refresh the status date display and status warning based on the current status
			this.setStatusDate(this.statusDate);
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method setStatusDate
		 * @desc Sets the status date of the episode
		 * @param {String} statusDate - the date of the episode status
		 */
		Episode.prototype.setStatusDate = function(statusDate) {
			this.statusDate = statusDate;

			// Refresh the status date display based on the current status and date
			if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && "" !== this.statusDate) {
				this.statusDateDisplay = "(" + this.statusDate + ")";
			} else {
				this.statusDateDisplay = "";
			}

			// Recalculate the status warning based on the current status and date
			// The warning is used to highlight any expected episodes that are on or past their expected date
			// Note: As the status date only captures day & month (no year), a date more than 3 months in the past is considered to be a future date
			this.statusWarning = "";
			if ("Expected" === this.status && "" !== this.statusDate) {
				// Get the current date and set as the start of the warning range
				var today = new Date();
				var currDay = "0" + today.getDate();
				var startMonth = "0" + (today.getMonth() + 1);

				// Calculate the end of the warning range as 3 months ago
				var endMonth = "0";
				if (today.getMonth() < 3) {
					// In Jan, Feb or Mar, need to cross the year boundary (eg. Jan - 3 months = Oct; Feb - 3 month = Nov; Mar - 3 months = Dec)
					endMonth = String(10 + today.getMonth());
				} else {
					// Otherwise it's just a simple subtraction
					endMonth += String(today.getMonth() - 2);
				}

				// Now that we know the start/end months; calculate the start/end dates to compare against in "MMDD" format
				var start = startMonth.substr(startMonth.length-2) + currDay.substr(currDay.length-2);
				var end = endMonth.substr(endMonth.length-2) + currDay.substr(currDay.length-2);

				// Get the status date in the same "MMDD" format
				var months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
				var parts = this.statusDate.split("-");
				var tempStatusDate = months[parts[1]] + parts[0];

				// In Jan, Feb or Mar, it's an OR operation (less than start OR greater than end)
				if (today.getMonth() < 3) {
					this.statusWarning = (tempStatusDate <= start || tempStatusDate >= end ? "warning" : "");
				} else {
					// Otherwise it's an AND operation (less that start AND greater than end)
					this.statusWarning = (tempStatusDate <= start && tempStatusDate >= end ? "warning" : "");
				}
			}
		};

		/**
		 * @memberof Episode
		 * @this Episode
		 * @instance
		 * @method setUnverified
		 * @desc Sets the unverified flag for the episode
		 * @param {Boolean} unverified - indicates whether the episode is verified or not
		 */
		Episode.prototype.setUnverified = function(unverified) {
			this.unverified = unverified;

			// Refresh the unverified display based on the current unverified flag
			if ("Watched" !== this.status && this.unverified) {
				this.unverifiedDisplay = "Unverified";
			} else {
				this.unverifiedDisplay = "";
			}
		};

		/**
		 * @memberof Episode
		 * @method listBySeries
		 * @desc Retrieves the list of episodes for a given series
		 * @param {String} seriesId - the unique identifier of the series to retrieve
		 * @param {Function} callback - a function to call passing the list of episodes retrieved
		 */
		Episode.listBySeries = function(seriesId, callback) {
			// Set the WHERE clause to filter by the specified series, and the ORDER BY clause to sort by episode sequence
			var filter = "WHERE e.SeriesID = ? ORDER BY e.Sequence, e.EpisodeID";

			// Set the params array to contain the specified series
			var params = [seriesId];

			// Get the list of episodes
			Episode.list(filter, params, callback);
		};

		/**
		 * @memberof Episode
		 * @method listByUnscheduled
		 * @desc Retrieves the list of episodes that are unscheduled
		 * @param {Function} callback - a function to call passing the list of episodes retrieved
		 */
		Episode.listByUnscheduled = function(callback) {
			// Set the WHERE clause to filter by unscheduled episodes, and the ORDER BY clause to sort by status date
			var filter = "WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)";
			var params = [];

			// Get the list of episodes
			Episode.list(filter, params, callback);
		};

		/**
		 * @memberof Episode
		 * @method list
		 * @desc Retrieves a list of episodes
		 * @param {String} filter - a parameterised SQL WHERE/ORDER BY clause
		 * @param {Array<String>} params - an array of parameter values for the filter
		 * @param {Function} callback - a function to call passing the list of episodes retrieved
		 */
		Episode.list = function(filter, params, callback) {
			var episodeList = [];

			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the list of episodes
				tx.executeSql("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID " + filter, params,
					function(tx, resultSet) {
						// Iterate of the rows returned
						for (var i = 0; i < resultSet.rows.length; i++) {
							var ep = resultSet.rows.item(i);

							// Instantiate a new Episode object and add it to the array
							episodeList.push(new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ("true" === ep.Unverified), ("true" === ep.Unscheduled), ep.Sequence, ep.SeriesID, ep.SeriesName, ep.ProgramID, ep.ProgramName));
						}

						// Invoke the callback function, passing the list of episodes
						callback(episodeList);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the episode list (which should be empty)
						callback(episodeList);
						return "Episode.list: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Episode
		 * @method find
		 * @desc Retrieves a specific episode by it's unique identifier
		 * @param {String} id - unique identifier of the episode
		 * @param {Function} callback - a function to call passing the episode retrieved
		 */
		Episode.find = function(id, callback) {
			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the episode
				tx.executeSql("SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode WHERE EpisodeID = ?", [id],
					function(tx, resultSet) {
						var ep = resultSet.rows.item(0);

						// Instantiate a new Episode object, and invoke the callback function passing the episode
						callback(new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ("true" === ep.Unverified), ("true" === ep.Unscheduled), ep.Sequence, ep.SeriesID));
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing a null
						callback(null);
						return "Episode.find: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Episode
		 * @method totalCount
		 * @desc Retrieves the total number of episodes in the database
		 * @param {Function} callback - a function to call passing the episode count
		 */
		Episode.totalCount = function(callback) {
			var filter = "";
			var params = [];

			// Get the count of episodes
			Episode.count(filter, params, callback);
		};

		/**
		 * @memberof Episode
		 * @method countByStatus
		 * @desc Retrieves the total number of episodes with a given status in the database
		 * @param {String} status - the episode status
		 * @param {Function} callback - a function to call passing the episode count
		 */
		Episode.countByStatus = function(status, callback) {
			// Set the WHERE clause to filter by the specified status
			var filter = "WHERE Status = ?";

			// Set the params array to contain the specified status
			var params = [status];

			// Get the count of episodes
			Episode.count(filter, params, callback);
		};

		/**
		 * @memberof Episode
		 * @method count
		 * @desc Retrieves a count of episodes
		 * @param {String} filter - a parameterised SQL WHERE/ORDER BY clause
		 * @param {Array<String>} params - an array of parameter values for the filter
		 * @param {Function} callback - a function to call passing the episode count
		 */
		Episode.count = function(filter, params, callback) {
			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the count of episodes
				tx.executeSql("SELECT COUNT(*) AS EpisodeCount FROM Episode " + filter, params,
					function(tx, resultSet) {
						// Invoke the callback function, passing the episode count
						callback(resultSet.rows.item(0).EpisodeCount);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing zero
						callback(0);
						return "Episode.count: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Episode
		 * @method removeAll
		 * @desc Removes all episodes from the database
		 * @param {Function} callback - a function to call after removing the episodes
		 */
		Episode.removeAll = function(callback) {
			// Start a new database transaction
			appController.db.transaction(function(tx) {
				// Execute the SQL to delete the episodes
				tx.executeSql("DELETE FROM Episode", [],
					function() {
						// Invoke the callback function
						callback();
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the error message
						var message = "Episode.removeAll: " + error.message;
						callback(message);
						return message;
					}
				);
			});
		};

		/**
		 * @memberof Episode
		 * @method fromJson
		 * @desc Returns a new Episode object populated from a JSON representation
		 * @param {Object} episode - a JSON representation of an episode
		 * @returns {Episode} the Episode object
		 */
		Episode.fromJson = function(episode) {
			return new Episode(episode.id, episode.episodeName, episode.status, episode.statusDate, episode.unverified, episode.unscheduled, episode.sequence, episode.seriesId);
		};

		return Episode;
	}
);
