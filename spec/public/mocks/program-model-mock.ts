import sinon, {SinonStub} from "sinon";

interface Program {
	id: string | null;
	programName: string | null;
}

const saveStub: SinonStub = sinon.stub().yields(999),
			removeStub: SinonStub = sinon.stub(),
			listStub: SinonStub = sinon.stub(),
			findStub: SinonStub = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub = sinon.stub(),
			fromJsonStub: SinonStub = sinon.stub();

let	programs: Program[] = [],
		removeAllOK: boolean;

export default class ProgramMock {
	public progressBarDisplay = "";

	public programGroup = "";

	public toJson: SinonStub;

	public setProgramName: SinonStub = sinon.stub();

	public setEpisodeCount: SinonStub = sinon.stub();

	public setWatchedCount: SinonStub = sinon.stub();

	public setRecordedCount: SinonStub = sinon.stub();

	public setExpectedCount: SinonStub = sinon.stub();

	public constructor(public readonly id: string | null,
											public readonly programName: string | null,
											public seriesCount: number = 0,
											public readonly episodeCount: number = 0,
											public readonly watchedCount: number = 0,
											public readonly recordedCount: number = 0,
											public readonly expectedCount: number = 0) {
		this.toJson = sinon.stub().returns({});
		saveStub.resetHistory();
		removeStub.reset();
	}

	public static get list(): SinonStub {
		return listStub.yields(this.programs);
	}

	public static get find(): SinonStub {
		return findStub.yields(new ProgramMock(String(findStub.args[0]), "test-program"));
	}

	public static get count(): SinonStub {
		return countStub.yields(1);
	}

	public static get removeAll(): SinonStub {
		if (removeAllOK) {
			removeAllStub.yields();
		} else {
			removeAllStub.yields("Force failed");
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub {
		return fromJsonStub.returns(new ProgramMock("", ""));
	}

	public get save(): SinonStub {
		return saveStub;
	}

	public get remove(): SinonStub {
		return removeStub;
	}

	public static removeAllOK(): void {
		removeAllOK = true;
	}

	public static removeAllFail(): void {
		removeAllOK = false;
	}

	public static get programs(): Program[] {
		return programs;
	}

	public static set programs(items: Program[]) {
		programs = items;
	}
}