/**
 * @file (Models) Program
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/program-model
 * @requires models/base-model
 * @requires components/progressbar
 * @requires uuid
 */
import {
	PersistedProgram,
	SerializedProgram
} from "models";
import Base from "models/base-model";
import ProgressBar from "components/progressbar";
import { v4 } from "uuid";

/**
 * @class Program
 * @classdesc Model for programs
 * @extends Base
 * @this Program
 * @property {String} id - unique identifier of the program
 * @property {String} programName - name of the program
 * @property {Number} seriesCount - the number of series for the program
 * @property {Number} episodeCount - the number of episodes for the program
 * @property {Number} watchedCount - the number of watched episodes for the program
 * @property {Number} recordedCount - the number of recorded episodes for the program
 * @property {Number} expectedCount - the number of expected episodes for the program
 * @property {ProgressBar} progressBar - progress bar component to generate the progress bar HTML
 * @property {String} programGroup - the first letter of the program name
 * @property {String} progressBarDisplay - HTML of the progress bar to display under the program name in any program lists
 * @param {String} id - unique identifier of the program
 * @param {String} programName - name of the program
 * @param {Number} seriesCount - the number of series for the program
 * @param {Number} episodeCount - the number of episodes for the program
 * @param {Number} watchedCount - the number of watched episodes for the program
 * @param {Number} recordedCount - the number of recorded episodes for the program
 * @param {Number} expectedCount - the number of expected episodes for the program
 */
export default class Program extends Base {
	public programName: string | null = null;

	public progressBarDisplay!: string;

	public programGroup = "";

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	private readonly progressBar: ProgressBar;

	public constructor(public id: string | null, programName: string | null,
						public seriesCount: number = 0, episodeCount = 0, watchedCount = 0, recordedCount = 0, expectedCount = 0) {
		super();
		this.setProgramName(programName);
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
	}

	/**
	 * @memberof Program
	 * @static
	 * @method list
	 * @desc Retrieves a list of programs
	 */
	public static async list(): Promise<Program[]> {
		let programList: Program[] = [];

		try {
			programList = await Promise.all((await (await this.db).programsStore.list()).map((prog: PersistedProgram): Program => new Program(prog.ProgramID, prog.Name, prog.SeriesCount, prog.EpisodeCount, prog.WatchedCount, prog.RecordedCount, prog.ExpectedCount)));
		} catch (_e) {
			// No op
		}

		return programList;
	}

	/**
	 * @memberof Program
	 * @static
	 * @method find
	 * @desc Retrieves a specific program by it's unique identifier
	 * @param {String} id - unique identifier of the program
	 */
	public static async find(id: string): Promise<Program> {
		let ProgramID: string | null = null,
				Name: string | null = null;

		try {
			const prog: PersistedProgram | undefined = await (await this.db).programsStore.find(id);

			if (undefined !== prog) {
				({ ProgramID, Name } = prog);
			}
		} catch (_e) {
			// No op
		}

		return new Program(ProgramID, Name);
	}

	/**
	 * @memberof Program
	 * @static
	 * @method count
	 * @desc Retrieves a count of programs
	 */
	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).programsStore.count();
		} catch (_e) {
			// No op
		}

		return count;
	}

	/**
	 * @memberof Program
	 * @static
	 * @method removeAll
	 * @desc Removes all programs from the database
	 */
	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).programsStore.removeAll();
		} catch (error) {
			errorMessage = `Program.removeAll: ${(error as Error).message}`;
		}

		return errorMessage;
	}

	/**
	 * @memberof Program
	 * @static
	 * @method fromJson
	 * @desc Returns a new Program object populated from a JSON representation
	 * @param {Object} program - a JSON representation of a program
	 * @returns {Program} the Program object
	 */
	public static fromJson(program: SerializedProgram): Program {
		return new Program(program.id, program.programName);
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method save
	 * @desc Saves the program to the database
	 */
	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new program to be added), generate a new UUID
		if (null === this.id) {
			this.id = v4();
		}

		try {
			await (await this.db).programsStore.save({
				ProgramID: this.id,
				Name: String(this.programName)
			});

			return this.id;
		} catch (_e) {
			// No op
		}

		return undefined;
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method remove
	 * @desc Deletes the program from the database
	 */
	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await (await this.db).programsStore.remove(this.id);

			// Clear the instance properties
			this.id = null;
			this.programName = null;
		}
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method toJson
	 * @desc Returns a JSON representation of the program
	 * @returns {Object} the JSON representation of the program
	 */
	public toJson(): SerializedProgram {
		return {
			id: this.id,
			programName: this.programName,
			type: "Program"
		};
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setProgramName
	 * @desc Sets the name of the program
	 * @param {String} programName - name of the program
	 */
	public setProgramName(programName: string | null): void {
		this.programName = programName;

		// Recalculate the program group based on the first letter of the program name
		this.programGroup = null === programName ? "" : programName.substring(0, 1).toUpperCase();
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setEpisodeCount
	 * @desc Sets the number of episodes for the program
	 * @param {Number} count - the number of episodes for the program
	 */
	public setEpisodeCount(count: number): void {
		this.episodeCount = count;

		// Update the progress bar with the new total
		this.progressBar.setTotal(this.episodeCount);

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setWatchedCount
	 * @desc Sets the number of watched episodes for the program
	 * @param {Number} count - the number of watched episodes for the program
	 */
	public setWatchedCount(count: number): void {
		this.watchedCount = count;

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setRecordedCount
	 * @desc Sets the number of recorded episodes for the program
	 * @param {Number} count - the number of recorded episodes for the program
	 */
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

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setExpectedCount
	 * @desc Sets the number of expected episodes for the program
	 * @param {Number} count - the number of expected episodes for the program
	 */
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

	/**
	 * @memberof Program
	 * @this Program
	 * @instance
	 * @method setWatchedProgress
	 * @desc Regenerates the progress bar HTML after setting the episode or watched count
	 */
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