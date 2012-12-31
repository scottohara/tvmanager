ListMock = function(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
	"use strict";

	this.items = items;

	if (viewEventHandler) {
		viewEventHandler();
	}

	if (editEventHandler) {
		editEventHandler();
	}

	if (deleteEventHandler) {
		deleteEventHandler();
	}

	if (populateItemEventHandler) {
		populateItemEventHandler();
	}
};

ListMock.prototype.refresh = function() {
	"use strict";
};

ListMock.prototype.setAction = function(action) {
	"use strict";

	this.action = action;
};
