import sinon, { type SinonStub } from "sinon";

interface NavigatorMock {
	onLine: boolean;
	serviceWorker: { register: SinonStub };
	storage: { persist: SinonStub };
}

interface LocalStorageMock {
	getItem: SinonStub;
	setItem: SinonStub;
}

class WindowMock {
	public readonly navigator: NavigatorMock = {
		onLine: true,
		serviceWorker: { register: sinon.stub() },
		storage: { persist: sinon.stub() },
	};

	public readonly localStorage: LocalStorageMock = {
		getItem: sinon.stub(),
		setItem: sinon.stub(),
	};

	public readonly alert: SinonStub = sinon.stub();

	public readonly confirm: SinonStub = sinon.stub();

	public readonly fetch: SinonStub = sinon.stub();

	public readonly console: { log: SinonStub } = { log: sinon.stub() };

	public readonly setTimeout: SinonStub = sinon.stub().yields();

	public readonly btoa: SinonStub = sinon
		.stub()
		.callsFake((data: string): string => `base64(${data})`);

	public innerHeight = 0;

	public readonly window: WindowMock;

	public readonly document: Document = document;

	public constructor() {
		this.window = this;
	}
}

export default new WindowMock();
