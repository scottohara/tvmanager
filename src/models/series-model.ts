/**
 * @file (Models) Series
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/series-model
 * @requires models/base-model
 * @requires components/progressbar
 * @requires uuid/v4
 */
import {
	EpisodeStatus,
	NowShowingEnum,
	PersistedSeries,
	SerializedSeries
} from "models";
import Base from "models/base-model";
import ProgressBar from "components/progressbar";
import uuid from "uuid/v4";

/**
 * @class Series
 * @classdesc Model for series
 * @extends Base
 * @this Series
 * @property {String} id - unique identifier of the series
 * @property {String} seriesName - name of the series
 * @property {Number} nowShowing - the now showing status
 * @property {String} programId - unique identifier of the program that the series belongs to
 * @property {String} programName - name of the program that the series belongs to
 * @property {Number} episodeCount - the number of episodes for the series
 * @property {Number} watchedCount - the number of watched episodes for the series
 * @property {Number} recordedCount - the number of recorded episodes for the series
 * @property {Number} expectedCount - the number of expected episodes for the series
 * @property {Number} missedCount - the number of missed episodes for the series
 * @property {Number} statusWarningCount - the number of expected episodes past their status date for the series
 * @property {ProgressBar} progressBar - progress bar component to generate the progress bar HTML
 * @property {String} nowShowingDisplay - the display value of the now showing status, use for grouping in the schedule view
 * @property {String} progressBarDisplay - HTML of the progress bar to display under the series name in any series lists
 * @property {String} statusWarning - a CSS class name to use to indicate that one or more expected episodes for the series have passed their expected date
 * @param {String} id - unique identifier of the series
 * @param {String} seriesName - name of the series
 * @param {Number} nowShowing - the now showing status
 * @param {String} programId - unique identifier of the program that the series belongs to
 * @param {String} programName - name of the program that the series belongs to
 * @param {Number} episodeCount - the number of episodes for the series
 * @param {Number} watchedCount - the number of watched episodes for the series
 * @param {Number} recordedCount - the number of recorded episodes for the series
 * @param {Number} expectedCount - the number of expected episodes for the series
 * @param {Number} missedCount - the number of missed episodes for the series
 * @param {Number} statusWarningCount - the number of expected episodes past their status date for the series
 */
export default class Series extends Base {
	public progressBarDisplay!: string;

	public nowShowingDisplay = "";

	public statusWarning: "warning" | "" = "";

	public episodeCount = 0;

	public watchedCount = 0;

	public recordedCount = 0;

	public expectedCount = 0;

	public statusWarningCount = 0;

	public nowShowing!: number | null;

	private readonly progressBar: ProgressBar;

	private missedCount = 0;

	public constructor(public id: string | null,
						public seriesName: string | null, nowShowing: number | null,
						public programId: string | null,
						public programName?: string, episodeCount = 0, watchedCount = 0, recordedCount = 0, expectedCount = 0, missedCount = 0, statusWarningCount = 0) {
		super();
		this.setNowShowing(nowShowing);
		this.progressBar = new ProgressBar(episodeCount, []);
		this.setEpisodeCount(episodeCount);
		this.setWatchedCount(watchedCount);
		this.setRecordedCount(recordedCount);
		this.setExpectedCount(expectedCount);
		this.setMissedCount(missedCount);
		this.setStatusWarning(statusWarningCount);
	}

	/**
	 * @memberof Series
	 * @static
	 * @method listByProgram
	 * @desc Retrieves a list of series for a given program
	 * @param {String} programId - the unique identifier of the program to retrieve
	 */
	public static async listByProgram(programId: string): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByProgram(programId)).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch (_e) {
			// No op
		}

		return seriesList;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method listByNowShowing
	 * @desc Retrieves a list of series that are currently showing, or have recorded/expected episodes
	 */
	public static async listByNowShowing(): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByNowShowing()).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch (_e) {
			// No op
		}

		return seriesList;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method listByStatus
	 * @desc Retrieves a list of series that have one or more episodes with a given status
	 * @param {String} status - the episode status
	 */
	public static async listByStatus(status: EpisodeStatus): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByStatus(status)).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch (_e) {
			// No op
		}

		return seriesList;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method listByIncomplete
	 * @desc Retrieves a list of series that have some, but not all, episodes watched
	 */
	public static async listByIncomplete(): Promise<Series[]> {
		let seriesList: Series[] = [];

		try {
			seriesList = await Promise.all((await (await this.db).seriesStore.listByIncomplete()).map((series: PersistedSeries): Series => new Series(series.SeriesID, series.Name, series.NowShowing, series.ProgramID, series.ProgramName, series.EpisodeCount, series.WatchedCount, series.RecordedCount, series.ExpectedCount, series.MissedCount, series.StatusWarningCount)));
		} catch (_e) {
			// No op
		}

		return seriesList;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method find
	 * @desc Retrieves a specific series by it's unique identifier
	 * @param {String} id - unique identifier of the series
	 */
	public static async find(id: string): Promise<Series> {
		let	SeriesID: string | null = null,
				Name: string | null = null,
				NowShowing: number | null = null,
				ProgramID: string | null = null;

		try {
			const series: PersistedSeries | undefined = await (await this.db).seriesStore.find(id);

			if (undefined !== series) {
				({ SeriesID, Name, NowShowing, ProgramID } = series);
			}
		} catch (_e) {
			// No op
		}

		return new Series(SeriesID, Name, NowShowing, ProgramID);
	}

	/**
	 * @memberof Series
	 * @static
	 * @method count
	 * @desc Retrieves a count of series
	 */
	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).seriesStore.count();
		} catch (_e) {
			// No op
		}

		return count;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method removeAll
	 * @desc Removes all series from the database
	 */
	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).seriesStore.removeAll();
		} catch (error) {
			errorMessage = `Series.removeAll: ${error.message}`;
		}

		return errorMessage;
	}

	/**
	 * @memberof Series
	 * @static
	 * @method fromJson
	 * @desc Returns a new Series object populated from a JSON representation
	 * @param {Object} series - a JSON representation of a series
	 * @returns {Series} the Series object
	 */
	public static fromJson(series: SerializedSeries): Series {
		return new Series(series.id, series.seriesName, series.nowShowing, series.programId);
	}

	/**
	 * @memberof Series
	 * @static
	 * @enum NOW_SHOWING
	 * @desc Enumerated list of Now Showing values
	 */
	public static get NOW_SHOWING(): NowShowingEnum {
		return {
			0: "Not Showing",
			1: "Mondays",
			2: "Tuesdays",
			3: "Wednesdays",
			4: "Thursdays",
			5: "Fridays",
			6: "Saturdays",
			7: "Sundays",
			8: "Daily"
		};
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method save
	 * @desc Saves the series to the database
	 */
	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new series to be added), generate a new UUID
		if (null === this.id) {
			this.id = uuid();
		}

		try {
			await (await this.db).seriesStore.save({
				SeriesID: this.id,
				Name: String(this.seriesName),
				NowShowing: this.nowShowing,
				ProgramID: String(this.programId)
			});

			return this.id;
		} catch (_e) {
			// No op
		}

		return undefined;
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method remove
	 * @desc Deletes the series from the database
	 */
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

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method toJson
	 * @desc Returns a JSON representation of the series
	 * @returns {Object} the JSON representation of the series
	 */
	public toJson(): SerializedSeries {
		return {
			id: this.id,
			seriesName: this.seriesName,
			nowShowing: this.nowShowing,
			programId: this.programId,
			type: "Series"
		};
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setEpisodeCount
	 * @desc Sets the number of episodes for the series
	 * @param {Number} count - the number of episodes for the series
	 */
	public setEpisodeCount(count: number): void {
		this.episodeCount = count;

		// Update the progress bar with the new total
		this.progressBar.setTotal(this.episodeCount);

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setWatchedCount
	 * @desc Sets the number of watched episodes for the series
	 * @param {Number} count - the number of watched episodes for the series
	 */
	public setWatchedCount(count: number): void {
		this.watchedCount = count;

		// Regenerate the progress bar HTML
		this.setWatchedProgress();
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setRecordedCount
	 * @desc Sets the number of recorded episodes for the series
	 * @param {Number} count - the number of recorded episodes for the series
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
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setExpectedCount
	 * @desc Sets the number of expected episodes for the series
	 * @param {Number} count - the number of expected episodes for the series
	 */
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

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setStatusWarning
	 * @desc Sets the number of expected episodes past their status date for the series
	 * @param {Number} count - the number of expected episodes past their status date for the series
	 */
	public setStatusWarning(count: number): void {
		this.statusWarningCount = count;

		// If there are one or more episodes with a warning, highlight the series with a warning also
		if (this.statusWarningCount > 0) {
			this.statusWarning = "warning";
		}	else {
			this.statusWarning = "";
		}
	}

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setNowShowing
	 * @desc Sets the now showing status of the series
	 * @param {Number} nowShowing - the now showing status of the series
	 */
	public setNowShowing(nowShowing: number | null = 0): void {
		const showing = Number(nowShowing);

		// If the value passed (or defaulted) is "Not Showing", clear the property
		if (0 === showing) {
			this.nowShowing = null;
		} else {
			// Otherwise set it to the passed value
			this.nowShowing = showing;
		}

		// Update the now showing display value
		this.nowShowingDisplay = Series.NOW_SHOWING[showing];
	}

	/**
	 * @memberof Series
	 * @this Series
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

	/**
	 * @memberof Series
	 * @this Series
	 * @instance
	 * @method setMissedCount
	 * @desc Sets the number of missed episodes for the series
	 * @param {Number} count - the number of missed episodes for the series
	 */
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