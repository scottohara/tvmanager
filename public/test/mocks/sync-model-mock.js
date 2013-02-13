define(
	function() {
		"use strict";

		var SyncMock = function() {
		};

		SyncMock.prototype.remove = function() {
		};

		SyncMock.syncList = [];
		SyncMock.removed = true;
		SyncMock.removedCount = 0;

		SyncMock.list = function(callback) {
			callback(SyncMock.syncList);
		};

		SyncMock.count = function(callback) {
			callback(SyncMock.syncList.length);
		};

		SyncMock.removeAll = function(callback) {
			if (SyncMock.removed) {
				callback();
			} else {
				callback("Force failed");
			}
		};

		return SyncMock;
	}
);
