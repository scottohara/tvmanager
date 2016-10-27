define(
	[
		"components/toucheventproxy",
		"framework/jquery"
	],

	(TouchEventProxy, $) => {
		"use strict";

		describe("TouchEventProxy", () => {
			let	element,
					toucheventproxy;

			beforeEach(() => {
				element = $("<div>");
				toucheventproxy = new TouchEventProxy(element.get(0));
			});

			describe("object constructor", () => {
				it("should return a TouchEventProxy instance", () => toucheventproxy.should.be.an.instanceOf(TouchEventProxy));
				it("should set the element", () => toucheventproxy.element.should.equal(element.get(0)));
			});

			describe("handleEvent", () => {
				let target,
						event,
						eventHandler;

				beforeEach(() => {
					target = $("<a>");

					event = {
						clientX: 1,
						clientY: 2,
						timeStamp: new Date(),
						cancelable: true,
						target: target.get(0),
						preventDefault: sinon.stub(),
						stopPropagation: sinon.stub()
					};

					eventHandler = sinon.spy(e => {
						// For some reason need to use e.originalEvent here, not e
						e.originalEvent.type.should.equal(event.mapsTo);
						e.originalEvent.targetTouches[0].clientX.should.equal(event.clientX);
						e.originalEvent.targetTouches[0].clientY.should.equal(event.clientY);
						e.originalEvent.targetTouches[0].identifier.should.equal(-1);
						e.originalEvent.changedTouches[0].target.should.equal(event.target);
						e.originalEvent.target.should.deep.equal(event.target);
						Date(e.originalEvent.timeStamp).toString().should.equal(event.timeStamp.toString());
					});
				});

				describe("mousedown", () => {
					const mapsTo = "touchstart";

					let mouseMoveEvent,
							mouseUpEvent;

					beforeEach(() => {
						// Configure the event to handle
						event.type = "mousedown";
						event.mapsTo = mapsTo;
						target.on(mapsTo, eventHandler);

						sinon.stub(toucheventproxy, "onTouchMove");
						mouseMoveEvent = document.createEvent("Event");
						mouseMoveEvent.initEvent("mousemove", true, true);

						sinon.stub(toucheventproxy, "onTouchEnd");
						mouseUpEvent = document.createEvent("Event");
						mouseUpEvent.initEvent("mouseup", true, true);
					});

					describe("disabled", () => {
						beforeEach(() => {
							toucheventproxy.enabled = false;
							toucheventproxy.handleEvent(event);
							toucheventproxy.element.dispatchEvent(mouseMoveEvent);
							toucheventproxy.element.dispatchEvent(mouseUpEvent);
						});

						it("should not prevent default behaviour of the event", () => event.preventDefault.should.not.have.been.called);
						it("should not dispatch a touchstart event", () => eventHandler.should.not.have.been.called);
						it("should not attach a mousemove event listener", () => toucheventproxy.onTouchMove.should.not.have.been.called);
						it("should not attach a mouseup event listener", () => toucheventproxy.onTouchEnd.should.not.have.been.called);
					});

					describe("enabled", () => {
						beforeEach(() => {
							toucheventproxy.handleEvent(event);
							toucheventproxy.element.dispatchEvent(mouseMoveEvent);
							toucheventproxy.element.dispatchEvent(mouseUpEvent);
						});

						it("should prevent default behaviour of the event", () => event.preventDefault.should.have.been.called);
						it("should dispatch a touchstart event", () => eventHandler.should.have.been.called);
						it("should attach a mousemove event listener", () => toucheventproxy.onTouchMove.should.have.been.called);
						it("should attach a mouseup event listener", () => toucheventproxy.onTouchEnd.should.have.been.called);
					});
				});

				describe("mousemove", () => {
					it("should dispatch a touchmove event", () => {
						const mapsTo = "touchmove";

						event.type = "mousemove";
						event.mapsTo = mapsTo;
						target.on(mapsTo, eventHandler);
						toucheventproxy.handleEvent(event);
						eventHandler.should.have.been.called;
					});
				});

				describe("mouseup", () => {
					const mapsTo = "touchend";

					beforeEach(() => {
						const mouseMoveEvent = document.createEvent("Event"),
									mouseUpEvent = document.createEvent("Event");

						toucheventproxy.element.addEventListener("mousemove", toucheventproxy, false);
						toucheventproxy.element.addEventListener("mouseup", toucheventproxy, false);

						event.type = "mouseup";
						event.mapsTo = mapsTo;
						target.on(mapsTo, eventHandler);
						toucheventproxy.handleEvent(event);

						sinon.stub(toucheventproxy, "onTouchMove");
						mouseMoveEvent.initEvent("mousemove", true, true);
						toucheventproxy.element.dispatchEvent(mouseMoveEvent);

						sinon.stub(toucheventproxy, "onTouchEnd");
						mouseUpEvent.initEvent("mouseup", true, true);
						toucheventproxy.element.dispatchEvent(mouseUpEvent);
					});

					it("should remove the mousemove event listener", () => toucheventproxy.onTouchMove.should.not.have.been.called);
					it("should remove the mouseup event listener", () => toucheventproxy.onTouchEnd.should.not.have.been.called);
					it("should dispatch a touchend event", () => eventHandler.should.have.been.called);
				});

				describe("click", () => {
					const testParams = [
						{
							description: "disabled and not cancelable",
							enabled: false,
							cancelable: false,
							stopPropagation: false
						},
						{
							description: "enabled only",
							enabled: true,
							cancelable: false,
							stopPropagation: false
						},
						{
							description: "cancelable only",
							enabled: false,
							cancelable: true,
							stopPropagation: false
						},
						{
							description: "enabled and cancelable",
							enabled: true,
							cancelable: true,
							stopPropagation: true
						}
					];

					beforeEach(() => (event.type = "click"));

					testParams.forEach(params => {
						describe(params.description, () => {
							beforeEach(() => {
								toucheventproxy.enabled = params.enabled;
								event.cancelable = params.cancelable;
								toucheventproxy.handleEvent(event);
							});

							it(`should ${params.stopPropagation ? "" : "not "}stop the event from propagating further`, () => params.stopPropagation ? event.stopPropagation.should.have.been.called : event.stopPropagation.should.not.have.been.called);
						});
					});
				});

				describe("touchevent", () => {
					let touchStartEvent,
							touchEndEvent,
							touchMoveEvent,
							touchCancelEvent;

					beforeEach(() => {
						touchStartEvent = document.createEvent("Event");
						touchStartEvent.initEvent("touchstart", true, true);

						touchEndEvent = document.createEvent("Event");
						touchEndEvent.initEvent("touchend", true, true);

						touchMoveEvent = document.createEvent("Event");
						touchMoveEvent.initEvent("touchmove", true, true);

						touchCancelEvent = document.createEvent("Event");
						touchCancelEvent.initEvent("touchcancel", true, true);

						sinon.spy(toucheventproxy, "isTouchDevice");
					});

					describe("from proxy", () => {
						beforeEach(() => {
							touchStartEvent.targetTouches = [{identifier: -1}];
							toucheventproxy.element.dispatchEvent(touchStartEvent);

							touchEndEvent.targetTouches = [{identifier: -1}];
							toucheventproxy.element.dispatchEvent(touchEndEvent);

							touchMoveEvent.targetTouches = [{identifier: -1}];
							toucheventproxy.element.dispatchEvent(touchMoveEvent);

							touchCancelEvent.targetTouches = [{identifier: -1}];
							toucheventproxy.element.dispatchEvent(touchCancelEvent);
						});

						it("should not disable the proxy", () => toucheventproxy.enabled.should.be.true);
						it("should not remove the touch event listeners", () => toucheventproxy.isTouchDevice.callCount.should.equal(4));
					});

					describe("from browser", () => {
						beforeEach(() => {
							toucheventproxy.element.dispatchEvent(touchStartEvent);
							toucheventproxy.element.dispatchEvent(touchStartEvent);
							toucheventproxy.element.dispatchEvent(touchEndEvent);
							toucheventproxy.element.dispatchEvent(touchMoveEvent);
							toucheventproxy.element.dispatchEvent(touchCancelEvent);
						});

						it("should disable the proxy", () => toucheventproxy.enabled.should.be.false);
						it("should remove the touch event listeners", () => toucheventproxy.isTouchDevice.should.have.been.calledOnce);
					});
				});

				afterEach(() => target.remove());
			});

			afterEach(() => element.remove());
		});
	}
);