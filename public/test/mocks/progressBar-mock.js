ProgressBarMock = function(total, sections) {
	"use strict";

	this.total = total;
	this.sections = sections;
};

ProgressBarMock.prototype.setTotal = function(total) {
	"use strict";

	this.total = total;
	return this.total;
};

ProgressBarMock.prototype.setSection = function(index, section) {
	"use strict";

	this.sections[index] = section;
	return this.sections[index];
};
