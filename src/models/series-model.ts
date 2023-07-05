import type {
	EpisodeStatus,
	PersistedSeries,
	SerializedSeries
} from "models";
import Base from "models/base-model";
import ProgressBar from "components/progressbar";

export default class Series extends Base {
	public progressBarDisplay!: string;

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private readonly progressBar: ProgressBar;

	private missedCount = 0;

	public constructor(public id: string | null,
						public seriesName: string | null,
						public nowShowing: number | null,
						public programId: string | null,
						public programName?: string, episodeCount = 0, watchedCount = 0, recordedCount = 0, expectedCount = 0, missedCount = 0,
						public statusWarningCount = 0) {
		super();
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
		this.setMissedCount(missedCount);

		// Make getters enumerable
		["statusWarning", "nowShowingDisplay"].forEach(this.makeEnumerable.bind(this));
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
			8: "Daily"
		};

		return Number(this.nowShowing) > 0 ? NOW_SHOWING[Number(this.nowShowing)] : "Not Showing";
	}

	public static async listByProgram(programId: string): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByProgram(programId)).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch {
			// No op
		}

		return seriesList;
	}

	public static async listByNowShowing(): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByNowShowing()).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch {
			// No op
		}

		return seriesList;
	}

	public static async listByStatus(status: EpisodeStatus): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByStatus(status)).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch {
			// No op
		}

		return seriesList;
	}

	public static async listByIncomplete(): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByIncomplete()).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch {
			// No op
		}

		return seriesList;
	}

	public static async find(id: string): Promise<Series> {
		let	SeriesID: string | null = null,
				Name: string | null = null,
				NowShowing: number | null = null,
				ProgramID: string | null = null;

		try {
			const series = await (await this.db).seriesStore.find(id);

			if (undefined !== series) {
				({ SeriesID, Name, NowShowing, ProgramID } = series);
			}
		} catch {
			// No op
		}

		return new Series(SeriesID, Name, NowShowing, ProgramID);
	}

	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).seriesStore.count();
		} catch {
			// No op
		}

		return count;
	}

	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).seriesStore.removeAll();
		} catch (error: unknown) {
			errorMessage = `Series.removeAll: ${(error as Error).message}`;
		}

		return errorMessage;
	}

	public static fromJson(series: SerializedSeries): Series {
		return new Series(series.id, series.seriesName, series.nowShowing, series.programId);
	}

	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new series to be added), generate a new UUID
		this.id ??= crypto.randomUUID();

		try {
			await (await this.db).seriesStore.save({
				SeriesID: this.id,
				Name: String(this.seriesName),
				NowShowing: this.nowShowing,
				ProgramID: String(this.programId)
			});

			return this.id;
		} catch {
			// No op
		}

		return undefined;
	}

	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await (await this.db).seriesStore.remove(this.id);

			// Clear the instance properties
			this.id = null;
			this.seriesName = null;
			this.nowShowing = null;
			this.programId = null;
		}
	}

	public toJson(): SerializedSeries {
		return {
			id: this.id,
			seriesName: this.seriesName,
			nowShowing: this.nowShowing,
			programId: this.programId,
			type: "Series"
		};
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
		let recordedPercent = 0;

		this.recordedCount = count;

		// Calculate the percentage of episodes that are recorded
		recordedPercent = this.recordedCount / this.episodeCount * PERCENT;

		// Update the recorded section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(RECORDED, {
			label: this.recordedCount,
			percent: recordedPercent,
			style: "recorded"
		});
	}

	public setExpectedCount(count: number): void {
		const	PERCENT = 100,
					EXPECTED = 2;
		let expectedPercent = 0;

		this.expectedCount = count;

		// Calculate the percentage of episodes that are expected
		expectedPercent = this.expectedCount / this.episodeCount * PERCENT;

		// Update the expected section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(EXPECTED, {
			label: this.expectedCount,
			percent: expectedPercent,
			style: "expected"
		});
	}

	private setWatchedProgress(): void {
		const PERCENT = 100,
					WATCHED = 0;
		let watchedPercent = 0;

		// Calculate the percentage of episodes that are watched
		watchedPercent = this.watchedCount / this.episodeCount * PERCENT;

		// Update the watched section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(WATCHED, {
			label: this.watchedCount,
			percent: watchedPercent,
			style: "watched"
		});
	}

	private setMissedCount(count: number): void {
		const PERCENT = 100,
					MISSED = 3;
		let missedPercent = 0;

		this.missedCount = count;

		// Calculate the percentage of episodes that are missed
		missedPercent = this.missedCount / this.episodeCount * PERCENT;

		// Update the missed section of the progress bar, and regenerate the progress bar HTML
		this.progressBarDisplay = this.progressBar.setSection(MISSED, {
			label: this.missedCount,
			percent: missedPercent,
			style: "missed"
		});
	}
}