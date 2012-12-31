/**
 * @file (Components) TouchEventProxy
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class TouchEventProxy
 * @classdesc Remaps desktop browser mouse events to touch events
 * @property {Object} element - HTML DOM Element to remap events for
 * @property {Boolean} enabled - turns on/off event mapping
 * @this TouchEventProxy
 * @constructor
 * @param {Object} element - HTML DOM Element to remap events for
 */
var TouchEventProxy = function (el) {
	"use strict";

	this.element = el;
	this.enabled = true;

	try {
		// Check if the browser supports touch events
		// If it does, this object is not used
		var testEvent = document.createEvent("TouchEvent");
	} catch (e) {
		// Browser doesn't support touch events, so bind event listeners to the element for mouse down and click
		this.element.addEventListener("mousedown", this, false);
		this.element.addEventListener("click", this, true);
	}
};

TouchEventProxy.prototype = {
	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method handleEvent
	 * @desc Handles all events bound to this object
	 * @param {Object} e - a browser event object
	 */
	handleEvent: function(e) {
		"use strict";

		// Depending on the type of event, call the appropriate function
		switch(e.type) {
			case "mousedown": this.onTouchStart(e); break;
			case "mousemove": this.onTouchMove(e); break;
			case "mouseup": this.onTouchEnd(e); break;
			case "click": this.captureBrowserEvent(e); break;
		}
	},

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method dispatchTouchEvent
	 * @fires TouchEvent
	 * @desc Creates a generic event, initialises it to the specified type, applies touch coordinates and dispatches the event
	 * @param {Object} e - a browser event object
	 * @param {String} type - the type of event to dispatch
	 */
	dispatchTouchEvent: function(e, type) {
		"use strict";

		// Create a new generic event
		var touchEvent = document.createEvent("Event");
		
		// Initalise to the specified type, and allow it to bubble and be cancelled
		touchEvent.initEvent(type, true, true);

		// Apply the original event coordinates as touch coordinates
		touchEvent.targetTouches = [{}];
		touchEvent.targetTouches[0].clientX = e.clientX;
		touchEvent.targetTouches[0].clientY = e.clientY;

		// Apply the original event target as the touch target
		touchEvent.changedTouches = [{}];
		touchEvent.changedTouches[0].target = e.target;
		touchEvent.target = e.target;

		// Preserve the original event timestamp
		touchEvent.timeStamp = e.timeStamp;
	
		// Dispatch the new event
		e.target.dispatchEvent(touchEvent);
	},

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchStart
	 * @fires TouchStartEvent
	 * @desc Dispatches a touch start event, and add event listeners to the element for when the touch ends
	 * @param {Object} e - a browser event object
	 * @returns {Boolean} false
	 */
	onTouchStart: function(e) {
		"use strict";

		// Only proceed if the object is enabled
		if (this.enabled ) {
			// Prevent default event handlers
			e.preventDefault();
			
			// Dispatch a touchstart event
			this.dispatchTouchEvent(e, "touchstart");

			// Listen for the touch to finish
			this.element.addEventListener("mousemove", this, false);
			this.element.addEventListener("mouseup", this, false);
		}

		return false;
	},

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchMove
	 * @fires TouchMoveEvent
	 * @desc Dispatches a touch move event
	 * @param {Object} e - a browser event object
	 * @returns {Boolean} false
	 */
	onTouchMove: function(e) {
		"use strict";

		// Dispatch a touchmove event
		this.dispatchTouchEvent(e, "touchmove");
		return false;
	},

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method onTouchEnd
	 * @fires TouchEndEvent
	 * @desc Removes the event listeners added by the touch start, and dispatches a touch end event
	 * @param {Object} e - a browser event object
	 * @returns {Boolean} false
	 */
	onTouchEnd: function(e) {
		"use strict";

		// Remove the listeners added by the touch start
		this.element.removeEventListener("mousemove", this, false);
		this.element.removeEventListener("mouseup", this, false);

		// Dispatch a touchend event
		this.dispatchTouchEvent(e, "touchend");
		return false;
	},

	/**
	 * @memberof TouchEventProxy
	 * @this TouchEventProxy
	 * @instance
	 * @method captureBrowserEvent
	 * @desc Captures a browser event and stops it from propagating further
	 * @param {Object} e - a browser event object
	 * @returns {Boolean} false
	 */
	captureBrowserEvent: function(e) {
		"use strict";

		// Only capture if the object is enabled and the event can be cancelled
		if (this.enabled && e.cancelable) {
			// Stop the event from propagating further
			e.stopPropagation();
		}

		return false;
	}
};
