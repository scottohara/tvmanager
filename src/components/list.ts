import type { ListAction, ListEventHandler, ListItem } from "~/components";
import ApplicationController from "~/controllers/application-controller";
import window from "~/components/window";

export default class List {
	private readonly appController: ApplicationController;

	private action?: ListAction;

	public constructor(
		private readonly container: string,
		private readonly itemTemplate: string,
		private readonly groupBy: string | null,
		public items: ListItem[],
		private readonly viewEventHandler: ListEventHandler,
		private readonly editEventHandler?: ListEventHandler | null,
		private readonly deleteEventHandler?: (index: number) => void,
	) {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
		this.setAction("view");
	}

	// DOM selectors
	private get containerElement(): HTMLUListElement {
		return document.querySelector(`#${this.container}`) as HTMLUListElement;
	}

	private get index(): HTMLUListElement {
		return document.querySelector("#index") as HTMLUListElement;
	}

	public refresh(): void {
		const groupNames: HTMLLIElement[] = [];

		// Clear any existing content from the container element
		this.containerElement.innerHTML = "";

		let itemHtml: string,
			currentGroup = "";

		// Loop through the array of JSON objects
		this.containerElement.append(
			...this.items.reduce(
				(
					itemElements: HTMLLIElement[],
					item: ListItem,
					itemIndex: number,
				): HTMLLIElement[] => {
					const listItemProperties = new Map<string, unknown>(
						Object.entries(item),
					);

					// If grouping is required, when the property used for the group changes, output a group header item
					if (null !== this.groupBy) {
						const itemGroup = listItemProperties.get(this.groupBy) as string;

						if (currentGroup !== itemGroup) {
							const group = document.createElement("li"),
								groupName = document.createElement("li");

							group.id = `group-${itemGroup}`;
							group.classList.add("group");
							group.textContent = itemGroup;
							itemElements.push(group);

							groupName.textContent = itemGroup;
							groupNames.push(groupName);
							currentGroup = itemGroup;
						}
					}

					// Start with the HTML template
					itemHtml = this.itemTemplate;

					// Iterate over the properties of the JSON object
					for (const [key, value] of listItemProperties) {
						const prefix = "id" === key ? "item-" : "";

						// Substitute any tokens in the template (ie. #{propertyName}) with the matching property value from the object
						itemHtml = itemHtml.replace(
							`#{${key}}`,
							`${prefix}${value as string}`,
						);
					}

					// Append the item to the list and bind the click event handler
					const listItem = document.createElement("li");

					listItem.innerHTML = itemHtml;
					listItem.addEventListener("click", (): void => this.tap(itemIndex));
					itemElements.push(listItem);

					return itemElements;
				},
				[],
			),
		);

		const index = document.createElement("ul");

		index.id = "index";
		index.append(...groupNames);
		index.addEventListener(
			"touchstart",
			(e: Event): void => e.preventDefault(),
			{ passive: false },
		);
		index.addEventListener(
			"pointermove",
			({ buttons, clientY }: PointerEvent): void => {
				// Only proceed if we're dragging
				if (1 === buttons) {
					const groupItem = document.elementFromPoint(
						index.offsetLeft,
						clientY,
					);

					// If the element under the pointer is within the index
					if (groupItem && index.contains(groupItem)) {
						// Find an element with an ID that matches the text and scroll it into view
						document
							.querySelector(`#group-${groupItem.textContent}`)
							?.scrollIntoView(true);
					}
				}
			},
		);

		this.containerElement.append(index);

		// Ask the application controller to set/restore the initial scroll position
		this.appController.setScrollPosition();
	}

	public showIndex(): void {
		this.index.style.display = "block";
	}

	public hideIndex(): void {
		this.index.style.display = "none";
	}

	public scrollTo(id: string): void {
		const item = document.querySelector(`#item-${id}`) as HTMLLIElement,
			itemTop = item.offsetTop,
			itemBottom = itemTop + item.offsetHeight,
			listTop = this.containerElement.scrollTop,
			listBottom = listTop + this.containerElement.offsetHeight;

		let scrollPos: number | undefined;

		// Determine if the program is off screen
		if (itemTop < listTop) {
			scrollPos = itemTop;
		} else if (itemBottom > listBottom) {
			scrollPos = itemBottom - this.containerElement.offsetHeight;
		}

		// If we have somewhere to scroll, do it now
		if (undefined !== scrollPos) {
			this.appController.viewStack[
				this.appController.viewStack.length - 1
			].scrollPos = scrollPos;
			this.appController.setScrollPosition();
		}
	}

	public setAction(action: ListAction): void {
		let validAction = false,
			savePosition = false;

		// Check that a valid action was specified
		switch (action) {
			case "edit":
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

			case undefined:
			default:
		}
	}
}
