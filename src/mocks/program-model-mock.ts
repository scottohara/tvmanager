import sinon, { type SinonStub } from "sinon";
import BaseMock from "~/mocks/base-model-mock";

const listStub: SinonStub<[], Promise<ProgramMock[]>> = sinon.stub(),
	countStub: SinonStub<[], Promise<number>> = sinon.stub(),
	saveStub: SinonStub<[], Promise<void>> = sinon.stub(),
	removeStub: SinonStub<[], Promise<void>> = sinon.stub();

let programs: ProgramMock[] = [];

export default class ProgramMock extends BaseMock {
	public progressBarDisplay = "";

	public programGroup = "";

	public setProgramName: SinonStub = sinon.stub();

	public setEpisodeCount: SinonStub = sinon.stub();

	public setWatchedCount: SinonStub = sinon.stub();

	public setRecordedCount: SinonStub = sinon.stub();

	public setExpectedCount: SinonStub = sinon.stub();

	public constructor(
		public readonly id: number | null,
		public programName: string,
		public seriesCount = 0,
		public readonly episodeCount = 0,
		public readonly watchedCount = 0,
		public readonly recordedCount = 0,
		public readonly expectedCount = 0,
	) {
		super();
	}

	public static get list(): SinonStub<[], Promise<ProgramMock[]>> {
		return this.stub(listStub, this.programs);
	}

	public static get count(): SinonStub<[], Promise<number>> {
		return this.stub(countStub, 1);
	}

	public static get programs(): ProgramMock[] {
		return programs;
	}

	public static set programs(items: ProgramMock[]) {
		programs = items;
	}

	public get save(): SinonStub<[], Promise<void>> {
		return ProgramMock.stub(saveStub, undefined);
	}

	public get remove(): SinonStub<[], Promise<void>> {
		return ProgramMock.stub(removeStub, undefined);
	}

	public static reset(): void {
		listStub.reset();
		countStub.reset();
		saveStub.reset();
		removeStub.reset();
	}
}
