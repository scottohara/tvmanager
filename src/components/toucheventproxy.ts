/**
 * @file (Components) TouchEventProxy
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module components/toucheventproxy
 */
import { SyntheticTouchEvent } from "components";

/**
 * @class TouchEventProxy
 * @classdesc Remaps desktop browser mouse events to touch events
 * @this TouchEventProxy
 * @property {HTMLElement} element - HTML DOM Element to remap events for
 * @property {Boolean} enabled - turns on/off event mapping
 * @param {HTMLElement} element - HTML DOM Element to remap events for
 */
export default class TouchEventProxy {
	public enabled = true;

	public constructor(private readonly element: HTMLElement) {
		// Assume that we are on a device that doesn't support touch events, so bind event listeners to the element for mouse down and click
		this.element.addEventListener("mousedown", this, false);
		this.element.addEventListener("click", this, true);

		// However as soon as we see a 'real' touch event, disable the proxy
		this.element.addEventListener("touchstart", this, false);
		this.element.addEventListener("touchend", this, false);
		this.element.addEventListener("touchmove", this, false);
		this.element.addEventListener("touchcancel", this, false);
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method handleEvent
	 * @desc Handles all events bound to this object
	 * @param {MouseEvent} event - a browser event object
	 */
	public handleEvent(event: MouseEvent | TouchEvent): void {
		// Depending on the type of event, call the appropriate function
		switch (event.type) {
			case "mousedown":
				this.onTouchStart(event as MouseEvent);
				break;

			case "mousemove":
				this.onTouchMove(event as MouseEvent);
				break;

			case "mouseup":
				this.onTouchEnd(event as MouseEvent);
				break;

			case "click":
				this.captureBrowserEvent(event as MouseEvent);
				break;

			case "touchstart":
			case "touchend":
			case "touchmove":
			case "touchcancel":
				this.isTouchDevice(event as TouchEvent);
				break;

			// No default
		}
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method dispatchTouchEvent
	 * @fires TouchEvent
	 * @desc Creates a generic event, initialises it to the specified type, applies touch coordinates and dispatches the event
	 * @param {MouseEvent} event - a browser event object
	 * @param {String} type - the type of event to dispatch
	 */
	private dispatchTouchEvent(event: MouseEvent, type: string): void {
		// Create a new generic event, applying the original event coordinates as touch coordinates,
		const { clientX, clientY, target } = event,
					touchEvent: SyntheticTouchEvent = new Event(type, {
						bubbles: true,
						cancelable: true
					}) as SyntheticTouchEvent;

		// Assign an identifier to the event to indicate that it originated from here
		touchEvent.targetTouches = [{ identifier: -1, clientX, clientY }];

		// Apply the original event target as the touch target
		touchEvent.changedTouches = [{ target }];

		// Dispatch the new event
		if (event.target) {
			event.target.dispatchEvent(touchEvent as Event);
		}
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchStart
	 * @fires TouchStartEvent
	 * @desc Dispatches a touch start event, and add event listeners to the element for when the touch ends
	 * @param {MouseEvent} event - a browser event object
	 * @returns {Boolean} false
	 */
	private onTouchStart(event: MouseEvent): boolean {
		// Only proceed if the object is enabled
		if (this.enabled) {
			// Prevent default event handlers
			event.preventDefault();

			// Dispatch a touchstart event
			this.dispatchTouchEvent(event, "touchstart");

			// Listen for the touch to finish
			this.element.addEventListener("mousemove", this, false);
			this.element.addEventListener("mouseup", this, false);
		}

		return false;
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchMove
	 * @fires TouchMoveEvent
	 * @desc Dispatches a touch move event
	 * @param {MouseEvent} event - a browser event object
	 * @returns {Boolean} false
	 */
	private onTouchMove(event: MouseEvent): boolean {
		// Dispatch a touchmove event
		this.dispatchTouchEvent(event, "touchmove");

		return false;
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchEnd
	 * @fires TouchEndEvent
	 * @desc Removes the event listeners added by the touch start, and dispatches a touch end event
	 * @param {MouseEvent} event - a browser event object
	 * @returns {Boolean} false
	 */
	private onTouchEnd(event: MouseEvent): boolean {
		// Remove the listeners added by the touch start
		this.element.removeEventListener("mousemove", this, false);
		this.element.removeEventListener("mouseup", this, false);

		// Dispatch a touchend event
		this.dispatchTouchEvent(event, "touchend");

		return false;
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method captureBrowserEvent
	 * @desc Captures a browser event and stops it from propagating further
	 * @param {MouseEvent} event - a browser event object
	 * @returns {Boolean} false
	 */
	private captureBrowserEvent(event: MouseEvent): boolean {
		// Only capture if the object is enabled and the event can be cancelled
		if (this.enabled && event.cancelable) {
			// Stop the event from propagating further
			event.stopPropagation();
		}

		return false;
	}

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method isTouchDevice
	 * @desc Checks if the touch event was generated by the device itself, or by this object
	 * @param {TouchEvent} event - a browser touch event object
	 */
	private isTouchDevice(event: TouchEvent): void {
		let eventFromBrowser = true;

		// If the event has target touches, and the identifier of the first one is -1, the event was from this proxy
		if (event.targetTouches && event.targetTouches.length > 0 && -1 === event.targetTouches[0].identifier) {
			eventFromBrowser = false;
		}

		// If the event was fired by the brower, we don't need the proxy
		if (eventFromBrowser) {
			// Disable the proxy
			this.enabled = false;

			// Remove the touch event listeners
			this.element.removeEventListener("touchstart", this, false);
			this.element.removeEventListener("touchend", this, false);
			this.element.removeEventListener("touchmove", this, false);
			this.element.removeEventListener("touchcancel", this, false);
		}
	}
}