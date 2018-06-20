import sinon from "sinon";

class WindowMock {
	constructor() {
		this.navigator = {onLine: true};
		this.openDatabase = sinon.stub();
		this.alert = sinon.stub();
		this.confirm = sinon.stub();
		this.setTimeout = sinon.stub().yields();
		this.window = this;
		this.document = document;
	}
}

export default new WindowMock();