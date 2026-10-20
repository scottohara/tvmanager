import type {
	ClickEventListener,
	HeaderFooter,
	NavButton,
} from "~/controllers";
import sinon, { type SinonSpy, type SinonStub } from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import TestController from "~/mocks/test-controller";
import ViewController from "./view-controller";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("ViewController", (): void => {
	let controller: TestController, toEventListener: SinonSpy;

	beforeEach((): void => {
		// The header and footer are assigned in the constructor, so spy on the prototype before instantiating
		toEventListener = sinon.spy(
			ViewController.prototype,
			"toEventListener" as keyof ViewController,
		);
		controller = new TestController();
	});

	describe("header", (): void => {
		let leftButton: NavButton<ClickEventListener>,
			rightButton: NavButton<ClickEventListener>;

		beforeEach(
			(): Required<HeaderFooter<ClickEventListener>> =>
				({ leftButton, rightButton } = controller.header as Required<
					HeaderFooter<ClickEventListener>
				>),
		);

		it("should preserve the header label", (): Chai.Assertion =>
			expect(controller.header.label).to.equal("test-header"));

		it("should preserve the left button", (): Chai.Assertion =>
			expect(leftButton).to.deep.include({
				style: "backButton",
				label: "left-button",
			}));

		it("should wrap the left button event handler", (): Chai.Assertion =>
			expect(
				toEventListener.withArgs(controller.headerLeftButtonEventHandler),
			).to.have.returned(leftButton.eventHandler));

		it("should preserve the right button", (): Chai.Assertion =>
			expect(rightButton).to.deep.include({
				style: "confirmButton",
				label: "right-button",
			}));

		it("should wrap the right button event handler", (): Chai.Assertion =>
			expect(
				toEventListener.withArgs(controller.headerRightButtonEventHandler),
			).to.have.returned(rightButton.eventHandler));

		describe("without buttons", (): void => {
			beforeEach(
				(): HeaderFooter => (controller.header = { label: "no-buttons" }),
			);

			it("should not set a left button", (): Chai.Assertion =>
				expect(controller.header.leftButton).to.be.undefined);
			it("should not set a right button", (): Chai.Assertion =>
				expect(controller.header.rightButton).to.be.undefined);
		});

		describe("without event handlers", (): void => {
			beforeEach(
				(): HeaderFooter =>
					(controller.header = {
						leftButton: { label: "left-button" },
						rightButton: { label: "right-button" },
					}),
			);

			it("should not set a left button event handler", (): Chai.Assertion =>
				expect(controller.header.leftButton?.eventHandler).to.be.undefined);
			it("should not set a right button event handler", (): Chai.Assertion =>
				expect(controller.header.rightButton?.eventHandler).to.be.undefined);
		});
	});

	describe("footer", (): void => {
		let leftButton: NavButton<ClickEventListener>,
			rightButton: NavButton<ClickEventListener>;

		beforeEach(
			(): Required<HeaderFooter<ClickEventListener>> =>
				({ leftButton, rightButton } = controller.footer as Required<
					HeaderFooter<ClickEventListener>
				>),
		);

		it("should preserve the footer label", (): Chai.Assertion =>
			expect(controller.footer?.label).to.equal("test-footer"));

		it("should preserve the left button", (): Chai.Assertion =>
			expect(leftButton).to.deep.include({
				style: "backButton",
				label: "left-button",
			}));

		it("should wrap the left button event handler", (): Chai.Assertion =>
			expect(
				toEventListener.withArgs(controller.footerLeftButtonEventHandler),
			).to.have.returned(leftButton.eventHandler));

		it("should preserve the right button", (): Chai.Assertion =>
			expect(rightButton).to.deep.include({
				style: "confirmButton",
				label: "right-button",
			}));

		it("should wrap the right button event handler", (): Chai.Assertion =>
			expect(
				toEventListener.withArgs(controller.footerRightButtonEventHandler),
			).to.have.returned(rightButton.eventHandler));

		describe("without buttons", (): void => {
			beforeEach(
				(): HeaderFooter => (controller.footer = { label: "no-buttons" }),
			);

			it("should not set a left button", (): Chai.Assertion =>
				expect(controller.footer?.leftButton).to.be.undefined);
			it("should not set a right button", (): Chai.Assertion =>
				expect(controller.footer?.rightButton).to.be.undefined);
		});

		describe("without event handlers", (): void => {
			beforeEach(
				(): HeaderFooter =>
					(controller.footer = {
						leftButton: { label: "left-button" },
						rightButton: { label: "right-button" },
					}),
			);

			it("should not set a left button event handler", (): Chai.Assertion =>
				expect(controller.footer?.leftButton?.eventHandler).to.be.undefined);
			it("should not set a right button event handler", (): Chai.Assertion =>
				expect(controller.footer?.rightButton?.eventHandler).to.be.undefined);
		});

		describe("without footer", (): void => {
			beforeEach((): undefined => (controller.footer = undefined));

			it("should not set a footer", (): Chai.Assertion =>
				expect(controller.footer).to.be.undefined);
		});
	});

	describe("toEventListener", (): void => {
		let eventHandler: SinonStub<[], Promise<void>>;

		beforeEach(
			(): SinonStub<[], Promise<void>> => (eventHandler = sinon.stub()),
		);

		describe("when the event handler resolves", (): void => {
			beforeEach(async (): Promise<void> => {
				eventHandler.resolves();
				controller["toEventListener"](eventHandler)();
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			it("should invoke the event handler", (): Chai.Assertion =>
				expect(eventHandler).to.have.been.called);
			it("should not show a notice", (): Chai.Assertion =>
				expect(appController.showNotice).to.not.have.been.called);
		});

		describe("when the event handler rejects", (): void => {
			beforeEach(async (): Promise<void> => {
				eventHandler.rejects(new Error("event handler failed"));
				controller["toEventListener"](eventHandler)();
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			it("should invoke the event handler", (): Chai.Assertion =>
				expect(eventHandler).to.have.been.called);
			it("should show a notice", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "event handler failed",
				}));
		});
	});

	afterEach((): void => toEventListener.restore());
});
