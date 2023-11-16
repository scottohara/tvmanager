import type { SinonStub } from "sinon";
import sinon from "sinon";

interface NavigatorMock {
	onLine: boolean;
	serviceWorker: { register: SinonStub };
	storage: { persist: SinonStub };
}

class WindowMock {
	public readonly navigator: NavigatorMock = {
		onLine: true,
		serviceWorker: { register: sinon.stub() },
		storage: { persist: sinon.stub() },
	};

	public readonly alert: SinonStub = sinon.stub();

	public readonly confirm: SinonStub = sinon.stub();

	public readonly console: { log: SinonStub } = { log: sinon.stub() };

	public readonly setTimeout: SinonStub = sinon.stub().yields();

	public innerHeight = 0;

	public readonly window: WindowMock;

	public readonly document: Document = document;

	public constructor() {
		this.window = this;
	}
}

export default new WindowMock();
