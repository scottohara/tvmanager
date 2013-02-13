define(
	function() {
		"use strict";

		var SeriesMock = function(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount) {
			this.id = id;
			this.seriesName = seriesName;
			this.nowShowing = nowShowing;
			this.programId = programId;
			this.programName = programName;
			this.episodeCount = episodeCount;
			this.watchedCount = watchedCount;
			this.recordedCount = recordedCount;
			this.expectedCount = expectedCount;
			this.missedCount = missedCount;
			this.statusWarningCount = statusWarningCount;
		};

		SeriesMock.prototype.save = function(callback) {
			callback(999);
		};

		SeriesMock.removed = true;
		SeriesMock.series = [];

		SeriesMock.listByProgram = function(programId, callback) {
				callback(SeriesMock.series);
		};

		SeriesMock.listByNowShowing = function(callback) {
			callback(SeriesMock.series);
		};

		SeriesMock.count = function(callback) {
			callback(1);
		};

		SeriesMock.removeAll = function(callback) {
			if (SeriesMock.removed) {
				callback();
			} else {
				callback("Force failed");
			}
		};

		SeriesMock.fromJson = function(series) {
			return new SeriesMock();
		};

		SeriesMock.NOW_SHOWING = {
			1: "Mondays"
		};

		return SeriesMock;
	}
);

