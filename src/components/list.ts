import type {
	ListAction,
	ListEventHandler,
	ListItem
} from "components";
import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import window from "components/window";

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

	public refresh(): void {
		const containerElement: JQuery = $(`#${this.container}`),
					groupNames: JQuery[] = [];

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

					groupNames.push($("<li>").text(itemGroup));
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

		$("<ul>")
			.attr("id", "index")
			.append(groupNames)
			.on("touchstart", (e: JQueryEventObject): unknown => e.preventDefault() as unknown)
			.on("pointermove", ({ buttons, currentTarget, clientY }: JQueryEventObject & PointerEvent): void => {
				// Only proceed if we're dragging
				if (1 === buttons) {
					const target: JQuery<Element> = $(currentTarget),
								{ left } = target.offset() as JQuery.Coordinates,
								groupItem: Element | null = document.elementFromPoint(left, clientY);

					// If the element under the pointer is within the index
					if (groupItem && $.contains(currentTarget, groupItem)) {
						// Find an element with an ID that matches the text and scroll it into view
						$(`#${$(groupItem).text()}`).get(0).scrollIntoView(true);
					}
				}
			})
			.appendTo(containerElement);

		// Ask the application controller to set/restore the initial scroll position
		this.appController.setScrollPosition();
	}

	public showIndex(): void {
		$("#index").show();
	}

	public hideIndex(): void {
		$("#index").hide();
	}

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

	private tap(itemIndex: number): void {
		// Call the appropriate function depending on the current list mode, and whether or not a handler for that mode was specified
		switch (this.action) {
			case "view":
				this.viewEventHandler(itemIndex);
				break;

			case "edit":
				this.editEventHandler?.(itemIndex);
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