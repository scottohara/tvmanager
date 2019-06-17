import {
	EpisodeStatus,
	FindCallback,
	ListCallback,
	RemoveCallback,
	SaveCallback,
	SerializedModel
} from "models";
import sinon, { SinonStub } from "sinon";

interface Episode {
	id: string | null;
	episodeName: string | null;
	status: EpisodeStatus;
	statusWarning: "" | "warning";
}

const saveStub: SinonStub = sinon.stub().yields(999),
			removeStub: SinonStub = sinon.stub(),
			listBySeriesStub: SinonStub<[string, ListCallback], Episode[]> = sinon.stub(),
			listByUnscheduledStub: SinonStub = sinon.stub(),
			findStub: SinonStub<[string, FindCallback], EpisodeMock> = sinon.stub(),
			totalCountStub: SinonStub = sinon.stub(),
			countByStatusStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub<[RemoveCallback], string> = sinon.stub(),
			fromJsonStub: SinonStub<[SerializedModel], EpisodeMock> = sinon.stub();

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

	public static get listBySeries(): SinonStub<[string, ListCallback], Episode[]> {
		return listBySeriesStub.yields(this.episodes);
	}

	public static get listByUnscheduled(): SinonStub<void[], object[]> {
		return listByUnscheduledStub.yields([{}]);
	}

	public static get find(): SinonStub<[string, FindCallback], EpisodeMock> {
		return findStub.yields(new EpisodeMock(String(findStub.args[0]), "test-episode", "", ""));
	}

	public static get totalCount(): SinonStub<void[], number> {
		return totalCountStub.yields(1);
	}

	public static get countByStatus(): SinonStub<string[], number> {
		return countByStatusStub.withArgs("Watched").yields(1);
	}

	public static get removeAll(): SinonStub<[RemoveCallback], string> {
		if (removeAllOK) {
			removeAllStub.yields();
		} else {
			removeAllStub.yields("Force failed");
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub<[SerializedModel], EpisodeMock> {
		return fromJsonStub.returns(new EpisodeMock(null, null, "", ""));
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

	public static get episodes(): Episode[] {
		return episodes;
	}

	public static set episodes(items: Episode[]) {
		episodes = items;
	}
}