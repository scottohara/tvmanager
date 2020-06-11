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
import {
	ListAction,
	ListEventHandler,
	ListItem
} from "components";
import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import window from "components/window";

/**
 * @class List
 * @classdesc Generic scrolling list view. Takes an array of JSON objects and a HTML template path, and renders a HTML list.
 * @this List
 * @property {String} container - id of the parent HTML DOM element
 * @property {String} itemTemplate - HTML template to use for list items
 * @property {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
 * @property {Array<ListItem>} items - array of objects to render as list items
 * @property {ListEventHandler} viewEventHandler - function called to view a list item
 * @property {ListEventHandler} editEventHandler - function called to edit a list item
 * @property {ListEventHandler} deleteEventHandler - function called to delete a list item
 * @property {String} action - the current list mode ("view", "edit" or "delete"), ie. what happens when an item is tapped
 * @param {String} container - id of the parent HTML DOM element
 * @param {String} itemTemplate - HTML template to use for list items
 * @param {String} groupBy - a property of the JSON objects to group the items by (ie. shows group headers in the list)
 * @param {Array<Object>} items - array of objects to render as list items
 * @param {ListEventHandler} [viewEventHandler] - function called to view a list item
 * @param {ListEventHandler} [editEventHandler] - function called to edit a list item
 * @param {ListEventHandler} [deleteEventHandler] - function called to delete a list item
 */
export default class List {
	private readonly appController: ApplicationController;

	private action?: ListAction;

	public constructor(private readonly container: string,
						private readonly itemTemplate: string,
						private readonly groupBy: string | null,
						public items: ListItem[],
						private readonly viewEventHandler: ListEventHandler,
						private readonly editEventHandler?: ListEventHandler | null,
						private readonly deleteEventHandler?: (index: number) => void) {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
		this.setAction("view");
	}

	/**
	 * @memberof List
	 * @this List
	 * @instance
	 * @method refresh
	 * @desc (Re)Populates and renders the HTML list
	 */
	public refresh(): void {
		const containerElement: JQuery = $(`#${this.container}`);

		// Clear any existing content from the container element
		containerElement.html("");

		let itemHtml: string,
				currentGroup = "";

		// Loop through the array of JSON objects
		containerElement.append(this.items.reduce((itemElements: JQuery[], item: ListItem, index: number): JQuery[] => {
			const listItem: Map<string, unknown> = new Map<string, unknown>(Object.entries(item));

			// If grouping is required, when the property used for the group changes, output a group header item
			if (null !== this.groupBy) {
				const itemGroup = String(listItem.get(this.groupBy));

				if (currentGroup !== itemGroup) {
					itemElements.push($("<li>")
						.attr("id", itemGroup)
						.addClass("group")
						.text(itemGroup));
					currentGroup = itemGroup;
				}
			}

			// Start with the HTML template
			itemHtml = this.itemTemplate;

			// Iterate over the properties of the JSON object
			for (const [key, value] of listItem) {
				// Substitute any tokens in the template (ie. #{propertyName}) with the matching property value from the object
				itemHtml = itemHtml.replace(`#{${key}}`, String(value));
			}

			// Append the item to the list and bind the click event handler
			itemElements.push($("<li>")
				.html(itemHtml)
				.on("click", (): void => this.tap(index)));

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
	public scrollTo(id: string): void {
		const item: JQuery = $(`#${id}`),
					containerElement: JQuery = $(`#${this.container}`),
					itemTop: number = item.get(0).offsetTop,
					itemBottom: number = itemTop + Number(item.height()),
					listTop = Number(containerElement.scrollTop()),
					listBottom: number = listTop + Number(containerElement.outerHeight());

		let scrollPos: number | undefined;

		// Determine if the program is off screen
		if (itemTop < listTop) {
			scrollPos = itemTop;
		} else if (itemBottom > listBottom) {
			scrollPos = itemBottom - Number(containerElement.outerHeight());
		}

		// If we have somewhere to scroll, do it now
		if (undefined !== scrollPos) {
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
	 * @param {ListAction} action - "view", "edit" or "delete"
	 */
	public setAction(action: ListAction): void {
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
				window.alert(`${action as string} is not a valid action`);
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
	private tap(itemIndex: number): void {
		// Call the appropriate function depending on the current list mode, and whether or not a handler for that mode was specified
		switch (this.action) {
			case "view":
				this.viewEventHandler(itemIndex);
				break;

			case "edit":
				if (undefined !== this.editEventHandler && null !== this.editEventHandler) {
					this.editEventHandler(itemIndex);
				}
				break;

			case "delete":
				if (undefined !== this.deleteEventHandler) {
					if (window.confirm("Delete this item?")) {
						this.deleteEventHandler(itemIndex);
					}
				}
				break;

			default:
		}
	}
}