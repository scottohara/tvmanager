EpisodeMock = {
	removed: true,
	episodeJson: [],
	episodes: [],
	save: function(callback) {
		"use strict";

		callback(999);
	},
	listBySeries: function(seriesId, callback) {
		"use strict";

		callback(this.episodes);
	},
	listByUnscheduled: function(callback) {
		"use strict";

		callback([{}]);
	},
	totalCount: function(callback) {
		"use strict";

		callback(1);
	},
	countByStatus: function(status, callback) {
		"use strict";

		callback(1);
	},
	removeAll: function(callback) {
		"use strict";

		if (EpisodeMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};




