import {
	FindCallback,
	ListCallback,
	NowShowingEnum,
	RemoveCallback,
	SaveCallback,
	SerializedModel
} from "models";
import sinon, { SinonStub } from "sinon";

interface Series {
	seriesName: string | null;
	nowShowing: number | null;
	programId: string | null;
	programName?: string;
	recordedCount?: number;
	expectedCount?: number;
}

const saveStub: SinonStub = sinon.stub().yields(999),
			removeStub: SinonStub = sinon.stub(),
			listByProgramStub: SinonStub<[string, ListCallback], Series[]> = sinon.stub(),
			listByNowShowingStub: SinonStub = sinon.stub(),
			findStub: SinonStub<[string, FindCallback], SeriesMock> = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub<[RemoveCallback], string> = sinon.stub(),
			fromJsonStub: SinonStub<[SerializedModel], SeriesMock> = sinon.stub();

let series: Series[] = [],
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

	public static get listByProgram(): SinonStub<[string, ListCallback], Series[]> {
		return listByProgramStub.yields(this.series);
	}

	public static get listByNowShowing(): SinonStub<void[], Series[]> {
		return listByNowShowingStub.yields(this.series);
	}

	public static get listByStatus(): SinonStub<[ListCallback, string], void> {
		return sinon.stub();
	}

	public static get listByIncomplete(): SinonStub<[ListCallback, string], void> {
		return sinon.stub();
	}

	public static get find(): SinonStub<[string, FindCallback], SeriesMock> {
		return findStub.yields(new SeriesMock(String(findStub.args[0]), "test-series", null, null));
	}

	public static get count(): SinonStub<void[], number> {
		return countStub.yields(1);
	}

	public static get removeAll(): SinonStub<[RemoveCallback], string> {
		if (removeAllOK) {
			removeAllStub.yields();
		} else {
			removeAllStub.yields("Force failed");
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub<[SerializedModel], SeriesMock> {
		return fromJsonStub.returns(new SeriesMock(null, null, null, null));
	}

	public static get NOW_SHOWING(): NowShowingEnum {
		return { 1: "Mondays" };
	}

	public get save(): SinonStub<SaveCallback[], number> {
		return saveStub;
	}

	public get remove(): SinonStub<void[], void> {
		return removeStub;
	}

	public static removeAllOK(): void {
		removeAllOK = true;
	}

	public static removeAllFail(): void {
		removeAllOK = false;
	}

	public static get series(): Series[] {
		return series;
	}

	public static set series(items: Series[]) {
		series = items;
	}
}