import BaseMock from "~/mocks/base-model-mock";
import type { EpisodeStatus } from "~/models";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const listStub: SinonStub<[number], Promise<EpisodeMock[]>> = sinon.stub(),
	unscheduledStub: SinonStub<[], Promise<EpisodeMock[]>> = sinon.stub(),
	countStub: SinonStub<[], Promise<number>> = sinon.stub(),
	countByStatusStub: SinonStub<[EpisodeStatus], Promise<number>> = sinon.stub(),
	saveStub: SinonStub<[], Promise<void>> = sinon.stub(),
	removeStub: SinonStub<[], Promise<void>> = sinon.stub();

let episodes: EpisodeMock[] = [];

export default class EpisodeMock extends BaseMock {
	public statusDateDisplay = "";

	public statusWarning: "" | "warning" = "";

	public unverifiedDisplay: "" | "Unverified" = "";

	public constructor(
		public readonly id: number | null,
		public episodeName: string,
		public status: EpisodeStatus,
		public statusDate: string,
		public readonly seriesId: number,
		public unverified = false,
		public unscheduled = false,
		public sequence = 0,
		public readonly seriesName?: string,
		public readonly programName?: string,
	) {
		super();
	}

	public static get list(): SinonStub<[number], Promise<EpisodeMock[]>> {
		return this.stub(listStub, this.episodes);
	}

	public static get unscheduled(): SinonStub<[], Promise<EpisodeMock[]>> {
		return this.stub(unscheduledStub, this.episodes);
	}

	public static get count(): SinonStub<[], Promise<number>> {
		return this.stub(countStub, 1);
	}

	public static get countByStatus(): SinonStub<
		[EpisodeStatus],
		Promise<number>
	> {
		return this.stub(countByStatusStub.withArgs("watched"), 1);
	}

	public static get episodes(): EpisodeMock[] {
		return episodes;
	}

	public static set episodes(items: EpisodeMock[]) {
		episodes = items;
	}

	public get save(): SinonStub<[], Promise<void>> {
		return EpisodeMock.stub(saveStub, undefined);
	}

	public get remove(): SinonStub<[], Promise<void>> {
		return EpisodeMock.stub(removeStub, undefined);
	}

	public static reset(): void {
		listStub.reset();
		unscheduledStub.reset();
		countStub.reset();
		countByStatusStub.reset();
		saveStub.reset();
		removeStub.reset();
	}
}
