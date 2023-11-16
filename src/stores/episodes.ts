import type { EpisodeStatus, PersistedEpisode } from "~/models";
import type {
	EpisodesStore,
	EpisodesStoreObject,
	IDBStoreUpgrade,
	ProgramsStoreObject,
	SeriesStoreObject,
	TVManagerDB,
} from "~/stores";
import type { IDBPDatabase } from "idb";

const upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		const store = db.createObjectStore("episodes", { keyPath: "id" });

		store.createIndex("seriesId", "seriesId");
		store.createIndex("status", ["status", "seriesId"]);
		store.createIndex("statusWarning", ["status", "seriesId", "statusDate"]);
		store.createIndex("unscheduled", "unscheduled");
	},
];

// Orders episodes by sequence then id
function bySequenceThenEpisodeId(
	a: PersistedEpisode,
	b: PersistedEpisode,
): number {
	const sequenceDiff = a.Sequence - b.Sequence;

	if (!sequenceDiff) {
		return a.EpisodeID.localeCompare(b.EpisodeID);
	}

	return sequenceDiff;
}

function create(db: IDBPDatabase<TVManagerDB>): EpisodesStore {
	return {
		async listBySeries(seriesId: string): Promise<PersistedEpisode[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),
				txProgramsStore = tx.objectStore("programs"),
				txSeriesStore = tx.objectStore("series"),
				txEpisodesStore = tx.objectStore("episodes"),
				episodes: PersistedEpisode[] = await Promise.all(
					(await txEpisodesStore.index("seriesId").getAll(seriesId)).map(
						async ({
							id,
							name,
							status,
							statusDate,
							unverified,
							unscheduled,
							sequence,
						}: EpisodesStoreObject): Promise<PersistedEpisode> => {
							const { name: seriesName, programId }: SeriesStoreObject =
									(await txSeriesStore.get(seriesId)) as SeriesStoreObject,
								{ name: programName }: ProgramsStoreObject =
									(await txProgramsStore.get(programId)) as ProgramsStoreObject;

							return {
								EpisodeID: id,
								Name: name,
								Status: status,
								StatusDate: statusDate,
								Unverified: Boolean(unverified).toString() as "false" | "true",
								Unscheduled: Boolean(unscheduled).toString() as
									| "false"
									| "true",
								Sequence: sequence,
								SeriesID: seriesId,
								SeriesName: seriesName,
								ProgramID: programId,
								ProgramName: programName,
							};
						},
					),
				);

			return episodes.sort(bySequenceThenEpisodeId);
		},

		async listByUnscheduled(): Promise<PersistedEpisode[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),
				txProgramsStore = tx.objectStore("programs"),
				txSeriesStore = tx.objectStore("series"),
				txEpisodesStore = tx.objectStore("episodes"),
				episodes: PersistedEpisode[] = await Promise.all(
					(await txEpisodesStore.index("unscheduled").getAll(1)).map(
						async ({
							id,
							name,
							status,
							statusDate,
							unverified,
							unscheduled,
							sequence,
							seriesId,
						}: EpisodesStoreObject): Promise<PersistedEpisode> => {
							const { name: seriesName, programId }: SeriesStoreObject =
									(await txSeriesStore.get(seriesId)) as SeriesStoreObject,
								{ name: programName }: ProgramsStoreObject =
									(await txProgramsStore.get(programId)) as ProgramsStoreObject;

							return {
								EpisodeID: id,
								Name: name,
								Status: status,
								StatusDate: statusDate,
								Unverified: Boolean(unverified).toString() as "false" | "true",
								Unscheduled: Boolean(unscheduled).toString() as
									| "false"
									| "true",
								Sequence: sequence,
								SeriesID: seriesId,
								SeriesName: seriesName,
								ProgramID: programId,
								ProgramName: programName,
							};
						},
					),
				);

			return episodes.sort((a: PersistedEpisode, b: PersistedEpisode): number =>
				a.StatusDate.localeCompare(b.StatusDate),
			);
		},

		async find(id: string): Promise<PersistedEpisode | undefined> {
			const {
				id: EpisodeID,
				name: Name,
				status: Status,
				statusDate,
				unverified,
				unscheduled,
				sequence: Sequence,
				seriesId: SeriesID,
			} = (await db.get("episodes", id)) as EpisodesStoreObject;

			return {
				EpisodeID,
				Name,
				Status,
				StatusDate: statusDate,
				Unverified: Boolean(unverified).toString() as "false" | "true",
				Unscheduled: Boolean(unscheduled).toString() as "false" | "true",
				Sequence,
				SeriesID,
			};
		},

		async totalCount(): Promise<number> {
			return db.count("episodes");
		},

		async countByStatus(status: EpisodeStatus): Promise<number> {
			return db.countFromIndex(
				"episodes",
				"status",
				IDBKeyRange.bound([status], [status, "~"]),
			);
		},

		async removeAll(): Promise<void> {
			return db.clear("episodes");
		},

		async save({
			EpisodeID,
			Name,
			SeriesID,
			Status,
			StatusDate,
			Unverified,
			Unscheduled,
			Sequence,
		}: PersistedEpisode): Promise<void> {
			const tx = db.transaction(["episodes", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("episodes").put({
					id: EpisodeID,
					name: Name,
					seriesId: SeriesID,
					status: Status,
					statusDate: "Watched" === Status ? "" : StatusDate,
					unverified: Number(JSON.parse(Unverified)),
					unscheduled: Number(JSON.parse(Unscheduled)),
					sequence: Sequence,
				}),
				tx
					.objectStore("syncs")
					.put({ type: "Episode", id: EpisodeID, action: "modified" }),
			]);

			return tx.done;
		},

		async remove(id: string): Promise<void> {
			const tx = db.transaction(["episodes", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("episodes").delete(id),
				tx.objectStore("syncs").put({ type: "Episode", id, action: "deleted" }),
			]);

			return tx.done;
		},
	};
}

export { upgradeTo, create };
