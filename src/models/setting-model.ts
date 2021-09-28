/**
 * @file (Models) Setting
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/setting-model
 * @requires models/base-model
 */
import Base from "models/base-model";
import type { PersistedSetting } from "models";

/**
 * @class Setting
 * @classdesc Model for settings
 * @extends Base
 * @this Setting
 * @property {String} settingName - unique name of the setting
 * @property {String} settingValue - the value of the setting
 * @param {String} settingName - unique name of the setting
 * @param {String} settingValue - the value of the setting
 */
export default class Setting extends Base {
	public constructor(private settingName?: string,
						public settingValue?: string) {
		super();
	}

	/**
	 * @memberof Setting
	 * @static
	 * @method get
	 * @desc Retrieves a setting
	 */
	public static async get(settingName: string): Promise<Setting> {
		let name: string | undefined,
				value: string | undefined;

		try {
			const persistedSetting: PersistedSetting | undefined = await (await this.db).settingsStore.get(settingName);

			if (undefined !== persistedSetting) {
				({ name, value } = persistedSetting);
			}
		} catch (_e: unknown) {
			// No op
		}

		return new Setting(name, value);
	}

	/**
	 * @memberof Setting
	 * @this Setting
	 * @instance
	 * @method save
	 * @desc Saves the setting to the database
	 */
	public async save(): Promise<boolean> {
		try {
			await (await this.db).settingsStore.save(String(this.settingName), String(this.settingValue));

			return true;
		} catch (_e: unknown) {
			return false;
		}
	}

	/**
	 * @memberof Setting
	 * @this Setting
	 * @instance
	 * @method remove
	 * @desc Deletes a setting from the database
	 */
	public async remove(): Promise<void> {
		await (await this.db).settingsStore.remove(String(this.settingName));

		// Clear the instance properties
		this.settingName = undefined;
		this.settingValue = undefined;
	}
}