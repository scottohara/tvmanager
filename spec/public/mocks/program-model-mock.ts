import sinon, { SinonStub } from "sinon";
import { SerializedModel } from "models";

const saveStub: SinonStub<void[], Promise<string | undefined>> = sinon.stub(),
			removeStub: SinonStub = sinon.stub(),
			listStub: SinonStub = sinon.stub(),
			findStub: SinonStub<string[], Promise<ProgramMock>> = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub<void[], Promise<string | undefined>> = sinon.stub(),
			fromJsonStub: SinonStub<[SerializedModel], ProgramMock> = sinon.stub();

let	programs: ProgramMock[] = [],
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

	public static get list(): SinonStub<void[], Promise<ProgramMock[]>> {
		return listStub.returns(Promise.resolve(this.programs));
	}

	public static get find(): SinonStub<string[], Promise<ProgramMock>> {
		return findStub.returns(Promise.resolve(new ProgramMock(String(findStub.args[0]), "test-program")));
	}

	public static get count(): SinonStub<void[], Promise<number>> {
		return countStub.returns(Promise.resolve(1));
	}

	public static get removeAll(): SinonStub<void[], Promise<string | undefined>> {
		if (!removeAllOK) {
			removeAllStub.returns(Promise.resolve("Force failed"));
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub<[SerializedModel], ProgramMock> {
		return fromJsonStub.returns(new ProgramMock("", ""));
	}

	public get save(): SinonStub<void[], Promise<string | undefined>> {
		return saveStub.returns(Promise.resolve("1"));
	}

	public get remove(): SinonStub<void[], Promise<void>> {
		return removeStub;
	}

	public static removeAllOK(): void {
		removeAllOK = true;
	}

	public static removeAllFail(): void {
		removeAllOK = false;
	}

	public static get programs(): ProgramMock[] {
		return programs;
	}

	public static set programs(items: ProgramMock[]) {
		programs = items;
	}
}