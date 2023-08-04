import type {
	EpisodeStatus,
	SerializedModel
} from "models";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const saveStub: SinonStub<unknown[], Promise<string | undefined>> = sinon.stub(),
			removeStub: SinonStub = sinon.stub(),
			listBySeriesStub: SinonStub<string[], Promise<EpisodeMock[]>> = sinon.stub(),
			listByUnscheduledStub: SinonStub = sinon.stub(),
			findStub: SinonStub<string[], Promise<EpisodeMock>> = sinon.stub(),
			totalCountStub: SinonStub = sinon.stub(),
			countByStatusStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub<unknown[], Promise<string | undefined>> = sinon.stub(),
			fromJsonStub: SinonStub<[SerializedModel], EpisodeMock> = sinon.stub();

let episodes: EpisodeMock[] = [],
		removeAllOk: boolean;

export default class EpisodeMock {
	public toJson: SinonStub;

	public statusDateDisplay = "";

	public statusWarning: "" | "warning" = "";

	public unverifiedDisplay: "" | "Unverified" = "";

	public constructor(public readonly id: string | null,
						public episodeName: string | null,
						public status: EpisodeStatus,
						public statusDate: string,
						public readonly seriesId: string | null = null,
						public unverified = false,
						public unscheduled = false,
						public sequence = 0,
						public readonly seriesName: string | undefined = undefined,
						public readonly programName: string | undefined = undefined) {
		this.toJson = sinon.stub().returns({});
		saveStub.resetHistory();
		removeStub.reset();
	}

	public static get listBySeries(): SinonStub<string[], Promise<EpisodeMock[]>> {
		return listBySeriesStub.returns(Promise.resolve(this.episodes));
	}

	public static get listByUnscheduled(): SinonStub<unknown[], Promise<EpisodeMock[]>> {
		return listByUnscheduledStub.returns(Promise.resolve([{}]));
	}

	public static get find(): SinonStub<string[], Promise<EpisodeMock>> {
		return findStub.returns(Promise.resolve(new EpisodeMock(String(findStub.args[0]), "test-episode", "", "")));
	}

	public static get totalCount(): SinonStub<unknown[], Promise<number>> {
		return totalCountStub.returns(Promise.resolve(1));
	}

	public static get countByStatus(): SinonStub<string[], Promise<number>> {
		return countByStatusStub.withArgs("Watched").returns(Promise.resolve(1));
	}

	public static get removeAll(): SinonStub<unknown[], Promise<string | undefined>> {
		if (!removeAllOk) {
			removeAllStub.returns(Promise.resolve("Force failed"));
		}

		return removeAllStub;
	}

	public static get fromJson(): SinonStub<[SerializedModel], EpisodeMock> {
		return fromJsonStub.returns(new EpisodeMock(null, null, "", ""));
	}

	public static get episodes(): EpisodeMock[] {
		return episodes;
	}

	public static set episodes(items: EpisodeMock[]) {
		episodes = items;
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