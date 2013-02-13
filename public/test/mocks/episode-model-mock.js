define(
	function() {
		"use strict";

		var EpisodeMock = function(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId) {
			this.id = id;
			this.episodeName = episodeName;
			this.status = status;
			this.statusDate = statusDate;
			this.unverified = unverified;
			this.unscheduled = unscheduled;
			this.sequence = sequence;
			this.seriesId = seriesId;
		};

		EpisodeMock.prototype.save = function(callback) {
			callback(999);
		};

		EpisodeMock.removed = true;
		EpisodeMock.episodes = [];

		EpisodeMock.listBySeries = function(seriesId, callback) {
			callback(EpisodeMock.episodes);
		};

		EpisodeMock.listByUnscheduled = function(callback) {
			callback([{}]);
		};

		EpisodeMock.totalCount = function(callback) {
			callback(1);
		};

		EpisodeMock.countByStatus = function(status, callback) {
			callback(1);
		};

		EpisodeMock.removeAll = function(callback) {
			if (EpisodeMock.removed) {
				callback();
			} else {
				callback("Force failed");
			}
		};

		EpisodeMock.fromJson = function(episode) {
			return new EpisodeMock();
		};

		return EpisodeMock;
	}	
);
