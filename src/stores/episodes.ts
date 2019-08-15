import {
	EpisodeStatus,
	PersistedEpisode
} from "models";
import {
	EpisodesStore,
	EpisodesStoreObject,
	IDBStoreUpgrade,
	ProgramsStoreObject,
	SeriesStoreObject,
	TVManagerDB
} from "stores";
import { IDBPDatabase } from "idb";

const upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		const store = db.createObjectStore("episodes", { keyPath: "id" });

		store.createIndex("seriesId", "seriesId");
		store.createIndex("status", ["status", "seriesId"]);
		store.createIndex("statusWarning", ["status", "seriesId", "statusDate"]);
		store.createIndex("unscheduled", "unscheduled");
	}
];

// Converts a date to DD-MON format (e.g. 06-Jul)
function statusDateToString(statusDate: Date | null): string {
	return null === statusDate ? "" : (new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" })).format(statusDate).replace(/\s/giu, "-");
}

// Coverts a DD-MON string to a date, using a sliding [3 months ago] to [9 months from now] window
function statusDateToDate(statusDate: string, status: EpisodeStatus): Date | null {
	if ("" === statusDate || "Watched" === status) {
		return null;
	}

	const today: Date = new Date(),
				currentYear: number = today.getFullYear(),
				currentMonth: number = today.getMonth(),
				tempStatusDate: Date = new Date(`${statusDate}-${currentYear}`),
				THREE_MONTHS = 3,
				NINE_MONTHS = 9;

	if (tempStatusDate < today) {
		today.setMonth(currentMonth - THREE_MONTHS);
		if (tempStatusDate < today) {
			tempStatusDate.setFullYear(currentYear + 1);
		}
	} else {
		today.setMonth(currentMonth + NINE_MONTHS);
		if (tempStatusDate > today) {
			tempStatusDate.setFullYear(currentYear - 1);
		}
	}

	return tempStatusDate;
}

// Orders episodes by sequence then id
function bySequenceThenEpisodeId(a: PersistedEpisode, b: PersistedEpisode): number {
	const sequenceDiff = a.Sequence - b.Sequence;

	if (0 === sequenceDiff) {
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

						episodes: PersistedEpisode[] = await Promise.all((await txEpisodesStore.index("seriesId").getAll(seriesId)).map(async ({ id, name, status, statusDate, unverified, unscheduled, sequence }: EpisodesStoreObject): Promise<PersistedEpisode> => {
							const { name: seriesName, programId }: SeriesStoreObject = await txSeriesStore.get(seriesId) as SeriesStoreObject,
										{ name: programName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject;

							return {
								EpisodeID: id,
								Name: name,
								Status: status,
								StatusDate: statusDateToString(statusDate),
								Unverified: Boolean(unverified).toString() as "true" | "false",
								Unscheduled: Boolean(unscheduled).toString() as "true" | "false",
								Sequence: sequence,
								SeriesID: seriesId,
								SeriesName: seriesName,
								ProgramID: programId,
								ProgramName: programName
							};
						}));

			return episodes.sort(bySequenceThenEpisodeId);
		},

		async listByUnscheduled(): Promise<PersistedEpisode[]> {
			const tx = db.transaction(["programs", "series", "episodes"]),

						txProgramsStore = tx.objectStore("programs"),
						txSeriesStore = tx.objectStore("series"),
						txEpisodesStore = tx.objectStore("episodes"),

						episodes: PersistedEpisode[] = await Promise.all((await txEpisodesStore.index("unscheduled").getAll(1)).map(async ({ id, name, status, statusDate, unverified, unscheduled, sequence, seriesId }: EpisodesStoreObject): Promise<PersistedEpisode> => {
							const { name: seriesName, programId }: SeriesStoreObject = await txSeriesStore.get(seriesId) as SeriesStoreObject,
										{ name: programName }: ProgramsStoreObject = await txProgramsStore.get(programId) as ProgramsStoreObject;

							return {
								EpisodeID: id,
								Name: name,
								Status: status,
								StatusDate: statusDateToString(statusDate),
								Unverified: Boolean(unverified).toString() as "true" | "false",
								Unscheduled: Boolean(unscheduled).toString() as "true" | "false",
								Sequence: sequence,
								SeriesID: seriesId,
								SeriesName: seriesName,
								ProgramID: programId,
								ProgramName: programName
							};
						}));

			return episodes.sort((a: PersistedEpisode, b: PersistedEpisode): number => Number(statusDateToDate(a.StatusDate, a.Status)) - Number(statusDateToDate(b.StatusDate, b.Status)));
		},

		async find(id: string): Promise<PersistedEpisode | undefined> {
			const { id: EpisodeID, name: Name, status: Status, statusDate, unverified, unscheduled, sequence: Sequence, seriesId: SeriesID } = await db.get("episodes", id) as EpisodesStoreObject;

			return {
				EpisodeID,
				Name,
				Status,
				StatusDate: statusDateToString(statusDate),
				Unverified: Boolean(unverified).toString() as "true" | "false",
				Unscheduled: Boolean(unscheduled).toString() as "true" | "false",
				Sequence,
				SeriesID
			};
		},

		async totalCount(): Promise<number> {
			return db.count("episodes");
		},

		async countByStatus(status: EpisodeStatus): Promise<number> {
			return db.countFromIndex("episodes", "status", IDBKeyRange.bound([status], [status, "~"]));
		},

		async removeAll(): Promise<void> {
			return db.clear("episodes");
		},

		async save({ EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence }: PersistedEpisode): Promise<void> {
			const tx = db.transaction(["episodes", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("episodes").put({ id: EpisodeID, name: Name, seriesId: SeriesID, status: Status, statusDate: statusDateToDate(StatusDate, Status), unverified: Number(JSON.parse(Unverified)), unscheduled: Number(JSON.parse(Unscheduled)), sequence: Sequence }),
				tx.objectStore("syncs").put({ type: "Episode", id: EpisodeID, action: "modified" })
			]);

			return tx.done;
		},

		async remove(id: string): Promise<void> {
			const tx = db.transaction(["episodes", "syncs"], "readwrite");

			await Promise.all([
				tx.objectStore("episodes").delete(id),
				tx.objectStore("syncs").put({ type: "Episode", id, action: "deleted" })
			]);

			return tx.done;
		}
	};
}

export { upgradeTo, create };