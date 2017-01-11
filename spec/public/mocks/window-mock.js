class WindowMock {
	constructor() {
		this.navigator = {onLine: true};
		this.appCacheSupported = true;
		this.appCache = {
			eventHandler: [],
			status: 0,
			swapCache: sinon.stub(),
			addEventListener(eventType, handler) {
				this.eventHandler[eventType] = handler;
			},
			update: sinon.stub()
		};
		this.openDatabase = sinon.stub();

		sinon.spy(this.appCache, "addEventListener");
	}

	get applicationCache() {
		if (this.appCacheSupported) {
			return this.appCache;
		}

		return Reflect.undefined;
	}
}

export default new WindowMock();