/**
 * @file (Models) Episode
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module models/episode-model
 * @requires models/base-model
 * @requires uuid
 */
import {
	EpisodeStatus,
	PersistedEpisode,
	SerializedEpisode
} from "models";
import Base from "models/base-model";
import { v4 } from "uuid";

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
	public constructor(public id: string | null,
						public episodeName: string | null,
						public status: EpisodeStatus,
						public statusDate: string,
						private seriesId: string | null,
						public unverified: boolean = false,
						public unscheduled: boolean = false,
						public sequence: number = 0,
						public readonly seriesName: string | undefined = undefined,
						public readonly programName: string | undefined = undefined) {
		super();

		// Make getters enumerable
		["statusDateDisplay", "statusWarning", "unverifiedDisplay"].forEach(this.makeEnumerable.bind(this));
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
			episodeList = await Promise.all((await (await this.db).episodesStore.listBySeries(seriesId)).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ep.SeriesID, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesName, ep.ProgramName)));
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
			episodeList = await Promise.all((await (await this.db).episodesStore.listByUnscheduled()).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ep.SeriesID, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesName, ep.ProgramName)));
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

		return new Episode(EpisodeID, Name, Status, StatusDate, SeriesID, "true" === Unverified, "true" === Unscheduled, Sequence);
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
			errorMessage = `Episode.removeAll: ${(error as Error).message}`;
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
		return new Episode(episode.id, episode.episodeName, episode.status, episode.statusDate, episode.seriesId, episode.unverified, episode.unscheduled, episode.sequence);
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
			this.id = v4();
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
	 * @property {String} statusDateDisplay - the formatted status date
	 * @desc Returns the date to display under the episode name in any episode lists
	 */
	public get statusDateDisplay(): string {
		return ("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && this.statusDate ? new Date(this.statusDate).toDateString() : "";
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @property {String} statusWarning - a CSS class name
	 * @desc Returns a CSS class name to use to indicate that an expected episode has passed it's expected date
	 */
	public get statusWarning(): "warning" | "" {
		return "Expected" === this.status && this.statusDate && new Date(this.statusDate) < new Date() ? "warning" : "";
	}

	/**
	 * @memberof Episode
	 * @this Episode
	 * @instance
	 * @property {String} unverifiedDisplay - a CSS class name
	 * @desc Returns a CSS class name to control the status icon displayed next to an episode in any episode lists
	 */
	public get unverifiedDisplay(): "Unverified" | "" {
		return "Watched" !== this.status && this.unverified ? "Unverified" : "";
	}
}