class WindowMock {
	constructor() {
		this.navigator = {onLine: true};
		this.openDatabase = sinon.stub();
	}
}

export default new WindowMock();