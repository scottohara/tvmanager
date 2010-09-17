var List = function (container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
	this.container = container;
	this.itemTemplate = itemTemplate;
	this.groupBy = groupBy;
	this.items = items;
	this.viewEventHandler = viewEventHandler;
	this.editEventHandler = editEventHandler;
	this.deleteEventHandler = deleteEventHandler;
	this.populateItemEventHandler = populateItemEventHandler;
	this.setAction("view");
};

List.prototype.refresh = function () {
	$.get(this.itemTemplate, $.proxy(function (template) {
		$("#" + this.container).html("");

		var itemHTML,
				group = "",
				item;

		for (var i = 0; i < this.items.length; i++) {
			item = this.items[i];

			if (this.groupBy && group !== item[this.groupBy]) {
				$("<li>")
					.attr("id", item[this.groupBy])
					.addClass("group")
					.text(item[this.groupBy])
					.appendTo($("#" + this.container));
				group = item[this.groupBy];
			}

			itemHTML = template;

			for (var prop in item) {
				if (item.hasOwnProperty(prop)) {
					itemHTML = itemHTML.replace("#{" + prop + "}", item[prop]);
				}
			}

			$("<li>")
				.html(itemHTML)
				.appendTo($("#" + this.container))
				.bind('click', $.proxy(function (itemIndex) {
					return $.proxy(function () {
						if (!appController.scroller.moved) {
							this.tap(itemIndex);
						}
					}, this);
				}, this)(i));

			if (this.populateItemEventHandler) {
				this.populateItemEventHandler(item);
			}
		}

		appController.refreshScroller();
	}, this));
};

List.prototype.setAction = function (action) {
	switch (action) {
		case "view":
		case "edit":
		case "delete":
			this.action = action;
			break;
		default:
			alert(action + " is not a valid action");
	}
};

List.prototype.tap = function (itemIndex) {
	switch (this.action) {
		case "view":
			if (this.viewEventHandler) {
				this.viewEventHandler(itemIndex);
			}
			break;

		case "edit":
			if (this.editEventHandler) {
				this.editEventHandler(itemIndex);
			}
			break;

		case "delete":
			if (this.deleteEventHandler) {
				if (window.confirm("Delete this item?")) {
					this.deleteEventHandler(itemIndex);
				}
			}
			break;
	}
};