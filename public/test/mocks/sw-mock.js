SpinningWheelMock = {
	slots: [],
	selectedValues: {
		keys: [],
		values: []
	},
	addSlot: function(data, align, value) {
		"use strict";

		this.slots.push(value);
	},
	setDoneAction: function(callback) {
		"use strict";

		callback();
	},
	open: function() {
		"use strict";
	},
	getSelectedValues: function() {
		"use strict";

		return this.selectedValues;
	}
};
