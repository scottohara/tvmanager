import type {
	EpisodeCounts,
	IDBStoreUpgrade,
	ProgramEpisodeCounts,
	ProgramsStore,
	ProgramsStoreObject,
	TVManagerDB
} from "stores";
import type {
	ModelType,
	PersistedProgram
} from "models";
import type { IDBPDatabase } from "idb";

const	upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		const store = db.createObjectStore("programs", { keyPath: "id" });

		store.createIndex("name", "name");
	}
];

// Orders programs by name
function byProgramName(a: PersistedProgram, b: PersistedProgram): number {
	return a.Name.localeCompare(b.Name, "en", { sensitivity: "base" });
}
function create(db: IDBPDatabase<TVManagerDB>): ProgramsStore {
	return {
		async list(): Promise<PersistedProgram[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						programs: PersistedProgram[] = await Promise.all((await txProgramsStore.index("name").getAll()).map(async ({ id, name }: ProgramsStoreObject): Promise<PersistedProgram> => {
							const series: EpisodeCounts[] = await Promise.all((await txSeriesStore.index("programId").getAllKeys(id)).map(async (seriesId: string): Promise<EpisodeCounts> => ({
											episodeCount: await txEpisodesStore.index("seriesId").count(seriesId),
											watchedCount: await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Watched", seriesId], ["Watched", seriesId])),
											recordedCount: await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Recorded", seriesId], ["Recorded", seriesId])),
											expectedCount: await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Expected", seriesId], ["Expected", seriesId]))
										}))),

										{
											seriesCount,
											episodeCount,
											watchedCount,
											recordedCount,
											expectedCount
										}: ProgramEpisodeCounts = series.reduce((counts: ProgramEpisodeCounts, seriesCounts: EpisodeCounts): ProgramEpisodeCounts => {
											counts.seriesCount++;
											counts.episodeCount += seriesCounts.episodeCount;
											counts.watchedCount += seriesCounts.watchedCount;
											counts.recordedCount += seriesCounts.recordedCount;
											counts.expectedCount += seriesCounts.expectedCount;

											return counts;
										}, {
											seriesCount: 0,
											episodeCount: 0,
											watchedCount: 0,
											recordedCount: 0,
											expectedCount: 0
										});

							return {
								ProgramID: id,
								Name: name,
								SeriesCount: seriesCount,
								EpisodeCount: episodeCount,
								WatchedCount: watchedCount,
								RecordedCount: recordedCount,
								ExpectedCount: expectedCount
							};
						}));

			return programs.sort(byProgramName);
		},

		async find(id): Promise<PersistedProgram | undefined> {
			const { id: ProgramID, name: Name } = await db.get("programs", id) as ProgramsStoreObject;

			return {
				ProgramID,
				Name
			};
		},

		async count(): Promise<number> {
			return db.count("programs");
		},

		async removeAll(): Promise<void> {
			return db.clear("programs");
		},

		async save({ ProgramID, Name }: PersistedProgram): Promise<void> {
			const tx = db.transaction(["programs", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("programs").put({ id: ProgramID, name: Name }),
				tx.objectStore("syncs").put({ type: "Program", id: ProgramID, action: "modified" })
			]);

			return tx.done;
		},

		async remove(id: string): Promise<void> {
			const tx = db.transaction(["programs", "series", "episodes", "syncs"], "readwrite"),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),
						txSyncStore = tx.objectStore("syncs"),

						episodeIds: Promise<string[]>[] = [],
						operations: Promise<unknown | [ModelType, string]>[] = [];

			for (const seriesId of await txSeriesStore.index("programId").getAllKeys(id)) {
				episodeIds.push(txEpisodesStore.index("seriesId").getAllKeys(seriesId));
				operations.push(txSyncStore.put({ type: "Series", id: seriesId, action: "deleted" }));
				operations.push(txSeriesStore.delete(seriesId));
			}

			for (const episodeId of (await Promise.all(episodeIds)).flat()) {
				operations.push(txSyncStore.put({ type: "Episode", id: episodeId, action: "deleted" }));
				operations.push(txEpisodesStore.delete(episodeId));
			}

			operations.push(txSyncStore.put({ type: "Program", id, action: "deleted" }));
			operations.push(txProgramsStore.delete(id));

			await Promise.all(operations);

			return tx.done;
		}
	};
}

export { upgradeTo, create };