SeriesMock = {
	seriesJson: [],
	series: [],
	save: function(callback) {
		callback(999);
	},
	listByProgram: function(programId, callback) {
		callback(this.series);
	},
	listByNowShowing: function(callback) {
		callback(this.series);
	},
	count: function(callback) {
		callback(1);
	},
	removeAll: function(callback) {
		callback();
	}
};
