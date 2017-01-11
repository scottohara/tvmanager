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
let db;

/**
 * @class Base
 * @classdesc Abstract base model
 * @abstract
 */
export default class Base {
	/**
	 * @memberof Base
	 * @this Base
	 * @instance
	 * @property {DatabaseController} db - the database controller
	 * @desc Returns the database to use for all data operations
	 * @returns {DatabaseController} the database controller
	 */
	get db() {
		// Delegate to the static property of the same name
		return this.constructor.db;
	}

	/**
	 * @memberof Base
	 * @static
	 * @property {DatabaseController} db - the database controller
	 * @desc Returns the database to use for all data operations
	 * @returns {DatabaseController} the database controller
	 */
	static get db() {
		// If we don't yet have a db reference, get it from the application controller singleton
		return db || (new ApplicationController()).db;
	}
}