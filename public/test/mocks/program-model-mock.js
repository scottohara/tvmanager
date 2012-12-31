ProgramMock = {
	saved: true,
	removed: true,
	programJson: [],
	programs: [],
	save: function(callback) {
		"use strict";

		if (ProgramMock.saved) {
			callback(999);
		} else {
			callback();
		}
	},
	list: function(callback) {
		"use strict";

		callback(this.programs);
	},
	find: function(id, callback) {
		"use strict";

		callback(new Program(id, "test-program"));
	},
	count: function(callback) {
		"use strict";

		callback(1);
	},
	removeAll: function(callback) {
		"use strict";

		if (ProgramMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};
