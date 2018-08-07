import sinon, {SinonStub} from "sinon";
import {EpisodeStatus} from "models";

interface Episode {
	id: string | null;
	episodeName: string | null;
	status: EpisodeStatus;
	statusWarning: "" | "warning";
}

const saveStub: SinonStub = sinon.stub().yields(999),
			removeStub: SinonStub = sinon.stub(),
			listBySeriesStub: SinonStub = sinon.stub(),
			listByUnscheduledStub: SinonStub = sinon.stub(),
			findStub: SinonStub = sinon.stub(),
			totalCountStub: SinonStub = sinon.stub(),
			countByStatusStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub = sinon.stub(),
			fromJsonStub: SinonStub = sinon.stub();

let episodes: Episode[] = [],
		removeAllOK: boolean;

export default class EpisodeMock {
	public statusDateDisplay = "";

	public statusWarning: "warning" | "" = "";

	public unverifiedDisplay: "Unverified" | "" = "";

	public toJson: SinonStub;

	public setStatus: SinonStub = sinon.stub();

	public setUnverified: SinonStub = sinon.stub();

	public setStatusDate: SinonStub = sinon.stub();

	public constructor(public readonly id: string | null,
											public episodeName: string | null,
											public status: EpisodeStatus,
											public statusDate: string,
											public readonly unverified: boolean = false,
											public unscheduled: boolean = false,
											public sequence: number = 0,
											public readonly seriesId: string | null = null) {
		this.toJson = sinon.stub().returns({});
		saveStub.resetHistory();
		removeStub.reset();
	}

	public static get listBySeries(): SinonStub {
		return listBySeriesStub.yields(this.episodes);
	}

	public static get listByUnscheduled(): SinonStub {
		return listByUnscheduledStub.yields([{}]);
	}

	public static get find(): SinonStub {
		return findStub.yields(new EpisodeMock(String(findStub.args[0]), "test-episode", "", ""));
	}

	public static get totalCount(): SinonStub {
		return totalCountStub.yields(1);
	}

	public static get countByStatus(): SinonStub {
		return countByStatusStub.withArgs("Watched").yields(1);
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
		return fromJsonStub.returns(new EpisodeMock(null, null, "", ""));
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

	public static get episodes(): Episode[] {
		return episodes;
	}

	public static set episodes(items: Episode[]) {
		episodes = items;
	}
}