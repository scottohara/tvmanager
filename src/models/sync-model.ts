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
import {
	ModelType,
	PersistedSync,
	SyncAction
} from "models";
import Base from "models/base-model";

/**
 * @class Sync
 * @classdesc Model for pending local changes
 * @extends Base
 * @this Sync
 * @property {ModelType} type - the type of object that was changed locally
 * @property {String} id - unique identifier of the object that was changed locally
 * @property {String} action - the type of local change ("modified" or "deleted")
 * @param {ModelType} type - the type of object that was changed locally
 * @param {String} id - unique identifier of the object that was changed locally
 * @param {String} action - the type of local change ("modified" or "deleted")
 */
export default class Sync extends Base {
	public constructor(public type: ModelType | null,
						public id: string | null,
						public readonly action?: SyncAction) {
		super();
	}

	/**
	 * @memberof Sync
	 * @static
	 * @method list
	 * @desc Retrieves a list of local changes
	 */
	public static async list(): Promise<Sync[]> {
		let syncList: Sync[] = [];

		try {
			syncList = await Promise.all((await (await this.db).syncsStore.list()).map((sync: PersistedSync): Sync => new Sync(sync.Type, sync.ID, sync.Action)));
		} catch (_e) {
			// No op
		}

		return syncList;
	}

	/**
	 * @memberof Sync
	 * @static
	 * @method count
	 * @desc Retrieves a count of local changes
	 */
	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).syncsStore.count();
		} catch (_e) {
			// No op
		}

		return count;
	}

	/**
	 * @memberof Sync
	 * @static
	 * @method removeAll
	 * @desc Removes all local changes from the database
	 */
	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).syncsStore.removeAll();
		} catch (error) {
			errorMessage = `Sync.removeAll: ${error.message as string}`;
		}

		return errorMessage;
	}

	/**
	 * @memberof Sync
	 * @this Sync
	 * @instance
	 * @method remove
	 * @desc Deletes a local change from the database
	 */
	public async remove(): Promise<void> {
		await (await this.db).syncsStore.remove(this.type as ModelType, String(this.id));

		// Clear the instance properties
		this.type = null;
		this.id = null;
	}
}