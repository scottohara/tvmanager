EpisodeMock = {
	episodeJson: [],
	episodes: [],
	save: function(callback) {
		callback(999);
	},
	listBySeries: function(seriesId, callback) {
		callback(this.episodes);
	},
	listByUnscheduled: function(callback) {
		callback([{}]);
	},
	totalCount: function(callback) {
		callback(1);
	},
	countByStatus: function(status, callback) {
		callback(1);
	},
	removeAll: function(callback) {
		callback();
	}
};




