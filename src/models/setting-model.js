var Setting = function (settingName, settingValue) {
		this.settingName = settingName;
		this.settingValue = settingValue;
};

Setting.prototype.save = function(callback) {
	appController.db.transaction($.proxy(function(tx) {
		tx.executeSql("DELETE FROM Setting WHERE Name = ?", [this.settingName]);
		tx.executeSql("INSERT INTO Setting (Name, Value) VALUES (?, ?)", [this.settingName, this.settingValue],
			function(tx, resultSet) {
				if (!resultSet.rowsAffected) {
					if (callback) {
						callback(false);
					}
					throw new Error("Setting.save: no rows affected");
				}

				if (callback) {
					callback(true);
				}
			},
			function(tx, error) {
				if (callback) {
					callback(false);
				}
				return "Setting.save: " + error.message;
			}
		);
	}, this));
};

Setting.prototype.remove = function() {
	appController.db.transaction($.proxy(function(tx) {
		tx.executeSql("DELETE FROM Setting WHERE Name = ?", [this.settingName]);
	}, this),
	null,
	$.proxy(function () {
		this.settingName = null;
		this.settingValue = null;
	}, this));
};

Setting.get = function(settingName, callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT Value AS SettingValue FROM Setting WHERE Name = ?", [settingName],
			function(tx, resultSet) {
				var settingValue;
				if (resultSet.rows.length > 0) {
					settingValue = resultSet.rows.item(0).SettingValue;
				}

				var setting = new Setting(settingName, settingValue);
				callback(setting);
			},
			function(tx, error) {
				callback();
				return "Setting.get: " + error.message;
			}
		);
	});
};