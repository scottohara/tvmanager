SyncMock = {
	syncList: [],
	removed: true,
	list: function(callback) {
		callback(SyncMock.syncList);
	},
	count: function(callback) {
		callback(SyncMock.syncList.length);
	},
	removeAll: function(callback) {
		if (SyncMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};

