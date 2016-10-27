/**
 * @file (Components) List
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports components/list
	 */
	(ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class List
		 * @classdesc Generic scrolling list view. Takes an array of JSON objects and a HTML template path, and renders a HTML list.
		 * @property {String} container - id of the parent HTML DOM element
		 * @property {String} itemTemplate - path (from root) to the HTML template to use for list items
		 * @property {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
		 * @property {Array<Object>} items - array of objects to render as list items
		 * @property {Function} viewEventHandler - function called to view a list item
		 * @property {Function} editEventHandler - function called to edit a list item
		 * @property {Function} deleteEventHandler - function called to delete a list item
		 * @property {Function} populateItemEventHandler - function called after creating each list item
		 * @property {String} action - the current list mode ("view", "edit" or "delete"), ie. what happens when an item is tapped
		 */
		class List {
			/**
			 * @constructor List
			 * @this List
			 * @param {String} container - id of the parent HTML DOM element
			 * @param {String} itemTemplate - path (from root) to the HTML template to use for list items
			 * @param {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
			 * @param {Array<Object>} items - array of objects to render as list items
			 * @param {Function} [viewEventHandler] - function called to view a list item
			 * @param {Function} [editEventHandler] - function called to edit a list item
			 * @param {Function} [deleteEventHandler] - function called to delete a list item
			 * @param {Function} [populateItemEventHandler] - function called after creating each list item
			 */
			constructor(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler, populateItemEventHandler) {
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

			/**
			 * @memberof List
			 * @this List
			 * @instance
			 * @method refresh
			 * @desc (Re)Populates and renders the HTML list
			 */
			refresh() {
				// Load the HTML template to use for the list items
				$.get(this.itemTemplate, (template, status, jqXHR) => {
					// A 304 Not Modified returns undefined, so we need to get the template from the jqXHR object instead
					const itemTemplate = template || jqXHR.responseText,
								containerElement = $(`#${this.container}`);

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
						itemHTML = itemTemplate;

						// Iterate over the properties of the JSON object
						for (const prop in item) {
							if (Reflect.apply({}.hasOwnProperty, item, [prop])) {
								// Substitute any tokens in the template (ie. #{propertyName}) with the matching property value from the object
								itemHTML = itemHTML.replace(`#{${prop}}`, item[prop]);
							}
						}

						// Append the item to the list and bind the click event handler
						itemElements.push($("<li>")
							.html(itemHTML)
							.on("click", () => this.tap(index)));

						// If a populate item event handler was specified, trigger it
						if (this.populateItemEventHandler) {
							this.populateItemEventHandler(item);
						}

						return itemElements;
					}, []));

					// Ask the application controller to set/restore the initial scroll position
					appController.setScrollPosition();
				});
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
					appController.getScrollPosition();
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

					// no default
				}
			}
		}

		return List;
	}
);