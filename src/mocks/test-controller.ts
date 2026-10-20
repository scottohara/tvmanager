import sinon, { type SinonStub } from "sinon";
import TestView from "~/views/test-view.html";
import ViewController from "~/controllers/view-controller";
import type { ViewControllerArgs } from "~/controllers";

export default class TestController extends ViewController {
	public view: string = TestView;

	public setup: SinonStub = sinon.stub();

	public headerLeftButtonEventHandler: SinonStub = sinon.stub();

	public headerRightButtonEventHandler: SinonStub = sinon.stub();

	public footerLeftButtonEventHandler: SinonStub = sinon.stub();

	public footerRightButtonEventHandler: SinonStub = sinon.stub();

	public constructor(public args?: ViewControllerArgs) {
		super();

		this.header = {
			label: "test-header",
			leftButton: {
				eventHandler: this.headerLeftButtonEventHandler,
				style: "backButton",
				label: "left-button",
			},
			rightButton: {
				eventHandler: this.headerRightButtonEventHandler,
				style: "confirmButton",
				label: "right-button",
			},
		};
		this.footer = {
			label: "test-footer",
			leftButton: {
				eventHandler: this.footerLeftButtonEventHandler,
				style: "backButton",
				label: "left-button",
			},
			rightButton: {
				eventHandler: this.footerRightButtonEventHandler,
				style: "confirmButton",
				label: "right-button",
			},
		};
	}
}
