import type {
	EpisodeStatus,
	PersistedEpisode,
	SerializedEpisode
} from "models";
import Base from "models/base-model";
import { v4 } from "uuid";

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

	public get statusDateDisplay(): string {
		return ("Recorded" === this.status || "Expected" === this.status || "Missed" === this.status || this.unscheduled) && this.statusDate ? new Date(this.statusDate).toDateString() : "";
	}

	public get statusWarning(): "" | "warning" {
		return "Expected" === this.status && this.statusDate && new Date(this.statusDate) < new Date() ? "warning" : "";
	}

	public get unverifiedDisplay(): "" | "Unverified" {
		return "Watched" !== this.status && this.unverified ? "Unverified" : "";
	}

	public static async listBySeries(seriesId: string): Promise<Episode[]> {
		let episodeList: Episode[] = [];

		try {
			episodeList = await Promise.all((await (await this.db).episodesStore.listBySeries(seriesId)).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ep.SeriesID, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesName, ep.ProgramName)));
		} catch {
			// No op
		}

		return episodeList;
	}

	public static async listByUnscheduled(): Promise<Episode[]> {
		let episodeList: Episode[] = [];

		try {
			episodeList = await Promise.all((await (await this.db).episodesStore.listByUnscheduled()).map((ep: PersistedEpisode): Episode => new Episode(ep.EpisodeID, ep.Name, ep.Status, ep.StatusDate, ep.SeriesID, "true" === ep.Unverified, "true" === ep.Unscheduled, ep.Sequence, ep.SeriesName, ep.ProgramName)));
		} catch {
			// No op
		}

		return episodeList;
	}

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
			const ep = await (await this.db).episodesStore.find(id);

			if (undefined !== ep) {
				({ EpisodeID, Name, Status, StatusDate, Unverified, Unscheduled, Sequence, SeriesID } = ep);
			}
		} catch {
			// No op
		}

		return new Episode(EpisodeID, Name, Status, StatusDate, SeriesID, "true" === Unverified, "true" === Unscheduled, Sequence);
	}

	public static async totalCount(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).episodesStore.totalCount();
		} catch {
			// No op
		}

		return count;
	}

	public static async countByStatus(status: EpisodeStatus): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).episodesStore.countByStatus(status);
		} catch {
			// No op
		}

		return count;
	}

	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).episodesStore.removeAll();
		} catch (error: unknown) {
			errorMessage = `Episode.removeAll: ${(error as Error).message}`;
		}

		return errorMessage;
	}

	public static fromJson(episode: SerializedEpisode): Episode {
		return new Episode(episode.id, episode.episodeName, episode.status, episode.statusDate, episode.seriesId, episode.unverified, episode.unscheduled, episode.sequence);
	}

	public async save(): Promise<string | undefined> {
		// If an id has not been set (ie. is a new episode to be added), generate a new UUID
		this.id ??= v4();

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
		} catch {
			// No op
		}

		return undefined;
	}

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
}