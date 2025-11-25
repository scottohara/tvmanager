import sinon, { type SinonStub } from "sinon";
import type { View } from "~/controllers";

export default class ApplicationControllerMock {
	private static singletonInstance?: ApplicationControllerMock;

	public viewStack: View[] = [];

	public start: SinonStub = sinon.stub();

	public pushView: SinonStub = sinon.stub();

	public popView: SinonStub = sinon.stub();

	public clearFooter: SinonStub = sinon.stub();

	public setFooter: SinonStub = sinon.stub();

	public getScrollPosition: SinonStub = sinon.stub();

	public setScrollPosition: SinonStub = sinon.stub();

	public showNotice: SinonStub = sinon.stub();

	public showScrollHelper: SinonStub = sinon.stub();

	public hideScrollHelper: SinonStub = sinon.stub();

	public constructor() {
		// App controller is a singleton, so if an instance already exists, return it
		if (undefined !== ApplicationControllerMock.singletonInstance) {
			const { singletonInstance } = ApplicationControllerMock;

			singletonInstance.start.reset();
			singletonInstance.pushView.reset();
			singletonInstance.popView.reset();
			singletonInstance.clearFooter.reset();
			singletonInstance.setFooter.reset();
			singletonInstance.getScrollPosition.reset();
			singletonInstance.setScrollPosition.reset();
			singletonInstance.showNotice.reset();
			singletonInstance.showScrollHelper.reset();
			singletonInstance.hideScrollHelper.reset();

			return singletonInstance;
		}

		// No existing instance, so make this instance the singleton
		ApplicationControllerMock.singletonInstance = this;
	}
}
