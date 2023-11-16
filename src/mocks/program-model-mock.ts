import type { SerializedModel } from "~/models";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const saveStub: SinonStub<
		unknown[],
		Promise<string | undefined>
	> = sinon.stub(),
	removeStub: SinonStub = sinon.stub(),
	listStub: SinonStub = sinon.stub(),
	findStub: SinonStub<string[], Promise<ProgramMock>> = sinon.stub(),
	countStub: SinonStub = sinon.stub(),
	removeAllStub: SinonStub<
		unknown[],
		Promise<string | undefined>
	> = sinon.stub(),
	fromJsonStub: SinonStub<[SerializedModel], ProgramMock> = sinon.stub();

let programs: ProgramMock[] = [],
	removeAllOk: boolean;

export default class ProgramMock {
	public progressBarDisplay = "";

	public programGroup = "";

	public toJson: SinonStub;

	public setProgramName: SinonStub = sinon.stub();

	public setEpisodeCount: SinonStub = sinon.stub();

	public setWatchedCount: SinonStub = sinon.stub();

	public setRecordedCount: SinonStub = sinon.stub();

	public setExpectedCount: SinonStub = sinon.stub();

	public constructor(
		public readonly id: string | null,
		public programName: string | null,
		public seriesCount = 0,
		public readonly episodeCount = 0,
		public readonly watchedCount = 0,
		public readonly recordedCount = 0,
		public readonly expectedCount = 0,
	) {
		this.toJson = sinon.stub().returns({});
		saveStub.resetHistory();
		removeStub.reset();
	}

	public static get list(): SinonStub<unknown[], Promise<ProgramMock[]>> {
		return listStub.returns(Promise.resolve(this.programs));
	}

	public static get find(): SinonStub<string[], Promise<ProgramMock>> {
		return findStub.returns(
			Promise.resolve(
				new ProgramMock(String(findStub.args[0]), "test-program"),
			),
		);
	}

	public static get count(): SinonStub<unknown[], Promise<number>> {
		return countStub.returns(Promise.resolve(1));
	}

	public static get removeAll(): SinonStub<
		unknown[],
		Promise<string | undefined>
	> {
		if (!removeAllOk) {
			removeAllStub.returns(Promise.resolve("Force failed"));
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub<[SerializedModel], ProgramMock> {
		return fromJsonStub.returns(new ProgramMock("", ""));
	}

	public static get programs(): ProgramMock[] {
		return programs;
	}

	public static set programs(items: ProgramMock[]) {
		programs = items;
	}

	public get save(): SinonStub<unknown[], Promise<string | undefined>> {
		return saveStub.returns(Promise.resolve("1"));
	}

	public get remove(): SinonStub<unknown[], Promise<void>> {
		return removeStub;
	}

	public static removeAllOk(): void {
		removeAllOk = true;
	}

	public static removeAllFail(): void {
		removeAllOk = false;
	}
}
