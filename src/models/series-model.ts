import * as API from "~/services/api-service";
import type { EpisodeStatus, JsonSeries, JsonSeriesWithCounts } from "~/models";
import Base from "~/models/base-model";
import ProgressBar from "~/components/progressbar";

export default class Series extends Base {
	public progressBarDisplay!: string;

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private readonly progressBar: ProgressBar;

	private missedCount = 0;

	public constructor(
		public id: number | null,
		public seriesName: string,
		public nowShowing: number | null,
		public programId: number,
		public programName?: string,
		episodeCount = 0,
		watchedCount = 0,
		recordedCount = 0,
		expectedCount = 0,
		missedCount = 0,
		public statusWarningCount = 0,
	) {
		super();
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
		this.setMissedCount(missedCount);

		// Make getters enumerable
		["statusWarning", "nowShowingDisplay"].forEach(
			this.makeEnumerable.bind(this),
		);
	}

	public get statusWarning(): "" | "warning" {
		return this.statusWarningCount > 0 ? "warning" : "";
	}

	public get nowShowingDisplay(): string {
		const NOW_SHOWING: Record<number, string> = {
			1: "Mondays",
			2: "Tuesdays",
			3: "Wednesdays",
			4: "Thursdays",
			5: "Fridays",
			6: "Saturdays",
			7: "Sundays",
			8: "Daily",
		};

		return Number(this.nowShowing) > 0
			? NOW_SHOWING[Number(this.nowShowing)]
			: "Not Showing";
	}

	public static async list(programId: number): Promise<Series[]> {
		const series = await API.get<JsonSeriesWithCounts[]>(
			`/programs/${programId}/series`,
		);

		return series.map(this.fromJson);
	}

	public static async scheduled(): Promise<Series[]> {
		const series = await API.get<JsonSeriesWithCounts[]>("/scheduled");

		return series.map(this.fromJson);
	}

	public static async listByStatus(status: EpisodeStatus): Promise<Series[]> {
		const series = await API.get<JsonSeriesWithCounts[]>(`/reports/${status}`);

		return series.map(this.fromJson);
	}

	public static async incomplete(): Promise<Series[]> {
		const series = await API.get<JsonSeriesWithCounts[]>("/reports/incomplete");

		return series.map(this.fromJson);
	}

	public static async find(id: number): Promise<Series> {
		const {
			id: seriesId,
			name,
			now_showing,
			program_id,
		} = await API.get<JsonSeries>(`/series/${id}`);

		return new Series(seriesId, name, now_showing, program_id);
	}

	public static async count(): Promise<number> {
		return API.get<number>("/series/count");
	}

	private static fromJson({
		id,
		name,
		now_showing,
		program_id,
		program_name,
		episode_count,
		watched_count,
		recorded_count,
		expected_count,
		missed_count,
		status_warning_count,
	}: JsonSeriesWithCounts): Series {
		return new Series(
			id,
			name,
			now_showing,
			program_id,
			program_name,
			episode_count,
			watched_count,
			recorded_count,
			expected_count,
			missed_count,
			status_warning_count,
		);
	}

	public async save(): Promise<void> {
		const series: Omit<JsonSeries, "id"> = {
			name: this.seriesName,
			now_showing: this.nowShowing,
			program_id: Number(this.programId),
		};

		if (null === this.id) {
			const { id } = await API.create<JsonSeries>(
				`/programs/${this.programId}/series`,
				series,
			);

			this.id = id;
		} else {
			await API.update(`/series/${this.id}`, series);
		}
	}

	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await API.destroy(`/series/${this.id}`);

			// Clear the instance properties
			this.id = null;
			this.seriesName = "";
			this.nowShowing = null;
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

	private setMissedCount(count: number): void {
		const PERCENT = 100,
			MISSED = 3;

		this.missedCount = count;

		// Calculate the percentage of episodes that are missed
		const missedPercent = (this.missedCount / this.episodeCount) * PERCENT;

		// Update the missed section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(MISSED, {
			label: this.missedCount,
			percent: missedPercent,
			style: "missed",
		});
	}
}
