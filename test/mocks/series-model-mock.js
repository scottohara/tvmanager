SeriesMock = {
	saved: true,
	seriesJson: [],
	series: [],
	save: function(callback) {
		this.toJson(function(json) {
			SeriesMock.seriesJson.push(json)
		});
		
		if (SeriesMock.saved) {
			callback(999);
		} else {
			callback();
		}
	},
	listByProgram: function(programId, callback) {
		if (this.series.length > 0) {
			callback(this.series);
		} else {
			var seriesList = [];
			if (this.seriesJson.length > 0) {
				seriesList[0] = {
					toJson: function(jsonCallback) {
						jsonCallback({});
					}
				}
			}
			callback(seriesList);
		}
	},
	listByNowShowing: function(callback) {
		callback(this.series);
	},
	count: function(callback) {
		callback(1);
	}
}