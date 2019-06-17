import sinon, { SinonSpy } from "sinon";
import $ from "jquery";
import { SyntheticTouchEvent } from "../../../src/components";
import TouchEventProxy from "components/toucheventproxy";

describe("TouchEventProxy", (): void => {
	let	element: JQuery<HTMLElement>,
			toucheventproxy: TouchEventProxy;

	beforeEach((): void => {
		element = $("<div>");
		toucheventproxy = new TouchEventProxy(element.get(0));
	});

	describe("object constructor", (): void => {
		it("should return a TouchEventProxy instance", (): Chai.Assertion => toucheventproxy.should.be.an.instanceOf(TouchEventProxy));
		it("should set the element", (): Chai.Assertion => toucheventproxy["element"].should.equal(element.get(0)));
	});

	describe("handleEvent", (): void => {
		let target: JQuery<HTMLElement>,
				event: MouseEvent | TouchEvent,
				eventHandler: SinonSpy,
				mapsTo: "touchstart" | "touchmove" | "touchend";

		beforeEach((): void => {
			target = $("<a>");

			eventHandler = sinon.spy((e: TouchEvent): void => {
				// For some reason need to use e.originalEvent here, not e
				e.type.should.equal(mapsTo);
				e.targetTouches[0].clientX.should.equal((event as MouseEvent).clientX);
				e.targetTouches[0].clientY.should.equal((event as MouseEvent).clientY);
				e.targetTouches[0].identifier.should.equal(-1);
				e.changedTouches[0].target.should.equal(event.target);
				e.target && e.target.should.deep.equal(event.target);
			});
		});

		describe("mousedown", (): void => {
			let mouseMoveEvent: MouseEvent,
					mouseUpEvent: MouseEvent;

			beforeEach((): void => {
				mapsTo = "touchstart";

				// Configure the event to handle
				event = new MouseEvent("mousedown", {
					clientX: 1,
					clientY: 2
				});
				Object.defineProperty(event, "target", { value: target.get(0) });
				sinon.stub(event, "preventDefault");
				target.on(mapsTo, eventHandler);

				sinon.stub(toucheventproxy, "onTouchMove" as keyof TouchEventProxy);
				mouseMoveEvent = new MouseEvent("mousemove");

				sinon.stub(toucheventproxy, "onTouchEnd" as keyof TouchEventProxy);
				mouseUpEvent = new MouseEvent("mouseup");
			});

			describe("disabled", (): void => {
				beforeEach((): void => {
					toucheventproxy.enabled = false;
					toucheventproxy.handleEvent(event);
					toucheventproxy["element"].dispatchEvent(mouseMoveEvent);
					toucheventproxy["element"].dispatchEvent(mouseUpEvent);
				});

				it("should not prevent default behaviour of the event", (): Chai.Assertion => event.preventDefault.should.not.have.been.called);
				it("should not dispatch a touchstart event", (): Chai.Assertion => eventHandler.should.not.have.been.called);
				it("should not attach a mousemove event listener", (): Chai.Assertion => toucheventproxy["onTouchMove"].should.not.have.been.called);
				it("should not attach a mouseup event listener", (): Chai.Assertion => toucheventproxy["onTouchEnd"].should.not.have.been.called);
			});

			describe("enabled", (): void => {
				beforeEach((): void => {
					toucheventproxy.handleEvent(event);
					toucheventproxy["element"].dispatchEvent(mouseMoveEvent);
					toucheventproxy["element"].dispatchEvent(mouseUpEvent);
				});

				it("should prevent default behaviour of the event", (): Chai.Assertion => event.preventDefault.should.have.been.called);
				it("should dispatch a touchstart event", (): Chai.Assertion => eventHandler.should.have.been.called);
				it("should attach a mousemove event listener", (): Chai.Assertion => toucheventproxy["onTouchMove"].should.have.been.called);
				it("should attach a mouseup event listener", (): Chai.Assertion => toucheventproxy["onTouchEnd"].should.have.been.called);
			});
		});

		describe("mousemove", (): void => {
			it("should dispatch a touchmove event", (): void => {
				mapsTo = "touchmove";

				event = new MouseEvent("mousemove", {
					clientX: 1,
					clientY: 2
				});
				Object.defineProperty(event, "target", { value: target.get(0) });
				target.on(mapsTo, eventHandler);
				toucheventproxy.handleEvent(event);
				eventHandler.should.have.been.called;
			});
		});

		describe("mouseup", (): void => {
			beforeEach((): void => {
				const mouseMoveEvent: MouseEvent = new MouseEvent("mousemove"),
							mouseUpEvent: MouseEvent = new MouseEvent("mouseup");

				mapsTo = "touchend";
				toucheventproxy["element"].addEventListener("mousemove", toucheventproxy, false);
				toucheventproxy["element"].addEventListener("mouseup", toucheventproxy, false);

				event = new MouseEvent("mouseup", {
					clientX: 1,
					clientY: 2
				});
				Object.defineProperty(event, "target", { value: target.get(0) });
				target.on(mapsTo, eventHandler);
				toucheventproxy.handleEvent(event);

				sinon.stub(toucheventproxy, "onTouchMove" as keyof TouchEventProxy);
				toucheventproxy["element"].dispatchEvent(mouseMoveEvent);

				sinon.stub(toucheventproxy, "onTouchEnd" as keyof TouchEventProxy);
				toucheventproxy["element"].dispatchEvent(mouseUpEvent);
			});

			it("should remove the mousemove event listener", (): Chai.Assertion => toucheventproxy["onTouchMove"].should.not.have.been.called);
			it("should remove the mouseup event listener", (): Chai.Assertion => toucheventproxy["onTouchEnd"].should.not.have.been.called);
			it("should dispatch a touchend event", (): Chai.Assertion => eventHandler.should.have.been.called);
		});

		describe("click", (): void => {
			interface Scenario {
				description: string;
				enabled: boolean;
				cancelable: boolean;
				stopPropagation: boolean;
			}

			const scenarios: Scenario[] = [
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

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					beforeEach((): void => {
						toucheventproxy.enabled = scenario.enabled;
						event = new MouseEvent("click", { cancelable: scenario.cancelable });
						sinon.stub(event, "stopPropagation");
						toucheventproxy.handleEvent(event);
					});

					it(`should ${scenario.stopPropagation ? "" : "not "}stop the event from propagating further`, (): Chai.Assertion => (scenario.stopPropagation ? event.stopPropagation.should.have.been.called : event.stopPropagation.should.not.have.been.called));
				});
			});
		});

		describe("touchevent", (): void => {
			let touchStartEvent: SyntheticTouchEvent,
					touchEndEvent: SyntheticTouchEvent,
					touchMoveEvent: SyntheticTouchEvent,
					touchCancelEvent: SyntheticTouchEvent;

			beforeEach((): void => {
				touchStartEvent = new Event("touchstart") as SyntheticTouchEvent;
				touchEndEvent = new Event("touchend") as SyntheticTouchEvent;
				touchMoveEvent = new Event("touchmove") as SyntheticTouchEvent;
				touchCancelEvent = new Event("touchcancel") as SyntheticTouchEvent;
				sinon.spy(toucheventproxy, "isTouchDevice" as keyof TouchEventProxy);
			});

			describe("from proxy", (): void => {
				beforeEach((): void => {
					touchStartEvent.targetTouches = [{ identifier: -1 }];
					toucheventproxy["element"].dispatchEvent(touchStartEvent as Event);

					touchEndEvent.targetTouches = [{ identifier: -1 }];
					toucheventproxy["element"].dispatchEvent(touchEndEvent as Event);

					touchMoveEvent.targetTouches = [{ identifier: -1 }];
					toucheventproxy["element"].dispatchEvent(touchMoveEvent as Event);

					touchCancelEvent.targetTouches = [{ identifier: -1 }];
					toucheventproxy["element"].dispatchEvent(touchCancelEvent as Event);
				});

				it("should not disable the proxy", (): Chai.Assertion => toucheventproxy.enabled.should.be.true);
				it("should not remove the touch event listeners", (): Chai.Assertion => (toucheventproxy["isTouchDevice"] as SinonSpy).callCount.should.equal(4));
			});

			describe("from browser", (): void => {
				beforeEach((): void => {
					toucheventproxy["element"].dispatchEvent(touchStartEvent as Event);
					toucheventproxy["element"].dispatchEvent(touchStartEvent as Event);
					toucheventproxy["element"].dispatchEvent(touchEndEvent as Event);
					toucheventproxy["element"].dispatchEvent(touchMoveEvent as Event);
					toucheventproxy["element"].dispatchEvent(touchCancelEvent as Event);
				});

				it("should disable the proxy", (): Chai.Assertion => toucheventproxy.enabled.should.be.false);
				it("should remove the touch event listeners", (): Chai.Assertion => toucheventproxy["isTouchDevice"].should.have.been.calledOnce);
			});
		});

		describe("dispatchTouchEvent", (): void => {
			it("should not dispatch an event if there is no target", (): void => {
				event = new MouseEvent("mousedown");
				target.on("touchstart", eventHandler);
				toucheventproxy["dispatchTouchEvent"](event, "touchstart");
				eventHandler.should.not.have.been.called;
			});
		});

		afterEach((): JQuery<HTMLElement> => target.remove());
	});

	afterEach((): JQuery<HTMLElement> => element.remove());
});