define(
	[
		'controllers/database-controller',
		'test/mocks/database-mock',
		'framework/jquery'
	],

	function(DatabaseController, DatabaseMock, $) {
		"use strict";
	
		QUnit.module("database-controller", {
			setup: function() {
				this.databaseName = "test-db";
				this.expectedVersion = "1.9";
				this.numUpgradeCommands = 46;
				this.initialVersion = this.expectedVersion;
				
				this.successCallback = $.proxy(function(versions) {
					this.db.version = this.expectedVersion;
					QUnit.deepEqual(versions, {
						initial: this.initialVersion,
						current: this.expectedVersion
					}, "Invoke success callback");
				}, this);

				this.error = {
					code: 0
				};

				this.errorCallback = $.proxy(function(error) {
					QUnit.deepEqual(error, this.error, "Invoke error callback");
				}, this);

				this.db = new DatabaseMock();
				this.db.version = this.expectedVersion;

				this.originalOpenDatabase = window.openDatabase;
				window.openDatabase = $.proxy(function(name, version, displayName, estimatedSize) {
					if (this.db) {
						this.db.version = this.initialVersion;
					}

					return this.db;
				}, this);
			},
			teardown: function() {
				window.openDatabase = this.originalOpenDatabase;
			}
		});

		QUnit.test("constructor - error", 5, function() {
			this.db = null;
			this.error.message = "Unable to open database " + this.databaseName;
			var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
			QUnit.ok(databaseController, "Instantiate DatabaseController object");
			QUnit.equal(databaseController.name, this.databaseName, "name property");
			QUnit.deepEqual(databaseController.successCallback, this.successCallback, "callback property");
			QUnit.deepEqual(databaseController.errorCallback, this.errorCallback, "errorCallback property");
		});

		QUnit.test("constructor - without upgrade", 2, function() {
			var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
			QUnit.equal(databaseController.version, this.expectedVersion, "Database version");
		});

		QUnit.test("constructor - with upgrade fail", 5, function() {
			this.initialVersion = "";
			this.db.failAt("CREATE TABLE IF NOT EXISTS Program (Name)");
			this.error.message = "Force failed";
			var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
			QUnit.equal(databaseController.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!databaseController.commit, "Rollback transaction");
			QUnit.equal(databaseController.version, this.initialVersion, "Database version");
		});
		
		QUnit.test("constructor - with partial upgrade", 6, function() {
			this.initialVersion = "";
			this.expectedVersion = "1.0";
			var originalSetExpectedVersion = DatabaseController.prototype.setExpectedVersion;
			DatabaseController.prototype.setExpectedVersion = function() {
				this.expectedVersion = "1.0";
			};
			this.db.version = this.expectedVersion;
			var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
			QUnit.equal(databaseController.commands.length, 3, "Number of SQL commands");
			QUnit.ok(databaseController.commit, "Commit transaction");
			QUnit.equal(databaseController.version, this.expectedVersion, "Database version");
			DatabaseController.prototype.setExpectedVersion = originalSetExpectedVersion;
		});
		
		QUnit.test("constructor - with full upgrade", 6, function() {
			this.initialVersion = "";
			this.db.addResultRows([
				{
					rowid: 1,
					SeriesID: 1
				},
				{
					rowid: 2,
					SeriesID: 1
				}
			]);
			var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
			QUnit.equal(databaseController.commands.length, this.numUpgradeCommands, "Number of SQL commands");
			QUnit.ok(databaseController.commit, "Commit transaction");
			QUnit.equal(databaseController.version, this.expectedVersion, "Database version");
		});
	}
);
