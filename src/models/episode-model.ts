import * as API from "~/services/api-service";
import type {
	EpisodeStatus,
	JsonEpisode,
	JsonEpisodeWithNames,
} from "~/models";
import Base from "~/models/base-model";

export default class Episode extends Base {
	public constructor(
		public id: number | null,
		public episodeName: string,
		public status: EpisodeStatus,
		public statusDate: string,
		private readonly seriesId: number,
		public unverified = false,
		public unscheduled = false,
		public sequence = 0,
		public readonly seriesName?: string,
		public readonly programName?: string,
	) {
		super();

		// Make getters enumerable
		["statusDateDisplay", "statusWarning", "unverifiedDisplay"].forEach(
			this.makeEnumerable.bind(this),
		);
	}

	public get statusDateDisplay(): string {
		return ("recorded" === this.status ||
			"expected" === this.status ||
			"missed" === this.status ||
			this.unscheduled) &&
			this.statusDate
			? new Date(this.statusDate).toDateString()
			: "";
	}

	public get statusWarning(): "" | "warning" {
		return "expected" === this.status &&
			this.statusDate &&
			new Date(this.statusDate) < new Date()
			? "warning"
			: "";
	}

	public get unverifiedDisplay(): "" | "Unverified" {
		return "watched" !== this.status && this.unverified ? "Unverified" : "";
	}

	public static async list(seriesId: number): Promise<Episode[]> {
		const episodes = await API.get<JsonEpisodeWithNames[]>(
			`/series/${seriesId}/episodes`,
		);

		return episodes.map(this.fromJson);
	}

	public static async unscheduled(): Promise<Episode[]> {
		const episodes = await API.get<JsonEpisodeWithNames[]>("/unscheduled");

		return episodes.map(this.fromJson);
	}

	public static async find(id: number): Promise<Episode> {
		const {
			id: episodeId,
			name,
			status,
			status_date,
			unverified,
			unscheduled,
			sequence,
			series_id,
		} = await API.get<JsonEpisode>(`/episodes/${id}`);

		return new Episode(
			episodeId,
			name,
			status,
			status_date,
			series_id,
			unverified,
			unscheduled,
			sequence,
		);
	}

	public static async count(): Promise<number> {
		return API.get<number>("/episodes/count");
	}

	public static async countByStatus(status: EpisodeStatus): Promise<number> {
		return API.get<number>(`/episodes/${status}/count`);
	}

	private static fromJson({
		id,
		name,
		status,
		status_date,
		unverified,
		unscheduled,
		sequence,
		series_id,
		series_name,
		program_name,
	}: JsonEpisodeWithNames): Episode {
		return new Episode(
			id,
			name,
			status,
			status_date,
			series_id,
			unverified,
			unscheduled,
			sequence,
			series_name,
			program_name,
		);
	}

	public async save(): Promise<void> {
		if ("watched" === this.status) {
			this.statusDate = "";
		}

		const episode: Omit<JsonEpisode, "id"> = {
			name: this.episodeName,
			status: this.status,
			status_date: this.statusDate,
			unverified: this.unverified,
			unscheduled: this.unscheduled,
			sequence: this.sequence,
			series_id: this.seriesId,
		};

		if (null === this.id) {
			const { id } = await API.create<JsonEpisode>(
				`/series/${this.seriesId}/episodes`,
				episode,
			);

			this.id = id;
		} else {
			await API.update(`/episodes/${this.id}`, episode);
		}
	}

	public async remove(): Promise<void> {
		// Only proceed if there is an ID to delete
		if (null !== this.id) {
			await API.destroy(`/episodes/${this.id}`);

			// Clear the instance properties
			this.id = null;
			this.episodeName = "";
		}
	}
}
