ListMock = function(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
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

};

ListMock.prototype.setAction = function(action) {
	this.action = action;
};
