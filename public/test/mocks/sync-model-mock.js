SyncMock = {
	syncList: [],
	removed: true,
	removedCount: 0,
	list: function(callback) {
		"use strict";

		callback(SyncMock.syncList);
	},
	count: function(callback) {
		"use strict";

		callback(SyncMock.syncList.length);
	},
	removeAll: function(callback) {
		"use strict";

		if (SyncMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};

