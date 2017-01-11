const saveStub = sinon.stub().yields(999),
			removeStub = sinon.stub(),
			listStub = sinon.stub(),
			findStub = sinon.stub(),
			countStub = sinon.stub(),
			removeAllStub = sinon.stub(),
			fromJsonStub = sinon.stub();

let	programs = [],
		removeAllOK;

export default class ProgramMock {
	constructor(id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount) {
		this.id = id;
		this.programName = programName;
		this.seriesCount = seriesCount;
		this.episodeCount = episodeCount;
		this.watchedCount = watchedCount;
		this.recordedCount = recordedCount;
		this.expectedCount = expectedCount;
		this.toJson = sinon.stub().returns({});

		saveStub.reset();
		removeStub.reset();
	}

	get save() {
		return saveStub;
	}

	get remove() {
		return removeStub;
	}

	static removeAllOK() {
		removeAllOK = true;
	}

	static removeAllFail() {
		removeAllOK = false;
	}

	static get programs() {
		return programs;
	}

	static set programs(items) {
		programs = items;
	}

	static get list() {
		return listStub.yields(this.programs);
	}

	static get find() {
		return findStub.yields(new ProgramMock(findStub.args[0], "test-program"));
	}

	static get count() {
		return countStub.yields(1);
	}

	static get removeAll() {
		if (removeAllOK) {
			removeAllStub.yields();
		} else {
			removeAllStub.yields("Force failed");
		}

		return removeAllStub;
	}

	static get fromJson() {
		return fromJsonStub.returns(new ProgramMock());
	}
}