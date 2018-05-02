/**
 * @file (Components) List
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module components/list
 * @requires jquery
 * @requires controllers/application-controller
 */
import $ from "jquery";
import ApplicationController from "controllers/application-controller";

/**
 * @class List
 * @classdesc Generic scrolling list view. Takes an array of JSON objects and a HTML template path, and renders a HTML list.
 * @this List
 * @property {String} container - id of the parent HTML DOM element
 * @property {String} itemTemplate - HTML template to use for list items
 * @property {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
 * @property {Array<Object>} items - array of objects to render as list items
 * @property {Function} viewEventHandler - function called to view a list item
 * @property {Function} editEventHandler - function called to edit a list item
 * @property {Function} deleteEventHandler - function called to delete a list item
 * @property {String} action - the current list mode ("view", "edit" or "delete"), ie. what happens when an item is tapped
 * @param {String} container - id of the parent HTML DOM element
 * @param {String} itemTemplate - HTML template to use for list items
 * @param {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
 * @param {Array<Object>} items - array of objects to render as list items
 * @param {Function} [viewEventHandler] - function called to view a list item
 * @param {Function} [editEventHandler] - function called to edit a list item
 * @param {Function} [deleteEventHandler] - function called to delete a list item
 */
export default class List {
	constructor(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler) {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();

		this.container = container;
		this.itemTemplate = itemTemplate;
		this.groupBy = groupBy;
		this.items = items;
		this.viewEventHandler = viewEventHandler;
		this.editEventHandler = editEventHandler;
		this.deleteEventHandler = deleteEventHandler;
		this.setAction("view");
	}

	/**
	 * @memberof List
	 * @this List
	 * @instance
	 * @method refresh
	 * @desc (Re)Populates and renders the HTML list
	 */
	refresh() {
		const containerElement = $(`#${this.container}`);

		// Clear any existing content from the container element
		containerElement.html("");

		let itemHTML,
				group = "";

		// Loop through the array of JSON objects
		containerElement.append(this.items.reduce((itemElements, item, index) => {
			// If grouping is required, when the property used for the group changes, output a group header item
			if (this.groupBy && group !== item[this.groupBy]) {
				itemElements.push($("<li>")
					.attr("id", item[this.groupBy])
					.addClass("group")
					.text(item[this.groupBy]));
				group = item[this.groupBy];
			}

			// Start with the HTML template
			itemHTML = this.itemTemplate;

			// Iterate over the properties of the JSON object
			for (const prop in item) {
				if (Object.prototype.hasOwnProperty.call(item, prop)) {
					// Substitute any tokens in the template (ie. #{propertyName}) with the matching property value from the object
					itemHTML = itemHTML.replace(`#{${prop}}`, item[prop]);
				}
			}

			// Append the item to the list and bind the click event handler
			itemElements.push($("<li>")
				.html(itemHTML)
				.on("click", () => this.tap(index)));

			return itemElements;
		}, []));

		// Ask the application controller to set/restore the initial scroll position
		this.appController.setScrollPosition();
	}

	/**
	 * @memberof List
	 * @this List
	 * @instance
	 * @method scrollTo
	 * @description Scrolls a list item into view
	 * @param {String} id - id of the item to scroll into view
	 */
	scrollTo(id) {
		const item = $(`#${id}`),
					containerElement = $(`#${this.container}`),
					itemTop = item.get(0).offsetTop,
					itemBottom = itemTop + item.height(),
					listTop = containerElement.scrollTop(),
					listBottom = listTop + containerElement.outerHeight();

		let scrollPos;

		// Determine if the program is off screen
		if (itemTop < listTop) {
			scrollPos = itemTop;
		} else if (itemBottom > listBottom) {
			scrollPos = itemBottom - containerElement.outerHeight();
		}

		// If we have somewhere to scroll, do it now
		if (scrollPos) {
			this.appController.viewStack[this.appController.viewStack.length - 1].scrollPos = scrollPos;
			this.appController.setScrollPosition();
		}
	}

	/**
	 * @memberof List
	 * @this List
	 * @instance
	 * @method setAction
	 * @desc Switches the list to either view, edit or delete mode
	 * @param {String} action - "view", "edit" or "delete"
	 */
	setAction(action) {
		let	validAction = false,
				savePosition = false;

		// Check that a valid action was specified
		switch (action) {
			case "edit":
				validAction = true;
				savePosition = true;
				break;
			case "delete":
				validAction = true;
				savePosition = true;
				break;
			case "view":
				validAction = true;
				break;
			default:
				window.alert(`${action} is not a valid action`);
		}

		// For edit/delete modes, we want the application controller to remember the current scroll position
		if (savePosition) {
			this.appController.getScrollPosition();
		}

		// Set the mode
		if (validAction) {
			this.action = action;
		}
	}

	/**
	 * @memberof List
	 * @this List
	 * @instance
	 * @method tap
	 * @desc Item clicked event handler. What happens depends on the current list mode.
	 * @param {Number} itemIndex - index of the item that was tapped
	 */
	tap(itemIndex) {
		// Call the appropriate function depending on the current list mode, and whether or not a handler for that mode was specified
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

			// No default
		}
	}
}