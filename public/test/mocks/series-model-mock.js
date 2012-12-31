SeriesMock = {
	removed: true,
	seriesJson: [],
	series: [],
	save: function(callback) {
		"use strict";

		callback(999);
	},
	listByProgram: function(programId, callback) {
		"use strict";

		callback(this.series);
	},
	listByNowShowing: function(callback) {
		"use strict";

		callback(this.series);
	},
	count: function(callback) {
		"use strict";

		callback(1);
	},
	removeAll: function(callback) {
		"use strict";

		if (SeriesMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};
