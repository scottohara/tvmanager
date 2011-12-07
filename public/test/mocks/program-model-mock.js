ProgramMock = {
	saved: true,
	programJson: [],
	programs: [],
	save: function(callback) {
		this.toJson(function(json) {
			ProgramMock.programJson.push(json);
		});
		
		if (ProgramMock.saved) {
			callback(999);
		} else {
			callback();
		}
	},
	list: function(callback) {
		var that = this;
		
		var programToJson = function(index) {
			var name = that.programs[index].name;
			return function(jsonCallback) {
				jsonCallback({ name: name });
			};
		};

		for (var i = 0; i < this.programs.length; i++) {
			this.programs[i].toJson = programToJson(i);
		}
		callback(this.programs);
	},
	count: function(callback) {
		callback(1);
	}
};