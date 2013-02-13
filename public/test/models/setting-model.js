define(
	[
		'models/setting-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(Setting, ApplicationController, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("setting-model", {
			setup: function() {
				this.settingName = "test-setting";
				this.settingValue = "test-value";
				this.setting = new Setting(this.settingName, this.settingValue);
			},
			teardown: function() {
				appController.db.reset();
			}
		});

		QUnit.test("constructor", 3, function() {
			QUnit.ok(this.setting, "Instantiate Setting object");
			QUnit.equal(this.setting.settingName, this.settingName, "settingName property");
			QUnit.equal(this.setting.settingValue, this.settingValue, "settingValue property");
		});

		QUnit.test("save - delete fail", 2, function() {
			appController.db.failAt("DELETE FROM Setting WHERE Name = " + this.settingName);
			this.setting.save();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert fail", 4, function() {
			appController.db.failAt("INSERT INTO Setting (Name, Value) VALUES (" + this.settingName + ", " + this.settingValue + ")");

			this.setting.save(function(success) {
				QUnit.ok(!success, "Invoke callback with false");
			});
			
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands OK");
			QUnit.equal(appController.db.errorMessage, "Setting.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("INSERT INTO Setting (Name, Value) VALUES (" + this.settingName + ", " + this.settingValue + ")");
			this.setting.save(function(success) {
				QUnit.ok(!success, "Invoke callback with false");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Setting.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - success", 4, function() {
			this.setting.save(function(success) {
				QUnit.ok(success, "Invoke callback with true");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("remove - fail", 4, function() {
			appController.db.failAt("DELETE FROM Setting WHERE Name = " + this.settingName);
			this.setting.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.setting.settingName, this.settingName, "settingName property");
			QUnit.equal(this.setting.settingValue, this.settingValue, "settingValue property");
		});

		QUnit.test("remove - success", 5, function() {
			this.setting.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
			QUnit.equal(this.setting.settingName, null, "settingName property");
			QUnit.equal(this.setting.settingValue, null, "settingValue property");
		});

		QUnit.test("get - fail", 4, function() {
			appController.db.failAt("SELECT Value AS SettingValue FROM Setting WHERE Name = " + this.settingName);
			Setting.get(this.settingName, function() {
				QUnit.ok(true, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Setting.get: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("get - no rows affected", 5, function() {
			appController.db.noRowsAffectedAt("SELECT Value AS SettingValue FROM Setting WHERE Name = " + this.settingName);
			Setting.get(this.settingName, $.proxy(function(setting) {
				QUnit.equal(setting.settingName, this.settingName, "settingName property");
				QUnit.equal(setting.settingValue, undefined, "settingValue property");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("get - success", 5, function() {
			appController.db.addResultRows([{
				SettingValue: this.settingValue
			}]);
			Setting.get(this.settingName, $.proxy(function(setting) {
				QUnit.equal(setting.settingName, this.settingName, "settingName property");
				QUnit.equal(setting.settingValue, this.settingValue, "settingValue property");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});
	}
);
