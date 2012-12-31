module("toucheventproxy", {
	setup: function() {
		"use strict";

		this.element = $("<div>");
		this.target = $("<a>");

		this.event = {
			clientX: 1,
			clientY: 2,
			timeStamp: new Date(),
			cancelable: true,
			target: this.target.get(0),
			preventDefault: function() {
				ok(true, "Prevent default");
			},
			stopPropagation: function() {
				ok(true, "Stop propagation");
			}
		};

		this.eventHandler = $.proxy(function(e) {
			//For some reason need to use e.originalEvent here, not e
			equals(e.originalEvent.type, this.event.mapsTo, "event type");
			equals(e.originalEvent.targetTouches[0].clientX, this.event.clientX, "targetTouches clientX property");
			equals(e.originalEvent.targetTouches[0].clientY, this.event.clientY, "targetTouches clientY property");
			equals(e.originalEvent.changedTouches[0].target, this.event.target, "changedTouches target property");
			same(e.originalEvent.target, this.event.target, "target property");
			equals(Date(e.originalEvent.timeStamp).toString(), this.event.timeStamp.toString(), "timeStamp property");
		}, this);

		this.emptyEventHandler = function(e) {
			ok(true, "Add " + e.type + " event listener");
		};

		this.toucheventproxy = new TouchEventProxy(this.element.get(0));
	},
	teardown: function() {
		"use strict";

		this.element.remove();
		this.target.remove();
	}
});

test("constructor", 2, function() {
	"use strict";

	ok(this.toucheventproxy, "Instantiate TouchEventProxy object");
	same(this.toucheventproxy.element, this.element.get(0), "element property");
});

test("constructor - without TouchEvent", 2, function() {
	"use strict";

	var originalCreateEvent = document.createEvent;
	document.createEvent = function() {
		throw new Error();
	};
	this.toucheventproxy = new TouchEventProxy(this.element.get(0));
	document.createEvent = originalCreateEvent;
	this.toucheventproxy.onTouchStart = this.emptyEventHandler;
	this.toucheventproxy.captureBrowserEvent = this.emptyEventHandler;
	var event = document.createEvent("Event");
	event.initEvent("mousedown", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
	event = document.createEvent("Event");
	event.initEvent("click", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
});

test("constructor - with TouchEvent", 0, function() {
	"use strict";

	var originalCreateEvent = document.createEvent;
	document.createEvent = function() {
		return;
	};

	this.toucheventproxy = new TouchEventProxy(this.element.get(0));
	document.createEvent = originalCreateEvent;
	this.toucheventproxy.onTouchStart = this.emptyEventHandler;
	this.toucheventproxy.captureBrowserEvent = this.emptyEventHandler;
	var event = document.createEvent("Event");
	event.initEvent("mousedown", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
	event = document.createEvent("Event");
	event.initEvent("click", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
});

test("handleEvent - mousedown disabled", 1, function() {
	"use strict";

	this.toucheventproxy.enabled = false;
	this.event.type = "mousedown";
	var mapsTo = "touchstart";
	this.event.mapsTo = mapsTo;
	this.target.bind(mapsTo, this.eventHandler);
	ok(!this.toucheventproxy.handleEvent(this.event), "return false");
	this.toucheventproxy.onTouchMove = this.emptyEventHandler;
	this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
	var event = document.createEvent("Event");
	event.initEvent("mousemove", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
	event = document.createEvent("Event");
	event.initEvent("mouseup", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
});

test("handleEvent - mousedown enabled", 10, function() {
	"use strict";

	this.event.type = "mousedown";
	var mapsTo = "touchstart";
	this.event.mapsTo = mapsTo;
	this.target.bind(mapsTo, this.eventHandler);
	ok(!this.toucheventproxy.handleEvent(this.event), "return false");
	this.toucheventproxy.onTouchMove = this.emptyEventHandler;
	this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
	var event = document.createEvent("Event");
	event.initEvent("mousemove", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
	event = document.createEvent("Event");
	event.initEvent("mouseup", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
});

test("handleEvent - mousemove", 7, function() {
	"use strict";

	this.event.type = "mousemove";
	var mapsTo = "touchmove";
	this.event.mapsTo = mapsTo;
	this.target.bind(mapsTo, this.eventHandler);
	ok(!this.toucheventproxy.handleEvent(this.event), "return false");
});

test("handleEvent - mouseup", 7, function() {
	"use strict";

	this.event.type = "mouseup";
	var mapsTo = "touchend";
	this.event.mapsTo = mapsTo;
	this.target.bind(mapsTo, this.eventHandler);
	ok(!this.toucheventproxy.handleEvent(this.event), "return false");
	this.toucheventproxy.onTouchMove = this.emptyEventHandler;
	this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
	var event = document.createEvent("Event");
	event.initEvent("mousemove", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
	event = document.createEvent("Event");
	event.initEvent("mouseup", true, true);
	this.toucheventproxy.element.dispatchEvent(event);
});

test("handleEvent - click", function() {
	"use strict";

	var testParams = [
		{
			description: "enabled",
			enabled: true,
			cancelable: false
		},
		{
			description: "cancelable",
			enabled: false,
			cancelable: true
		},
		{
			description: "enabled & cancelable",
			enabled: true,
			cancelable: true
		}
	];

	expect(testParams.length + 1);
	this.event.type = "click";

	for (var i = 0; i < testParams.length; i++) {
		this.toucheventproxy.enabled = testParams[i].enabled;
		this.event.cancelable = testParams[i].cancelable;
		ok(!this.toucheventproxy.handleEvent(this.event), testParams[i].description + " - return false");
	}
});
