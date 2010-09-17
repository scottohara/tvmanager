EpisodeMock = {
	episodeJson: [],
	episodes: [],
	save: function() {
		EpisodeMock.episodeJson.push(this.toJson());
	},
	listBySeries: function(seriesId, callback) {
		if (this.episodes.length > 0) {
			callback(this.episodes);
		} else {
			callback([{
				toJson: function() {
					return {};
				}
			}]);
		}
	},
	listByUnscheduled: function(callback) {
		callback([{}]);
	},
	count: function(callback) {
		callback(1);
	}
}




