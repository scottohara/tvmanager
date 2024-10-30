import BaseMock from "~/mocks/base-model-mock";
import type { EpisodeStatus } from "~/models";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const listStub: SinonStub<[number], Promise<SeriesMock[]>> = sinon.stub(),
	scheduledStub: SinonStub<[], Promise<SeriesMock[]>> = sinon.stub(),
	listByStatusStub: SinonStub<
		[EpisodeStatus],
		Promise<SeriesMock[]>
	> = sinon.stub(),
	incompleteStub: SinonStub<[], Promise<SeriesMock[]>> = sinon.stub(),
	countStub: SinonStub<[], Promise<number>> = sinon.stub(),
	saveStub: SinonStub<[], Promise<void>> = sinon.stub(),
	removeStub: SinonStub<[], Promise<void>> = sinon.stub();

let series: SeriesMock[] = [];

export default class SeriesMock extends BaseMock {
	public progressBarDisplay = "";

	public nowShowingDisplay = "";

	public statusWarning: "" | "warning" = "";

	public setEpisodeCount: SinonStub = sinon.stub();

	public setWatchedCount: SinonStub = sinon.stub();

	public setRecordedCount: SinonStub = sinon.stub();

	public setExpectedCount: SinonStub = sinon.stub();

	public constructor(
		public readonly id: number | null,
		public seriesName: string,
		public nowShowing: number | null,
		public programId: number,
		public programName?: string,
		public readonly episodeCount = 0,
		public readonly watchedCount = 0,
		public readonly recordedCount = 0,
		public readonly expectedCount = 0,
		public readonly missedCount?: number,
		public statusWarningCount = 0,
	) {
		super();
	}

	public static get list(): SinonStub<[number], Promise<SeriesMock[]>> {
		return this.stub(listStub, this.series);
	}

	public static get scheduled(): SinonStub<[], Promise<SeriesMock[]>> {
		return this.stub(scheduledStub, this.series);
	}

	public static get listByStatus(): SinonStub<
		[EpisodeStatus],
		Promise<SeriesMock[]>
	> {
		return this.stub(listByStatusStub, this.series);
	}

	public static get incomplete(): SinonStub<[], Promise<SeriesMock[]>> {
		return this.stub(incompleteStub, this.series);
	}

	public static get count(): SinonStub<[], Promise<number>> {
		return this.stub(countStub, 1);
	}

	public static get series(): SeriesMock[] {
		return series;
	}

	public static set series(items: SeriesMock[]) {
		series = items;
	}

	public get save(): SinonStub<[], Promise<void>> {
		return SeriesMock.stub(saveStub, undefined);
	}

	public get remove(): SinonStub<[], Promise<void>> {
		return SeriesMock.stub(removeStub, undefined);
	}

	public static reset(): void {
		listStub.reset();
		scheduledStub.reset();
		listByStatusStub.reset();
		incompleteStub.reset();
		countStub.reset();
		saveStub.reset();
		removeStub.reset();
	}
}
