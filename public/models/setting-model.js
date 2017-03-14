/**
 * @file (Models) Setting
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller"
	],

	/**
	 * @exports models/setting
	 */
	ApplicationController => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class Setting
		 * @classdesc Model for settings
		 * @property {String} settingName - unique name of the setting
		 * @property {String} settingValue - the value of the setting
		 */
		class Setting {
			/**
			 * @constructor Setting
			 * @this Setting
			 * @param {String} settingName - unique name of the setting
			 * @param {String} settingValue - the value of the setting
			 */
			constructor(settingName, settingValue) {
				this.settingName = settingName;
				this.settingValue = settingValue;
			}

			/**
			 * @memberof Setting
			 * @this Setting
			 * @instance
			 * @method save
			 * @desc Saves the setting to the database
			 * @param {Function} callback - a function to call after the database is updated
			 */
			save(callback) {
				// Start a new database transaction
				appController.db.transaction(tx => {
					// Execute the SQL to delete the existing setting (if exists)
					tx.executeSql("DELETE FROM Setting WHERE Name = ?", [this.settingName]);

					// Execute the SQL to insert the new setting
					tx.executeSql(`
							INSERT INTO Setting (Name, Value)
							VALUES (?, ?)
						`,
						[this.settingName, this.settingValue],
						(_, resultSet) => {
							// We expect one row to be affected; so it's an error if this isn't the case
							if (!resultSet.rowsAffected) {
								// If a callback was provided, call it now with false to indicate an error
								if (callback) {
									callback(false);
								}
								throw new Error("Setting.save: no rows affected");
							}

							// If a callback was provided, call it now with true to indicate success
							if (callback) {
								callback(true);
							}
						}, (_, error) => {
							// Something went wrong. If a callback was provided, call it now with false to indicate an error
							if (callback) {
								callback(false);
							}

							return `Setting.save: ${error.message}`;
						}
					);
				});
			}

			/**
			 * @memberof Setting
			 * @this Setting
			 * @instance
			 * @method remove
			 * @desc Deletes a setting from the database
			 */
			remove() {
				// Start a new database transaction and execute the SQL to delete the setting
				appController.db.transaction(tx => tx.executeSql(`
						DELETE FROM Setting
						WHERE	Name = ?
					`,
					[this.settingName]),
					null,
					() => {
						// Clear the instance properties
						this.settingName = null;
						this.settingValue = null;
					});
			}

			/**
			 * @memberof Setting
			 * @method get
			 * @desc Retrieves a setting
			 * @param {Function} callback - a function to call passing the setting retrieved
			 */
			static get(settingName, callback) {
				// Start a new readonly database transaction and execute the SQL to retrieve the setting
				appController.db.readTransaction(tx => tx.executeSql(`
						SELECT	Value AS SettingValue
						FROM		Setting
						WHERE		Name = ?
					`,
					[settingName],
					(_, resultSet) => {
						let settingValue;

						// If the setting existed, get the existing value (otherwise the value defaults to null)
						if (resultSet.rows.length > 0) {
							settingValue = resultSet.rows.item(0).SettingValue;
						}

						// Instantiate a new Setting object
						const setting = new Setting(settingName, settingValue);

						// Invoke the callback function passing the setting
						callback(setting);
					}, (_, error) => {
						// Something went wrong. Call the callback with no arguments
						callback();

						return `Setting.get: ${error.message}`;
					}
				));
			}
		}

		return Setting;
	}
);
