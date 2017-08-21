/**
 * @file (Models) Sync
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller"
	],

	/**
	 * @exports models/sync
	 */
	ApplicationController => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class Sync
		 * @classdesc Model for pending local changes
		 * @property {String} type - the type of object that was changed locally
		 * @property {String} id - unique identifier of the object that was changed locally
		 * @property {String} action - the type of local change ("modified" or "deleted")
		 */
		class Sync {
			/**
			 * @constructor Sync
			 * @this Sync
			 * @param {String} type - the type of object that was changed locally
			 * @param {String} id - unique identifier of the object that was changed locally
			 * @param {String} action - the type of local change ("modified" or "deleted")
			 */
			constructor(type, id, action) {
				this.type = type;
				this.id = id;
				this.action = action;
			}

			/**
			 * @memberof Sync
			 * @this Sync
			 * @instance
			 * @method remove
			 * @desc Deletes a local change from the database
			 */
			remove() {
				// Start a new database transaction and execute the SQL to delete the local change
				appController.db.transaction(tx => tx.executeSql(`
						DELETE FROM Sync
						WHERE	Type = ? AND
									ID = ?
					`,
					[this.type, this.id]
				),
				null,
				() => {
					// Clear the instance properties
					this.type = null;
					this.id = null;
				});
			}

			/**
			 * @memberof Sync
			 * @method list
			 * @desc Retrieves a list of local changes
			 * @param {Function} callback - a function to call passing the list of local changes retrieved
			 */
			static list(callback) {
				const syncList = [];

				// Start a new readonly database transaction and execute the SQL to retrieve the list of local changes
				appController.db.readTransaction(tx => tx.executeSql(`
						SELECT	Type,
										ID,
										Action
						FROM		Sync
					`,
					[],
					(_, resultSet) => {
						// Iterate of the rows returned
						for (let i = 0; i < resultSet.rows.length; i++) {
							const sync = resultSet.rows.item(i);

							// Instantiate a new Sync object and add it to the array
							syncList.push(new Sync(sync.Type, sync.ID, sync.Action));
						}

						// Invoke the callback function, passing the list of local changes
						callback(syncList);
					}, (_, error) => {
						// Something went wrong. Call the callback passing the local changes list (which should be empty)
						callback(syncList);

						return `Sync.list: ${error.message}`;
					}
				));
			}

			/**
			 * @memberof Sync
			 * @method count
			 * @desc Retrieves a count of local changes
			 * @param {Function} callback - a function to call passing the local changes count
			 */
			static count(callback) {
				// Start a new readonly database transaction and execute the SQL to retrieve the count of local changes
				appController.db.readTransaction(tx => tx.executeSql("SELECT COUNT(*) AS SyncCount FROM Sync", [],
					(_, resultSet) => callback(resultSet.rows.item(0).SyncCount),
					(_, error) => {
						// Something went wrong. Call the callback passing zero
						callback(0);

						return `Sync.count: ${error.message}`;
					}
				));
			}

			/**
			 * @memberof Sync
			 * @method removeAll
			 * @desc Removes all local changes from the database
			 * @param {Function} callback - a function to call after removing the local changes
			 */
			static removeAll(callback) {
				// Start a new database transaction and execute the SQL to delete the local change
				appController.db.transaction(tx => tx.executeSql("DELETE FROM Sync", [],
					() => callback(),
					(_, error) => {
						// Something went wrong. Call the callback passing the error message
						const message = `Sync.removeAll: ${error.message}`;

						callback(message);

						return message;
					}
				));
			}
		}

		return Sync;
	}
);
