define(
	[
		'models/sync-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(Sync, ApplicationController, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("sync-model", {
			setup: function() {
				this.type = "test-sync";
				this.id = "1";
				this.action = "modified";
				this.sync = new Sync(this.type, this.id, this.action);
			},
			teardown: function() {
				appController.db.reset();
			}
		});

		QUnit.test("constructor", 4, function() {
			QUnit.ok(this.sync, "Instantiate Sync object");
			QUnit.equal(this.sync.type, this.type, "type property");
			QUnit.equal(this.sync.id, this.id, "id property");
			QUnit.equal(this.sync.action, this.action, "action property");
		});


		QUnit.test("remove - fail", 2, function() {
			appController.db.failAt("DELETE FROM Sync WHERE Type = " + this.type + " AND ID = " + this.id);
			this.sync.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("remove - success", 5, function() {
			this.sync.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
			QUnit.equal(this.sync.type, null, "type property");
			QUnit.equal(this.sync.id, null, "id property");
		});

		QUnit.test("list - fail", 4, function() {
			appController.db.failAt("SELECT Type, ID, Action FROM Sync");
			Sync.list(function(syncList) {
				QUnit.deepEqual(syncList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Sync.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("list - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT Type, ID, Action FROM Sync");
			Sync.list(function(syncList) {
				QUnit.deepEqual(syncList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("list - success", 4, function() {
			appController.db.addResultRows([{
				Type: this.type,
				ID: this.id,
				Action: this.action
			}]);
			Sync.list($.proxy(function(syncList) {
				QUnit.deepEqual(syncList, [this.sync], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("count - fail", 4, function() {
			appController.db.failAt("SELECT COUNT(*) AS SyncCount FROM Sync");
			Sync.count(function(count) {
				QUnit.equal(count, 0, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Sync.count: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("count - success", 4, function() {
			appController.db.addResultRows([{
				SyncCount: 1
			}]);
			Sync.count(function(count) {
				QUnit.equal(count, 1, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("removeAll - fail", 4, function() {
			appController.db.failAt("DELETE FROM Sync");
			Sync.removeAll(function(message) {
				QUnit.notEqual(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Sync.removeAll: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("removeAll - success", 4, function() {
			Sync.removeAll(function(message) {
				QUnit.equal(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});
	}
);
