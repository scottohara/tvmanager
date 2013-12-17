/**
 * @file (Models) Sync
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports models/sync
	 */
	function(ApplicationController, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		/**
		 * @class Sync
		 * @classdesc Model for pending local changes
		 * @property {String} type - the type of object that was changed locally
		 * @property {String} id - unique identifier of the object that was changed locally
		 * @property {String} action - the type of local change ("modified" or "deleted")
		 * @this Sync
		 * @constructor Sync
		 * @param {String} type - the type of object that was changed locally
		 * @param {String} id - unique identifier of the object that was changed locally
		 * @param {String} action - the type of local change ("modified" or "deleted")
		 */
		var Sync = function (type, id, action) {
			this.type = type;
			this.id = id;
			this.action = action;
		};

		/**
		 * @memberof Sync
		 * @this Sync
		 * @instance
		 * @method remove
		 * @desc Deletes a local change from the database
		 */
		Sync.prototype.remove = function() {
			// Start a new database transaction
			appController.db.transaction($.proxy(function(tx) {
				// Execute the SQL to delete the local change
				tx.executeSql("DELETE FROM Sync WHERE Type = ? AND ID = ?", [this.type, this.id]);
			}, this),
			null,
			$.proxy(function () {
				// Clear the instance properties
				this.type = null;
				this.id = null;
			}, this));
		};

		/**
		 * @memberof Sync
		 * @method list
		 * @desc Retrieves a list of local changes
		 * @param {Function} callback - a function to call passing the list of local changes retrieved
		 */
		Sync.list = function(callback) {
			var syncList = [];

			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the list of local changes
				tx.executeSql("SELECT Type, ID, Action FROM Sync", [],
					function(tx, resultSet) {
						// Iterate of the rows returned
						for (var i = 0; i < resultSet.rows.length; i++) {
							var sync = resultSet.rows.item(i);

							// Instantiate a new Sync object and add it to the array
							syncList.push(new Sync(sync.Type, sync.ID, sync.Action));
						}

						// Invoke the callback function, passing the list of local changes
						callback(syncList);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the local changes list (which should be empty)
						callback(syncList);
						return "Sync.list: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Sync
		 * @method count
		 * @desc Retrieves a count of local changes
		 * @param {Function} callback - a function to call passing the local changes count
		 */
		Sync.count = function(callback) {
			// Start a new readonly database transaction
			appController.db.readTransaction(function(tx) {
				// Execute the SQL to retrieve the count of local changes
				tx.executeSql("SELECT COUNT(*) AS SyncCount FROM Sync", [],
					function(tx, resultSet) {
						// Invoke the callback function, passing the local changes count
						callback(resultSet.rows.item(0).SyncCount);
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing zero
						callback(0);
						return "Sync.count: " + error.message;
					}
				);
			});
		};

		/**
		 * @memberof Sync
		 * @method removeAll
		 * @desc Removes all local changes from the database
		 * @param {Function} callback - a function to call after removing the local changes
		 */
		Sync.removeAll = function(callback) {
			// Start a new database transaction
			appController.db.transaction(function(tx) {
				// Execute the SQL to delete the local changes
				tx.executeSql("DELETE FROM Sync", [],
					function() {
						// Invoke the callback function
						callback();
					},
					function(tx, error) {
						// Something went wrong. Call the callback passing the error message
						var message = "Sync.removeAll: " + error.message;
						callback(message);
						return message;
					}
				);
			});
		};

		return Sync;
	}
);
