ProgramMock = {
	saved: true,
	removed: true,
	programJson: [],
	programs: [],
	save: function(callback) {
		callback();
	},
	list: function(callback) {
		callback(this.programs);
	},
	find: function(id, callback) {
		callback(new Program(id, "test-program"));
	},
	count: function(callback) {
		callback(1);
	},
	removeAll: function(callback) {
		if (ProgramMock.removed) {
			callback();
		} else {
			callback("Force failed");
		}
	}
};
