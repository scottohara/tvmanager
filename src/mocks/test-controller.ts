import type { SinonStub } from "sinon";
import TestView from "~/views/test-view.html";
import ViewController from "~/controllers/view-controller";
import type { ViewControllerArgs } from "~/controllers";
import sinon from "sinon";

export default class TestController extends ViewController {
	public view: string = TestView;

	public setup: SinonStub = sinon.stub();

	public constructor(public args?: ViewControllerArgs) {
		super();

		this.header = {
			label: "test-header",
			leftButton: {
				eventHandler: sinon.stub(),
				style: "backButton",
				label: "left-button",
			},
			rightButton: {
				eventHandler: sinon.stub(),
				style: "confirmButton",
				label: "right-button",
			},
		};
		this.footer = {
			label: "test-footer",
			leftButton: {
				eventHandler: sinon.stub(),
				style: "backButton",
				label: "left-button",
			},
			rightButton: {
				eventHandler: sinon.stub(),
				style: "confirmButton",
				label: "right-button",
			},
		};
	}
}
