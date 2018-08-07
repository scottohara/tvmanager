import sinon, {SinonStub} from "sinon";
import {NowShowingEnum} from "models";

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
			listByProgramStub: SinonStub = sinon.stub(),
			listByNowShowingStub: SinonStub = sinon.stub(),
			findStub: SinonStub = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub = sinon.stub(),
			fromJsonStub: SinonStub = sinon.stub();

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

	public static get listByProgram(): SinonStub {
		return listByProgramStub.yields(this.series);
	}

	public static get listByNowShowing(): SinonStub {
		return listByNowShowingStub.yields(this.series);
	}

	public static get listByStatus(): SinonStub {
		return sinon.stub();
	}

	public static get listByIncomplete(): SinonStub {
		return sinon.stub();
	}

	public static get find(): SinonStub {
		return findStub.yields(new SeriesMock(String(findStub.args[0]), "test-series", null, null));
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
		return fromJsonStub.returns(new SeriesMock(null, null, null, null));
	}

	public static get NOW_SHOWING(): NowShowingEnum {
		return {1: "Mondays"};
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

	public static get series(): Series[] {
		return series;
	}

	public static set series(items: Series[]) {
		series = items;
	}
}