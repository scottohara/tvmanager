/**
 * @file (Models) Base
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/base-model
 * @requires controllers/application-controller
 */
import ApplicationController from "controllers/application-controller";

// Database to use for all data operations
let db: Database;

/**
 * @class Base
 * @classdesc Abstract base model
 * @abstract
 */
export default abstract class Base {
	/**
	 * @memberof Base
	 * @this Base
	 * @instance
	 * @property {Database} db - the database
	 * @desc Returns the database to use for all data operations
	 * @returns {Database} the database
	 */
	protected get db(): Database {
		// Delegate to the static property of the same name
		return Base.db;
	}

	/**
	 * @memberof Base
	 * @static
	 * @property {Database} db - the database
	 * @desc Returns the database to use for all data operations
	 * @returns {Database} the database
	 */
	protected static get db(): Database {
		// If we don't yet have a db reference, get it from the application controller singleton
		return db || (new ApplicationController()).db;
	}
}