import TestView from "views/test-view.html";
import sinon from "sinon";

export default class TestController {
	constructor(args) {
		this.args = args;
		this.buttonClicked = sinon.stub();
		this.header = {
			label: "test-header",
			leftButton: {
				eventHandler: this.buttonClicked,
				style: "left-button-style",
				label: "left-button"
			},
			rightButton: {
				eventHandler: this.buttonClicked,
				style: "right-button-style",
				label: "right-button"
			}
		};
		this.footer = {
			label: "test-footer",
			leftButton: {
				eventHandler: this.buttonClicked,
				style: "left-button-style",
				label: "left-button"
			},
			rightButton: {
				eventHandler: this.buttonClicked,
				style: "right-button-style",
				label: "right-button"
			}
		};
	}

	get view() {
		return TestView;
	}
}