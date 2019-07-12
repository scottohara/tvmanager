/**
 * @file (Models) Base
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/base-model
 */
import DatabaseService from "services/database-service";
import { TVManagerStore } from "stores";

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
	protected get db(): Promise<TVManagerStore> {
		// Delegate to the static property of the same name
		return Base.db;
	}

	/**
	 * @memberof Base
	 * @static
	 * @property {TVManagerStore} db - the database
	 * @desc Returns the database to use for all data operations
	 * @returns {TVManagerStore} the database
	 */
	protected static get db(): Promise<TVManagerStore> {
		// If we don't yet have a db reference, get it from the application controller singleton
		return DatabaseService;
	}
}