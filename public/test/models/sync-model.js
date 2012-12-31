module("sync-model", {
	setup: function() {
		"use strict";

		this.type = "test-sync";
		this.id = "1";
		this.action = "modified";
		this.sync = new Sync(this.type, this.id, this.action);
		appController.db = new DatabaseMock();
	}
});

test("constructor", 4, function() {
	"use strict";

	ok(this.sync, "Instantiate Sync object");
	equals(this.sync.type, this.type, "type property");
	equals(this.sync.id, this.id, "id property");
	equals(this.sync.action, this.action, "action property");
});


test("remove - fail", 2, function() {
	"use strict";

	appController.db.failAt("DELETE FROM Sync WHERE Type = " + this.type + " AND ID = " + this.id);
	this.sync.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
});

test("remove - success", 5, function() {
	"use strict";

	this.sync.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
	equals(this.sync.type, null, "type property");
	equals(this.sync.id, null, "id property");
});

test("list - fail", 4, function() {
	"use strict";

	appController.db.failAt("SELECT Type, ID, Action FROM Sync");
	Sync.list(function(syncList) {
		same(syncList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Sync.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("list - no rows affected", 4, function() {
	"use strict";

	appController.db.noRowsAffectedAt("SELECT Type, ID, Action FROM Sync");
	Sync.list(function(syncList) {
		same(syncList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("list - success", 4, function() {
	"use strict";

	appController.db.addResultRows([{
		Type: this.type,
		ID: this.id,
		Action: this.action
	}]);
	Sync.list($.proxy(function(syncList) {
		same(syncList, [this.sync], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("count - fail", 4, function() {
	"use strict";

	appController.db.failAt("SELECT COUNT(*) AS SyncCount FROM Sync");
	Sync.count(function(count) {
		equals(count, 0, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Sync.count: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("count - success", 4, function() {
	"use strict";

	appController.db.addResultRows([{
		SyncCount: 1
	}]);
	Sync.count(function(count) {
		equals(count, 1, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("removeAll - fail", 4, function() {
	"use strict";

	appController.db.failAt("DELETE FROM Sync");
	Sync.removeAll(function(message) {
		notEqual(message, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Sync.removeAll: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("removeAll - success", 4, function() {
	"use strict";

	Sync.removeAll(function(message) {
		equals(message, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});
