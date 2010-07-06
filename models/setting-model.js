var Setting = Class.create({
	initialize: function(settingName, settingValue) {
		this.settingName = settingName;
		this.settingValue = settingValue;
	},

	save: function(callback) {
		db.transaction(function(tx) {
			tx.executeSql("DELETE FROM Setting WHERE Name = ?", [this.settingName]);
			tx.executeSql("INSERT INTO Setting (Name, Value) VALUES (?, ?)", [this.settingName, this.settingValue],
				function(tx, resultSet) {
					if (!resultSet.rowsAffected) {
						if (callback) {
							callback(false);
						} else {
							throw new Error("Setting.save: no rows affected");
							return false;
						}
					}

					if (callback) {
						callback(true);
					}
				}.bind(this),
				function(tx, error) {
					if (callback) {
						callback(false);
					} else {
						throw new Error("Setting.save: " + error.message);
						return false;
					}
				}.bind(this)
			);
		}.bind(this));
	},

	remove: function() {
		db.transaction(function(tx) {
			tx.executeSql("DELETE FROM Setting WHERE Name = ?", [this.settingName]);
			this.settingName = null;
			this.setingValue = null;
		}.bind(this));
	}
});

Setting.get = function(settingName, callback) {
	db.readTransaction(function(tx) {
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
				throw new Error("Setting.get: " + error.message);
				callback();
			}
		);
	});
};