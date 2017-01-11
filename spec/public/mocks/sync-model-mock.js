const removeStub = sinon.stub(),
			listStub = sinon.stub(),
			countStub = sinon.stub(),
			removeAllStub = sinon.stub().yields();

let syncList = [];

export default class SyncMock {
	constructor(type, id) {
		syncList = [{type, id}];
		removeStub.reset();
	}

	get remove() {
		return removeStub;
	}

	static get syncList() {
		return syncList;
	}

	static reset() {
		syncList = [];
		removeStub.reset();
	}

	static get list() {
		return listStub.yields(this.syncList);
	}

	static get count() {
		return countStub.yields(this.syncList.length);
	}

	static get removeAll() {
		return removeAllStub;
	}
}