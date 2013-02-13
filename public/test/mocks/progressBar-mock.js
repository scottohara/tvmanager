define(
	function() {
		"use strict";

		var ProgressBarMock = function(total, sections) {
			this.total = total;
			this.sections = sections;
		};

		ProgressBarMock.prototype.setTotal = function(total) {
			this.total = total;
			return this.total;
		};

		ProgressBarMock.prototype.setSection = function(index, section) {
			this.sections[index] = section;
			return this.sections[index];
		};

		return ProgressBarMock;
	}
);
