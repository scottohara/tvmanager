define(
	function() {
		"use strict";

		var ProgramMock = function(id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount) {
			this.id = id;
			this.programName = programName;
			this.seriesCount = seriesCount;
			this.episodeCount = episodeCount;
			this.watchedCount = watchedCount;
			this.recordedCount = recordedCount;
			this.expectedCount = expectedCount;
		};

		ProgramMock.prototype.save = function(callback) {
			if (ProgramMock.saved) {
				callback(999);
			} else {
				callback();
			}
		};

		ProgramMock.prototype.remove = function() {
		};

		ProgramMock.prototype.toJson = function() {
			return {};
		};

		ProgramMock.saved = true;
		ProgramMock.removed = true;
		ProgramMock.programs = [];

		ProgramMock.list = function(callback) {
			callback(ProgramMock.programs);
		};

		ProgramMock.find = function(id, callback) {
			callback(new ProgramMock(id, "test-program"));
		};

		ProgramMock.count = function(callback) {
			callback(1);
		};

		ProgramMock.removeAll = function(callback) {
			if (ProgramMock.removed) {
				callback();
			} else {
				callback("Force failed");
			}
		};

		ProgramMock.fromJson = function(program) {
			return new ProgramMock();
		};

		return ProgramMock;
	}
);
