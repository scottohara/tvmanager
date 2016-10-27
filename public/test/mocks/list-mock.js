define(
	() => {
		"use strict";

		class ListMock {
			constructor(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
				this.items = items;
				this.viewEventHandler = viewEventHandler;
				this.editEventHandler = editEventHandler;
				this.deleteEventHandler = deleteEventHandler;
				this.populateItemEventHandler = populateItemEventHandler;
				this.refresh = sinon.stub();
			}

			setAction(action) {
				this.action = action;
			}
		}

		return ListMock;
	}
);
