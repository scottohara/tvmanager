import * as API from "~/services/api-service";
import type { JsonProgram, JsonProgramWithCounts } from "~/models";
import Base from "~/models/base-model";
import ProgressBar from "~/components/progressbar";

export default class Program extends Base {
	public progressBarDisplay!: string;

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private readonly progressBar: ProgressBar;

	public constructor(
		public id: number | null,
		public programName: string,
		public seriesCount = 0,
		episodeCount = 0,
		watchedCount = 0,
		recordedCount = 0,
		expectedCount = 0,
	) {
		super();
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);

		// Make getters enumerable
		["programGroup"].forEach(this.makeEnumerable.bind(this));
	}

	public get programGroup(): string {
		return this.programName.substring(0, 1).toUpperCase();
	}

	public static async list(): Promise<Program[]> {
		const programs = await API.get<JsonProgramWithCounts[]>("/programs");

		return programs.map(
			({
				id,
				name,
				series_count,
				episode_count,
				watched_count,
				recorded_count,
				expected_count,
			}: JsonProgramWithCounts): Program =>
				new Program(
					id,
					name,
					series_count,
					episode_count,
					watched_count,
					recorded_count,
					expected_count,
				),
		);
	}

	public static async find(id: number): Promise<Program> {
		const { id: programId, name } = await API.get<JsonProgram>(
			`/programs/${id}`,
		);

		return new Program(programId, name);
	}

	public static async count(): Promise<number> {
		return API.get<number>("/programs/count");
	}

	public async save(): Promise<void> {
		const program: Omit<JsonProgram, "id"> = {
			name: this.programName,
		};

		if (null === this.id) {
			const { id } = await API.create<JsonProgram>("/programs", program);

			this.id = id;
		} else {
			await API.update(`/programs/${this.id}`, program);
		}
	}

	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await API.destroy(`/programs/${this.id}`);

			// Clear the instance properties
			this.id = null;
			this.programName = "";
		}
	}

	public setEpisodeCount(count: number): void {
		this.episodeCount = count;

		// Update the progress bar with the new total
		this.progressBar.setTotal(this.episodeCount);

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	public setWatchedCount(count: number): void {
		this.watchedCount = count;

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	public setRecordedCount(count: number): void {
		const PERCENT = 100,
			RECORDED = 1;

		this.recordedCount = count;

		// Calculate the percentage of episodes that are recorded
		const recordedPercent = (this.recordedCount / this.episodeCount) * PERCENT;

		// Update the recorded section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(RECORDED, {
			label: this.recordedCount,
			percent: recordedPercent,
			style: "recorded",
		});
	}

	public setExpectedCount(count: number): void {
		const PERCENT = 100,
			EXPECTED = 2;

		this.expectedCount = count;

		// Calculate the percentage of episodes that are expected
		const expectedPercent = (this.expectedCount / this.episodeCount) * PERCENT;

		// Update the expected section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(EXPECTED, {
			label: this.expectedCount,
			percent: expectedPercent,
			style: "expected",
		});
	}

	private setWatchedProgress(): void {
		const PERCENT = 100,
			WATCHED = 0,
			// Calculate the percentage of episodes that are watched
			watchedPercent = (this.watchedCount / this.episodeCount) * PERCENT;

		// Update the watched section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(WATCHED, {
			label: this.watchedCount,
			percent: watchedPercent,
			style: "watched",
		});
	}
}
