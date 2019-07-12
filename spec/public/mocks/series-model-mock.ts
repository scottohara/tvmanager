import {
	NowShowingEnum,
	SerializedModel
} from "models";
import sinon, { SinonStub } from "sinon";

const saveStub: SinonStub<void[], Promise<string | undefined>> = sinon.stub(),
			removeStub: SinonStub = sinon.stub(),
			listByProgramStub: SinonStub<string[], Promise<SeriesMock[]>> = sinon.stub(),
			listByNowShowingStub: SinonStub = sinon.stub(),
			findStub: SinonStub<string[], Promise<SeriesMock>> = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub<void[], Promise<string | undefined>> = sinon.stub(),
			fromJsonStub: SinonStub<[SerializedModel], SeriesMock> = sinon.stub();

let series: SeriesMock[] = [],
		removeAllOK: boolean;

export default class SeriesMock {
	public progressBarDisplay = "";

	public nowShowingDisplay = "";

	public statusWarning: "warning" | "" = "";

	public toJson: SinonStub;

	public setEpisodeCount: SinonStub = sinon.stub();

	public setWatchedCount: SinonStub = sinon.stub();

	public setRecordedCount: SinonStub = sinon.stub();

	public setExpectedCount: SinonStub = sinon.stub();

	public setStatusWarning: SinonStub = sinon.stub();

	public setNowShowing: SinonStub = sinon.stub();

	public constructor(public readonly id: string | null,
						public seriesName: string | null,
						public nowShowing: number | null,
						public programId: string | null,
						public programName?: string,
						public readonly episodeCount = 0,
						public readonly watchedCount = 0,
						public readonly recordedCount = 0,
						public readonly expectedCount = 0,
						public readonly _missedCount?: number,
						public readonly statusWarningCount = 0) {
		this.toJson = sinon.stub().returns({});
		saveStub.resetHistory();
		removeStub.reset();
	}

	public static get listByProgram(): SinonStub<string[], Promise<SeriesMock[]>> {
		return listByProgramStub.returns(Promise.resolve(this.series));
	}

	public static get listByNowShowing(): SinonStub<void[], Promise<SeriesMock[]>> {
		return listByNowShowingStub.returns(Promise.resolve(this.series));
	}

	public static get listByStatus(): SinonStub<string[], Promise<SeriesMock[]>> {
		return sinon.stub();
	}

	public static get listByIncomplete(): SinonStub<undefined[], Promise<SeriesMock[]>> {
		return sinon.stub();
	}

	public static get find(): SinonStub<string[], Promise<SeriesMock>> {
		return findStub.returns(Promise.resolve(new SeriesMock(String(findStub.args[0]), "test-series", null, null)));
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

	public static get fromJson(): SinonStub<[SerializedModel], SeriesMock> {
		return fromJsonStub.returns(new SeriesMock(null, null, null, null));
	}

	public static get NOW_SHOWING(): NowShowingEnum {
		return { 1: "Mondays" };
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

	public static get series(): SeriesMock[] {
		return series;
	}

	public static set series(items: SeriesMock[]) {
		series = items;
	}
}