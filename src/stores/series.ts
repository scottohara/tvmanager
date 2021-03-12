import {
	EpisodeStatus,
	ModelType,
	PersistedSeries
} from "models";
import {
	EpisodesStoreObject,
	IDBStoreUpgrade,
	ProgramsStoreObject,
	SeriesStore,
	SeriesStoreObject,
	TVManagerDB
} from "stores";
import {
	IDBPDatabase,
	IDBPObjectStore,
	StoreNames
} from "idb";

const upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		const store: IDBPObjectStore<TVManagerDB, StoreNames<TVManagerDB>[], "series"> = db.createObjectStore("series", { keyPath: "id" });

		store.createIndex("programId", "programId");
		store.createIndex("nowShowing", "nowShowing");
	}
];

// Orders series by name
function bySeriesName(a: PersistedSeries, b: PersistedSeries): number {
	return a.Name.localeCompare(b.Name, "en", { sensitivity: "base" });
}

// Orders series by now showing then program name
function byNowShowingThenProgramNameThenSeriesName(a: PersistedSeries, b: PersistedSeries): number {
	let diff: number;

	diff = String(a.NowShowing).localeCompare(String(b.NowShowing), "en", { numeric: true });

	if (!diff) {
		diff = String(a.ProgramName).localeCompare(String(b.ProgramName), "en", { sensitivity: "base" });
	}

	if (!diff) {
		diff = String(a.Name).localeCompare(String(b.Name), "en", { sensitivity: "base" });
	}

	return diff;
}

// Orders series by program name then series name
function byProgramNameThenSeriesName(a: PersistedSeries, b: PersistedSeries): number {
	const programNameDiff = String(a.ProgramName).localeCompare(String(b.ProgramName), "en", { sensitivity: "base" });

	if (!programNameDiff) {
		return a.Name.localeCompare(b.Name, "en", { sensitivity: "base" });
	}

	return programNameDiff;
}

function create(db: IDBPDatabase<TVManagerDB>): SeriesStore {
	return {
		async listByProgram(programId: string): Promise<PersistedSeries[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						series: PersistedSeries[] = await Promise.all((await txSeriesStore.index("programId").getAll(programId)).map(async ({ id, name, nowShowing }: SeriesStoreObject): Promise<PersistedSeries> => {
							const { name: ProgramName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject,
										EpisodeCount: number = await txEpisodesStore.index("seriesId").count(id),
										WatchedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Watched", id], ["Watched", id])),
										RecordedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Recorded", id], ["Recorded", id])),
										ExpectedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Expected", id], ["Expected", id]));

							return {
								SeriesID: id,
								Name: name,
								ProgramID: programId,
								ProgramName,
								NowShowing: nowShowing,
								EpisodeCount,
								WatchedCount,
								RecordedCount,
								ExpectedCount
							};
						}));

			return series.sort(bySeriesName);
		},

		async listByNowShowing(): Promise<PersistedSeries[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						series: Set<string> = new Set(await txSeriesStore.index("nowShowing").getAllKeys()),

						today = new Date(),
						year = new Intl.DateTimeFormat("en-AU", { year: "numeric" }).format(today),
						month = new Intl.DateTimeFormat("en-AU", { month: "2-digit" }).format(today),
						day = new Intl.DateTimeFormat("en-AU", { day: "2-digit" }).format(today);

			// Get set of series now showing, or with at least one recorded or expected episode
			(await txEpisodesStore.index("status").getAll(IDBKeyRange.bound(["Recorded"], ["Recorded", "~"]))).forEach((episode: EpisodesStoreObject): Set<string> => series.add(episode.seriesId));
			(await txEpisodesStore.index("status").getAll(IDBKeyRange.bound(["Expected"], ["Expected", "~"]))).forEach((episode: EpisodesStoreObject): Set<string> => series.add(episode.seriesId));

			const list: PersistedSeries[] = await Promise.all([...series].map(async (id: string): Promise<PersistedSeries> => {
				const { name, programId, nowShowing }: SeriesStoreObject = await txSeriesStore.get(id) as SeriesStoreObject,
							{ name: programName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject,
							EpisodeCount: number = await txEpisodesStore.index("seriesId").count(id),
							WatchedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Watched", id], ["Watched", id])),
							RecordedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Recorded", id], ["Recorded", id])),
							ExpectedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Expected", id], ["Expected", id])),
							StatusWarningCount: number = await txEpisodesStore.index("statusWarning").count(IDBKeyRange.bound(["Expected", id, ""], ["Expected", id, `${year}-${month}-${day}`], true));

				return {
					SeriesID: id,
					Name: name,
					ProgramID: programId,
					ProgramName: programName,
					NowShowing: nowShowing,
					EpisodeCount,
					WatchedCount,
					RecordedCount,
					ExpectedCount,
					StatusWarningCount
				};
			}));

			return list.sort(byNowShowingThenProgramNameThenSeriesName);
		},

		async listByStatus(status: EpisodeStatus): Promise<PersistedSeries[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						series: Map<string, number> = new Map<string, number>();

			// Get set of series with at least one episode in the specified status
			(await txEpisodesStore.index("status").getAll(IDBKeyRange.bound([status], [status, "~"]))).forEach((episode: EpisodesStoreObject): void => {
				let count: number | undefined = series.get(episode.seriesId);

				if (undefined === count) {
					count = 0;
				}

				series.set(episode.seriesId, count + 1);
			});

			const list: PersistedSeries[] = await Promise.all([...series].map(async ([id, statusCount]: [string, number]): Promise<PersistedSeries> => {
				const { name, programId, nowShowing }: SeriesStoreObject = await txSeriesStore.get(id) as SeriesStoreObject,
							{ name: programName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject,
							EpisodeCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound([status, id], [status, id]));

				return {
					SeriesID: id,
					Name: name,
					ProgramID: programId,
					ProgramName: programName,
					NowShowing: nowShowing,
					EpisodeCount,
					[`${status}Count`]: statusCount
				};
			}));

			return list.sort(byProgramNameThenSeriesName);
		},

		async listByIncomplete(): Promise<PersistedSeries[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						series: Map<string, { episodeCount: number; watchedCount: number; }> = new Map<string, { episodeCount: number; watchedCount: number; }>(),

						// Get the unique set of series with at least one watched episode
						watchedSeries: Set<string> = new Set(await Promise.all((await txEpisodesStore.index("status").getAll(IDBKeyRange.bound(["Watched"], ["Watched", "~"]))).map(({ seriesId }: EpisodesStoreObject): string => seriesId)));

			// Filter out any series where all episodes are watched
			await Promise.all([...watchedSeries].map(async (seriesId: string): Promise<void> => {
				const episodeCount: number = await txEpisodesStore.index("seriesId").count(seriesId),
							watchedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Watched", seriesId], ["Watched", seriesId]));

				if (episodeCount > watchedCount) {
					series.set(seriesId, { episodeCount, watchedCount });
				}
			}));

			const list: PersistedSeries[] = await Promise.all([...series].map(async ([id, { episodeCount, watchedCount }]: [string, { episodeCount: number; watchedCount: number; }]): Promise<PersistedSeries> => {
				const { name, programId, nowShowing }: SeriesStoreObject = await txSeriesStore.get(id) as SeriesStoreObject,
							{ name: programName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject,
							RecordedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Recorded", id], ["Recorded", id])),
							ExpectedCount: number = await txEpisodesStore.index("status").count(IDBKeyRange.bound(["Expected", id], ["Expected", id]));

				return {
					SeriesID: id,
					Name: name,
					ProgramID: programId,
					ProgramName: programName,
					NowShowing: nowShowing,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount,
					ExpectedCount
				};
			}));

			return list.sort(byProgramNameThenSeriesName);
		},

		async find(id: string): Promise<PersistedSeries | undefined> {
			const { id: SeriesID, name: Name, nowShowing: NowShowing, programId: ProgramID } = await db.get("series", id) as SeriesStoreObject;

			return {
				SeriesID,
				Name,
				NowShowing,
				ProgramID
			};
		},

		async count(): Promise<number> {
			return db.count("series");
		},

		async removeAll(): Promise<void> {
			return db.clear("series");
		},

		async save({ SeriesID, Name, NowShowing, ProgramID }: PersistedSeries): Promise<void> {
			const tx = db.transaction(["series", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("series").put({ id: SeriesID, name: Name, nowShowing: NowShowing, programId: ProgramID }),
				tx.objectStore("syncs").put({ type: "Series", id: SeriesID, action: "modified" })
			]);

			return tx.done;
		},

		async remove(id: string): Promise<void> {
			const tx = db.transaction(["series", "episodes", "syncs"], "readwrite"),

						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),
						txSyncStore = tx.objectStore("syncs"),
						operations: Promise<[ModelType, string] | unknown>[] = [];

			for (const episodeId of await txEpisodesStore.index("seriesId").getAllKeys(id)) {
				operations.push(txSyncStore.put({ type: "Episode", id: episodeId, action: "deleted" }));
				operations.push(txEpisodesStore.delete(episodeId));
			}

			operations.push(txSyncStore.put({ type: "Series", id, action: "deleted" }));
			operations.push(txSeriesStore.delete(id));

			await Promise.all(operations);

			return tx.done;
		}
	};
}

export { upgradeTo, create };