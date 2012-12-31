module("database-controller", {
	setup: function() {
		"use strict";

		this.databaseName = "test-db";
		this.expectedVersion = "1.9";
		this.numUpgradeCommands = 40;
		this.initialVersion = this.expectedVersion;
		
		this.successCallback = $.proxy(function(versions) {
			this.db.version = this.expectedVersion;
			same(versions, {
				initial: this.initialVersion,
				current: this.expectedVersion
			}, "Invoke success callback");
		}, this);

		this.error = {
			code: 0
		};

		this.errorCallback = $.proxy(function(error) {
			same(error, this.error, "Invoke error callback");
		}, this);

		this.db = new DatabaseMock();
		this.db.version = this.expectedVersion;

		this.originalOpenDatabase = openDatabase;
		openDatabase = $.proxy(function(name, version, displayName, estimatedSize) {
			if (this.db) {
				this.db.version = this.initialVersion;
			}

			return this.db;
		}, this);
	},
	teardown: function() {
		"use strict";

		openDatabase = this.originalOpenDatabase;
	}
});

test("constructor - error", 5, function() {
	"use strict";

	this.db = null;
	this.error.message = "Unable to open database " + this.databaseName;
	var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
	ok(databaseController, "Instantiate DatabaseController object");
	equals(databaseController.name, this.databaseName, "name property");
	same(databaseController.successCallback, this.successCallback, "callback property");
	same(databaseController.errorCallback, this.errorCallback, "errorCallback property");
});

test("constructor - without upgrade", 2, function() {
	"use strict";

	var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
	equals(databaseController.version, this.expectedVersion, "Database version");
});

test("constructor - with upgrade fail", 5, function() {
	"use strict";

	this.initialVersion = "";
	this.db.failAt("CREATE TABLE IF NOT EXISTS Program (Name)");
	this.error.message = "Force failed";
	var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
	equals(databaseController.commands.length, 1, "Number of SQL commands");
	ok(!databaseController.commit, "Rollback transaction");
	equals(databaseController.version, this.initialVersion, "Database version");
});
/*
test("constructor - with partial upgrade", 6, function() {
	"use strict";

	this.initialVersion = "";
	this.expectedVersion = "1.0";
	this.db.version = this.expectedVersion;
	var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
	equals(databaseController.commands.length, 3, "Number of SQL commands");
	ok(databaseController.commit, "Commit transaction");
	equals(databaseController.version, this.expectedVersion, "Database version");
});
*/
test("constructor - with full upgrade", 6, function() {
	"use strict";

	this.initialVersion = "";
	this.db.addResultRows([{
		rowid: 1,
		SeriesID: 1
	}]);
	var databaseController = new DatabaseController(this.databaseName, this.successCallback, this.errorCallback);
	equals(databaseController.commands.length, this.numUpgradeCommands, "Number of SQL commands");
	ok(databaseController.commit, "Commit transaction");
	equals(databaseController.version, this.expectedVersion, "Database version");
});
