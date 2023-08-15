import type {
	PersistedProgram,
	SerializedProgram
} from "~/models";
import Base from "~/models/base-model";
import ProgressBar from "~/components/progressbar";

export default class Program extends Base {
	public progressBarDisplay!: string;

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private readonly progressBar: ProgressBar;

	public constructor(public id: string | null,
						public programName: string | null,
						public seriesCount = 0, episodeCount = 0, watchedCount = 0, recordedCount = 0, expectedCount = 0) {
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
		return this.programName?.substring(0, 1).toUpperCase() ?? "";
	}

	public static async list(): Promise<Program[]> {
		let programList: Program[] = [];

		try {
			programList = await Promise.all((await (await this.db).programsStore.list()).map((prog: PersistedProgram): Program => new Program(prog.ProgramID, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount)));
		} catch {
			// No op
		}

		return programList;
	}

	public static async find(id: string): Promise<Program> {
		let ProgramID: string | null = null,
				Name: string | null = null;

		try {
			const prog = await (await this.db).programsStore.find(id);

			if (undefined !== prog) {
				({ ProgramID, Name } = prog);
			}
		} catch {
			// No op
		}

		return new Program(ProgramID, Name);
	}

	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).programsStore.count();
		} catch {
			// No op
		}

		return count;
	}

	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).programsStore.removeAll();
		} catch (error: unknown) {
			errorMessage = `Program.removeAll: ${(error as Error).message}`;
		}

		return errorMessage;
	}

	public static fromJson(program: SerializedProgram): Program {
		return new Program(program.id, program.programName);
	}

	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new program to be added), generate a new UUID
		this.id ??= crypto.randomUUID();

		try {
			await (await this.db).programsStore.save({
				ProgramID: this.id,
				Name: String(this.programName)
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
			await (await this.db).programsStore.remove(this.id);

			// Clear the instance properties
			this.id = null;
			this.programName = null;
		}
	}

	public toJson(): SerializedProgram {
		return {
			id: this.id,
			programName: this.programName,
			type: "Program"
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
		const PERCENT = 100,
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
}