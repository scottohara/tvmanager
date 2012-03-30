var Sync = function (type, id, action) {
		this.type = type;
		this.id = id;
		this.action = action;
};

Sync.prototype.remove = function() {
	appController.db.transaction($.proxy(function(tx) {
		tx.executeSql("DELETE FROM Sync WHERE Type = ? AND ID = ?", [this.type, this.id]);
	}, this),
	null,
	$.proxy(function () {
		this.type = null;
		this.id = null;
	}, this));
};

Sync.list = function(callback) {
	var syncList = [];

	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT Type, ID, Action FROM Sync", [],
			function(tx, resultSet) {
				for (var i = 0; i < resultSet.rows.length; i++) {
					var sync = resultSet.rows.item(i);
					syncList.push(new Sync(sync.Type, sync.ID, sync.Action));
				}
				callback(syncList);
			},
			function(tx, error) {
				callback(syncList);
				return "Sync.list: " + error.message;
			}
		);
	});
};

Sync.count = function(callback) {
	appController.db.readTransaction(function(tx) {
		tx.executeSql("SELECT COUNT(*) AS SyncCount FROM Sync", [],
			function(tx, resultSet) {
				callback(resultSet.rows.item(0).SyncCount);
			},
			function(tx, error) {
				callback(0);
				return "Sync.count: " + error.message;
			}
		);
	});
};

Sync.removeAll = function(callback) {
	appController.db.transaction(function(tx) {
		tx.executeSql("DELETE FROM Sync", [],
			function(tx, resultSet) {
				callback();
			},
			function(tx, error) {
				var message = "Sync.removeAll: " + error.message;
				callback(message);
				return message;
			}
		);
	});
};

