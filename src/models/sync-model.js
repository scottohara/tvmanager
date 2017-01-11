/**
 * @file (Models) Sync
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/sync-model
 * @requires models/base-model
 */
import Base from "models/base-model";

/**
 * @class Sync
 * @classdesc Model for pending local changes
 * @extends Base
 * @this Sync
 * @property {String} type - the type of object that was changed locally
 * @property {String} id - unique identifier of the object that was changed locally
 * @property {String} action - the type of local change ("modified" or "deleted")
 * @param {String} type - the type of object that was changed locally
 * @param {String} id - unique identifier of the object that was changed locally
 * @param {String} action - the type of local change ("modified" or "deleted")
 */
export default class Sync extends Base {
	constructor(type, id, action) {
		super();
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
		this.db.transaction(tx => tx.executeSql(`
				DELETE FROM Sync
				WHERE	Type = ? AND
							ID = ?
			`,
			[this.type, this.id]
		), null, () => {
			// Clear the instance properties
			this.type = null;
			this.id = null;
		});
	}

	/**
	 * @memberof Sync
	 * @static
	 * @method list
	 * @desc Retrieves a list of local changes
	 * @param {Function} callback - a function to call passing the list of local changes retrieved
	 */
	static list(callback) {
		const syncList = [];

		// Start a new readonly database transaction and execute the SQL to retrieve the list of local changes
		this.db.readTransaction(tx => tx.executeSql(`
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
	 * @static
	 * @method count
	 * @desc Retrieves a count of local changes
	 * @param {Function} callback - a function to call passing the local changes count
	 */
	static count(callback) {
		// Start a new readonly database transaction and execute the SQL to retrieve the count of local changes
		this.db.readTransaction(tx => tx.executeSql("SELECT COUNT(*) AS SyncCount FROM Sync", [],
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
	 * @static
	 * @method removeAll
	 * @desc Removes all local changes from the database
	 * @param {Function} callback - a function to call after removing the local changes
	 */
	static removeAll(callback) {
		// Start a new database transaction and execute the SQL to delete the local change
		this.db.transaction(tx => tx.executeSql("DELETE FROM Sync", [],
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