/**
 * @file (Models) Episode
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/episode-model
 * @requires models/base-model
 * @requires uuid/v4
 */
import {
	EpisodeStatus,
	PersistedEpisode,
	SerializedEpisode
} from "models";
import Base from "models/base-model";
import uuid from "uuid/v4";

/**
 * @class Episode
 * @classdesc Model for episodes
 * @extends Base
 * @this Episode
 * @property {String} id - unique identifier of the episode
 * @property {String} episodeName - name of the episode
 * @property {String} status - the episode status
 * @property {String} statusDate - the date of the episode status
 * @property {Boolean} unverified - indicates whether the episode is verified or not
 * @property {Boolean} unscheduled - indicates if the episode is unscheduled
 * @property {Number} sequence - order in which the episode appears in the series
 * @property {String} seriesId - unique identifier of the series that the episode belongs to
 * @property {String} seriesName - name of the series that the episode belongs to
 * @property {String} programName - name of the program that the episode belongs to
 * @property {String} statusDateDisplay - the date to display under the episode name in any episode lists
 * @property {String} statusWarning - a CSS class name to use to indicate that an expected episode has passed it's expected date
 * @property {String} unverifiedDisplay - a partial CSS class name to control the status icon displayed next to an episode in any episode lists
 * @param {String} id - unique identifier of the episode
 * @param {String} episodeName - name of the episode
 * @param {String} status - the episode status
 * @param {String} statusDate - the date of the episode status
 * @param {Boolean} unverified - indicates whether the episode is verified or not
 * @param {Boolean} unscheduled - indicates if the episode is unscheduled
 * @param {Number} sequence - order in which the episode appears in the series
 * @param {String} seriesId - unique identifier of the series that the episode belongs to
 * @param {String} seriesName - name of the series that the episode belongs to
 * @param {String} programName - name of the program that the episode belongs to
 */
export default class Episode extends Base {
	public status!: EpisodeStatus;

	public statusDateDisplay = "";

	public statusWarning: "warning" | "" = "";

	public unverifiedDisplay: "Unverified" | "" = "";

	public unverified = false;

	public constructor(public id: string | null,
						public episodeName: string | null, status: EpisodeStatus,
						public statusDate: string, unverified = false,
						public unscheduled: boolean = false,
						public sequence: number = 0,
						private seriesId: string | null,
						public readonly seriesName?: string,
						public readonly programName?: string) {
		super();
		this.setStatus(status);
		this.setUnverified(unverified);
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method listBySeries
	 * @desc Retrieves the list of episodes for a given series
	 * @param {String} seriesId - the unique identifier of the series to retrieve
	 */
	public static async listBySeries(seriesId: string): Promise<Episode[]> {
		let episodeList: Episode[] = [];

		try {
			episodeList = await Promise.all((await (await this.db).episodesStore.listBySeries(seriesId)).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesID, ep.SeriesName, ep.ProgramName)));
		} catch (_e) {
			// No op
		}

		return episodeList;
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method listByUnscheduled
	 * @desc Retrieves the list of episodes that are unscheduled
	 */
	public static async listByUnscheduled(): Promise<Episode[]> {
		let episodeList: Episode[] = [];

		try {
			episodeList = await Promise.all((await (await this.db).episodesStore.listByUnscheduled()).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesID, ep.SeriesName, ep.ProgramName)));
		} catch (_e) {
			// No op
		}

		return episodeList;
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method find
	 * @desc Retrieves a specific episode by it's unique identifier
	 * @param {String} id - unique identifier of the episode
	 */
	public static async find(id: string): Promise<Episode> {
		let	EpisodeID: string | null = null,
				Name: string | null = null,
				Status: EpisodeStatus = "",
				StatusDate = "",
				Unverified = "false",
				Unscheduled = "false",
				Sequence = 0,
				SeriesID: string | null = null;

		try {
			const ep: PersistedEpisode | undefined = await (await this.db).episodesStore.find(id);

			if (undefined !== ep) {
				({ EpisodeID, Name, Status, StatusDate, Unverified, Unscheduled, Sequence, SeriesID } = ep);
			}
		} catch (_e) {
			// No op
		}

		return new Episode(EpisodeID, Name, Status, StatusDate, "true" === Unverified, "true" === Unscheduled, Sequence, SeriesID);
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method totalCount
	 * @desc Retrieves the total number of episodes in the database
	 */
	public static async totalCount(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).episodesStore.totalCount();
		} catch (_e) {
			// No op
		}

		return count;
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method countByStatus
	 * @desc Retrieves the total number of episodes with a given status in the database
	 * @param {String} status - the episode status
	 */
	public static async countByStatus(status: EpisodeStatus): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).episodesStore.countByStatus(status);
		} catch (_e) {
			// No op
		}

		return count;
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method removeAll
	 * @desc Removes all episodes from the database
	 */
	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).episodesStore.removeAll();
		} catch (error) {
			errorMessage = `Episode.removeAll: ${error.message}`;
		}

		return errorMessage;
	}

	/**
	 * @memberof Episode
	 * @static
	 * @method fromJson
	 * @desc Returns a new Episode object populated from a JSON representation
	 * @param {Object} episode - a JSON representation of an episode
	 * @returns {Episode} the Episode object
	 */
	public static fromJson(episode: SerializedEpisode): Episode {
		return new Episode(episode.id, episode.episodeName, episode.status, episode.statusDate, episode.unverified, episode.unscheduled, episode.sequence, episode.seriesId);
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method save
	 * @desc Saves the episode to the database
	 */
	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new episode to be added), generate a new UUID
		if (null === this.id) {
			this.id = uuid();
		}

		try {
			await (await this.db).episodesStore.save({
				EpisodeID: this.id,
				Name: String(this.episodeName),
				Status: this.status,
				StatusDate: this.statusDate,
				Unverified: this.unverified ? "true" : "false",
				Unscheduled: this.unscheduled ? "true" : "false",
				Sequence: this.sequence,
				SeriesID: String(this.seriesId)
			});

			return this.id;
		} catch (_e) {
			// No op
		}

		return undefined;
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method remove
	 * @desc Deletes the episode from the database
	 */
	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await (await this.db).episodesStore.remove(this.id);

			// Clear the instance properties
			this.id = null;
			this.episodeName = null;
			this.seriesId = null;
		}
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method toJson
	 * @desc Returns a JSON representation of the episode
	 * @returns {Object} the JSON representation of the episode
	 */
	public toJson(): SerializedEpisode {
		return {
			id: this.id,
			episodeName: this.episodeName,
			seriesId: this.seriesId,
			status: this.status,
			statusDate: this.statusDate,
			unverified: this.unverified,
			unscheduled: this.unscheduled,
			sequence: this.sequence,
			type: "Episode"
		};
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method setStatus
	 * @desc Sets the status of the episode
	 * @param {String} status - the episode status
	 */
	public setStatus(status: EpisodeStatus): void {
		this.status = status;

		// Refresh the status date display and status warning based on the current status
		this.setStatusDate(this.statusDate);
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method setUnverified
	 * @desc Sets the unverified flag for the episode
	 * @param {Boolean} unverified - indicates whether the episode is verified or not
	 */
	public setUnverified(unverified: boolean): void {
		this.unverified = unverified;

		// Refresh the unverified display based on the current unverified flag
		if ("Watched" !== this.status && this.unverified) {
			this.unverifiedDisplay = "Unverified";
		} else {
			this.unverifiedDisplay = "";
		}
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @method setStatusDate
	 * @desc Sets the status date of the episode
	 * @param {String} statusDate - the date of the episode status
	 */
	public setStatusDate(statusDate: string): void {
		// Helper function to ensure date parts are zero-padded as required
		function leftPad(value: number | string): string {
			const MIN_LENGTH = 2,
						paddedValue = `0${value}`;

			return paddedValue.substr(paddedValue.length - MIN_LENGTH);
		}

		this.statusDate = statusDate;

		// Refresh the status date display based on the current status and date
		if (("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && "" !== this.statusDate) {
			this.statusDateDisplay = `(${this.statusDate})`;
		} else {
			this.statusDateDisplay = "";
		}

		/*
		 * Recalculate the status warning based on the current status and date
		 * The warning is used to highlight any expected episodes that are on or past their expected date
		 * Note: As the status date only captures day & month (no year), a date more than 3 months in the past is considered to be a future date
		 */
		this.statusWarning = "";
		if ("Expected" === this.status && "" !== this.statusDate) {
			/*
			 * TempStatusDate is the status date in "MMDD" format
			 * endMonth is the end of the warning range (3 months ago).
			 *  - in Jan, Feb or Mar, need to cross the year boundary (eg. Jan - 3 months = Oct; Feb - 3 month = Nov; Mar - 3 months = Dec)
			 *  - otherwise it's just a simple subtraction of three months
			 * start/end is the period in "MMDD" format
			 */
			const today: Date = new Date(),
						months: {[month: string]: string;} = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" },
						parts: string[] = this.statusDate.split("-"),
						tempStatusDate: string = months[parts[1]] + parts[0],
						APRIL = 3,
						NINE_MONTHS = 10,
						THREE_MONTHS = 2,
						endMonth = String(today.getMonth() < APRIL ? NINE_MONTHS + today.getMonth() : today.getMonth() - THREE_MONTHS),
						start: string = leftPad(today.getMonth() + 1) + leftPad(today.getDate()),
						end: string = leftPad(endMonth) + leftPad(today.getDate());

			// In Jan, Feb or Mar, it's an OR operation (less than start OR greater than end)
			if (today.getMonth() < APRIL) {
				this.statusWarning = tempStatusDate <= start || tempStatusDate >= end ? "warning" : "";
			} else {
				// Otherwise it's an AND operation (less that start AND greater than end)
				this.statusWarning = tempStatusDate <= start && tempStatusDate >= end ? "warning" : "";
			}
		}
	}
}