module("setting-model", {
	setup: function() {
		"use strict";

		this.settingName = "test-setting";
		this.settingValue = "test-value";
		this.setting = new Setting(this.settingName, this.settingValue);
		appController.db = new DatabaseMock();
	}
});

test("constructor", 3, function() {
	"use strict";

	ok(this.setting, "Instantiate Setting object");
	equals(this.setting.settingName, this.settingName, "settingName property");
	equals(this.setting.settingValue, this.settingValue, "settingValue property");
});

test("save - delete fail", 2, function() {
	"use strict";

	appController.db.failAt("DELETE FROM Setting WHERE Name = " + this.settingName);
	this.setting.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert fail", 4, function() {
	"use strict";

	appController.db.failAt("INSERT INTO Setting (Name, Value) VALUES (" + this.settingName + ", " + this.settingValue + ")");

	this.setting.save(function(success) {
		ok(!success, "Invoke callback with false");
	});
	
	equals(appController.db.commands.length, 2, "Number of SQL commands OK");
	equals(appController.db.errorMessage, "Setting.save: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - no rows affected", 4, function() {
	"use strict";

	appController.db.noRowsAffectedAt("INSERT INTO Setting (Name, Value) VALUES (" + this.settingName + ", " + this.settingValue + ")");
	this.setting.save(function(success) {
		ok(!success, "Invoke callback with false");
	});
	equals(appController.db.commands.length, 2, "Number of SQL commands");
	equals(appController.db.errorMessage, "Setting.save: no rows affected", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - success", 4, function() {
	"use strict";

	this.setting.save(function(success) {
		ok(success, "Invoke callback with true");
	});
	equals(appController.db.commands.length, 2, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("remove - fail", 4, function() {
	"use strict";

	appController.db.failAt("DELETE FROM Setting WHERE Name = " + this.settingName);
	this.setting.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.setting.settingName, this.settingName, "settingName property");
	equals(this.setting.settingValue, this.settingValue, "settingValue property");
});

test("remove - success", 5, function() {
	"use strict";

	this.setting.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
	equals(this.setting.settingName, null, "settingName property");
	equals(this.setting.settingValue, null, "settingValue property");
});

test("get - fail", 4, function() {
	"use strict";

	appController.db.failAt("SELECT Value AS SettingValue FROM Setting WHERE Name = " + this.settingName);
	Setting.get(this.settingName, function() {
		ok(true, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Setting.get: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("get - no rows affected", 5, function() {
	"use strict";

	appController.db.noRowsAffectedAt("SELECT Value AS SettingValue FROM Setting WHERE Name = " + this.settingName);
	Setting.get(this.settingName, $.proxy(function(setting) {
		equals(setting.settingName, this.settingName, "settingName property");
		equals(setting.settingValue, undefined, "settingValue property");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("get - success", 5, function() {
	"use strict";

	appController.db.addResultRows([{
		SettingValue: this.settingValue
	}]);
	Setting.get(this.settingName, $.proxy(function(setting) {
		equals(setting.settingName, this.settingName, "settingName property");
		equals(setting.settingValue, this.settingValue, "settingValue property");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});
