define(
	[
		'components/toucheventproxy',
		'framework/jquery',
		'test/framework/qunit'
	],
	
	function(TouchEventProxy, $, QUnit) {
		"use strict";

		QUnit.module("toucheventproxy", {
			setup: function() {
				this.element = $("<div>");
				this.target = $("<a>");

				this.event = {
					clientX: 1,
					clientY: 2,
					timeStamp: new Date(),
					cancelable: true,
					target: this.target.get(0),
					preventDefault: function() {
						QUnit.ok(true, "Prevent default");
					},
					stopPropagation: function() {
						QUnit.ok(true, "Stop propagation");
					}
				};

				this.eventHandler = $.proxy(function(e) {
					//For some reason need to use e.originalEvent here, not e
					QUnit.equal(e.originalEvent.type, this.event.mapsTo, "event type");
					QUnit.equal(e.originalEvent.targetTouches[0].clientX, this.event.clientX, "targetTouches clientX property");
					QUnit.equal(e.originalEvent.targetTouches[0].clientY, this.event.clientY, "targetTouches clientY property");
					QUnit.equal(e.originalEvent.changedTouches[0].target, this.event.target, "changedTouches target property");
					QUnit.deepEqual(e.originalEvent.target, this.event.target, "target property");
					QUnit.equal(Date(e.originalEvent.timeStamp).toString(), this.event.timeStamp.toString(), "timeStamp property");
				}, this);

				this.emptyEventHandler = function(e) {
					QUnit.ok(true, "Add " + e.type + " event listener");
				};

				this.toucheventproxy = new TouchEventProxy(this.element.get(0));
			},
			teardown: function() {
				this.element.remove();
				this.target.remove();
			}
		});

		QUnit.test("constructor", 2, function() {
			QUnit.ok(this.toucheventproxy, "Instantiate TouchEventProxy object");
			QUnit.deepEqual(this.toucheventproxy.element, this.element.get(0), "element property");
		});

		QUnit.test("constructor - without TouchEvent", 2, function() {
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

		QUnit.test("constructor - with TouchEvent", 0, function() {
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

		QUnit.test("handleEvent - mousedown disabled", 1, function() {
			this.toucheventproxy.enabled = false;
			this.event.type = "mousedown";
			this.event.timeStamp = new Date();
			var mapsTo = "touchstart";
			this.event.mapsTo = mapsTo;
			this.target.bind(mapsTo, this.eventHandler);
			QUnit.ok(!this.toucheventproxy.handleEvent(this.event), "return false");
			this.toucheventproxy.onTouchMove = this.emptyEventHandler;
			this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
			var event = document.createEvent("Event");
			event.initEvent("mousemove", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
			event = document.createEvent("Event");
			event.initEvent("mouseup", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
		});

		QUnit.test("handleEvent - mousedown enabled", 10, function() {
			this.event.type = "mousedown";
			this.event.timeStamp = new Date();
			var mapsTo = "touchstart";
			this.event.mapsTo = mapsTo;
			this.target.bind(mapsTo, this.eventHandler);
			QUnit.ok(!this.toucheventproxy.handleEvent(this.event), "return false");
			this.toucheventproxy.onTouchMove = this.emptyEventHandler;
			this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
			var event = document.createEvent("Event");
			event.initEvent("mousemove", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
			event = document.createEvent("Event");
			event.initEvent("mouseup", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
		});

		QUnit.test("handleEvent - mousemove", 7, function() {
			this.event.type = "mousemove";
			this.event.timeStamp = new Date();
			var mapsTo = "touchmove";
			this.event.mapsTo = mapsTo;
			this.target.bind(mapsTo, this.eventHandler);
			QUnit.ok(!this.toucheventproxy.handleEvent(this.event), "return false");
		});

		QUnit.test("handleEvent - mouseup", 7, function() {
			this.event.type = "mouseup";
			this.event.timeStamp = new Date();
			var mapsTo = "touchend";
			this.event.mapsTo = mapsTo;
			this.target.bind(mapsTo, this.eventHandler);
			QUnit.ok(!this.toucheventproxy.handleEvent(this.event), "return false");
			this.toucheventproxy.onTouchMove = this.emptyEventHandler;
			this.toucheventproxy.onTouchEnd = this.emptyEventHandler;
			var event = document.createEvent("Event");
			event.initEvent("mousemove", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
			event = document.createEvent("Event");
			event.initEvent("mouseup", true, true);
			this.toucheventproxy.element.dispatchEvent(event);
		});

		QUnit.test("handleEvent - click", function() {
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

			QUnit.expect(testParams.length + 1);
			this.event.type = "click";

			for (var i = 0; i < testParams.length; i++) {
				this.toucheventproxy.enabled = testParams[i].enabled;
				this.event.cancelable = testParams[i].cancelable;
				QUnit.ok(!this.toucheventproxy.handleEvent(this.event), testParams[i].description + " - return false");
			}
		});
	}
);
