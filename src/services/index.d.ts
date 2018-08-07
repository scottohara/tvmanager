/**
 * @class DatabaseUpgrade
 * @classdesc Anonymous object containing the properties of a database upgrade routine
 * @private
 * @property {String} version - the version to upgrade from
 * @property {Function} upgradeHandler - the function containing the database migration logic
 */
export interface DatabaseUpgrade {
	version: DOMString;
	upgradeHandler: (tx: SQLTransaction) => void;
}

export interface DatabaseVersion {
	initial: DOMString;
	current: DOMString;
}

export type DatabaseSuccessCallback = (version: DatabaseVersion) => void;
export type DatabaseErrorCallback = (error: SQLError) => void;

