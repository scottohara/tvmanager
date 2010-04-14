function List(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
	this.container = container;
	this.itemTemplate = itemTemplate;
	this.groupBy = groupBy;
	this.items = items;
	this.viewEventHandler = viewEventHandler;
	this.editEventHandler = editEventHandler;
	this.deleteEventHandler = deleteEventHandler;
	this.populateItemEventHandler = populateItemEventHandler;
	this.setAction("view");
}

List.prototype.refresh = function() {
	new Ajax.Request(this.itemTemplate, {method: 'get', onComplete: this.populateItem.bind(this)});
}

List.prototype.populateItem = function(response) {
	$(this.container).innerHTML = "";
	var itemHTML;
	var group = "";
	for (var i = 0; i < this.items.length; i++) {
		item = this.items[i];

		if (this.groupBy && group != item[this.groupBy]){
			var groupItem = document.createElement("LI");
			groupItem.className = "group";
			groupItem.id = item[this.groupBy];
			groupItem.textContent = item[this.groupBy];
			$(this.container).appendChild(groupItem);
			group = item[this.groupBy];
		}

		itemHTML = response.responseText;

		for (var prop in item) {
			if (item.hasOwnProperty(prop)) {
				itemHTML = itemHTML.replace("#{" + prop + "}", item[prop]);
			}
		}

		var listItem = document.createElement("LI");
		listItem.innerHTML = itemHTML;
		listItem.addEventListener('click', function(itemIndex) { return function() { if (!appController.scroller.moved) { this.tap(itemIndex); }}.bind(this);}.bind(this)(i));
		$(this.container).appendChild(listItem);

		if (this.populateItemEventHandler) {
			this.populateItemEventHandler(item);
		}
	}

	appController.refreshScroller();
}

List.prototype.setAction = function(action) {
	switch (action) {
		case "view":
		case "edit":
		case "delete":
			this.action = action;
			break;
		default:
			alert(action + " is not a valid action");
	}
}

List.prototype.tap = function(itemIndex) {
	switch (this.action) {
		case "view":
			this.viewEventHandler(itemIndex);
			break;

		case "edit":
			this.editEventHandler(itemIndex);
			break;

		case "delete":
			if (window.confirm("Delete this item?")) {
				this.deleteEventHandler(itemIndex);
			}
			break;
	}
}