import type {
	IDBStoreUpgrade,
	SeriesStore,
	SeriesStoreObject,
	SyncsStoreObject,
	TVManagerDB
} from "stores";
import {
	create,
	upgradeTo
} from "../../../src/stores/series";
import {
	deleteDB,
	openDB
} from "idb";
import type {	IDBPDatabase } from "idb";
import type { PersistedSeries } from "models";
import { upgradeTo as episodesUpgradeTo } from "../../../src/stores/episodes";
import { upgradeTo as programsUpgradeTo } from "../../../src/stores/programs";
import { upgradeTo as syncsUpgradeTo } from "../../../src/stores/syncs";

describe("series", (): void => {
	let db: IDBPDatabase<TVManagerDB>;

	before(async (): Promise<void> => {
		await deleteDB("tvmanagertest");
		db = await openDB<TVManagerDB>("tvmanagertest", 1, {
			upgrade(database: IDBPDatabase<TVManagerDB>): void {
				upgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				programsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				episodesUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				syncsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
			}
		});
	});

	describe("upgradeTo", (): void => {
		describe("version 1", (): void => {
			it("should create the series store", (): Chai.Assertion => [...db.objectStoreNames].includes("series").should.be.true);
		});
	});

	describe("create", (): void => {
		let seriesStore: SeriesStore;

		beforeEach(async (): Promise<string[]> => {
			seriesStore = create(db);

			return Promise.all([
				db.put("programs", { id: "1", name: "cc Program 1" }),

				db.put("series", { id: "1", name: "bb Series 1", programId: "1", nowShowing: null }),
				db.put("episodes", { id: "1", name: "Episode 1", seriesId: "1", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "2", name: "Episode 2", seriesId: "1", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),
				db.put("episodes", { id: "3", name: "Episode 3", seriesId: "1", status: "Expected", statusDate: "2000-12-31", unverified: 0, unscheduled: 0, sequence: 3 }),

				db.put("series", { id: "2", name: "aa Series 2", programId: "1", nowShowing: null }),
				db.put("episodes", { id: "4", name: "Episode 4", seriesId: "2", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "5", name: "Episode 5", seriesId: "2", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),

				db.put("programs", { id: "2", name: "bb Program 2" }),

				db.put("series", { id: "3", name: "Series 3", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "6", name: "Episode 6", seriesId: "3", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),

				db.put("series", { id: "4", name: "Series 4", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "7", name: "Episode 7", seriesId: "4", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "8", name: "Episode 8", seriesId: "4", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),

				db.put("series", { id: "5", name: "Series 5", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "9", name: "Episode 9", seriesId: "5", status: "Expected", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),

				db.put("series", { id: "6", name: "Series 6", programId: "2", nowShowing: 1 }),
				db.put("episodes", { id: "10", name: "Episode 10", seriesId: "6", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "11", name: "Episode 11", seriesId: "6", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),

				db.put("programs", { id: "3", name: "aa Program 3" }),

				db.put("series", { id: "7", name: "Series 7", programId: "3", nowShowing: 1 }),
				db.put("episodes", { id: "12", name: "Episode 12", seriesId: "7", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 })
			]);
		});

		describe("listByProgram", (): void => {
			it("should return a list of all series for a program", async (): Promise<Chai.Assertion> => (await seriesStore.listByProgram("1")).should.deep.equal([
				{ SeriesID: "2", Name: "aa Series 2", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 2, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 0 },
				{ SeriesID: "1", Name: "bb Series 1", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 3, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 1 }
			]));
		});

		describe("listByNowShowing", (): void => {
			it("should return a list of all series currently showing, recorded or expected", async (): Promise<Chai.Assertion> => (await seriesStore.listByNowShowing()).should.deep.equal([
				{ SeriesID: "7", Name: "Series 7", ProgramID: "3", ProgramName: "aa Program 3", NowShowing: 1, EpisodeCount: 1, WatchedCount: 0, RecordedCount: 1, ExpectedCount: 0, StatusWarningCount: 0 },
				{ SeriesID: "6", Name: "Series 6", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: 1, EpisodeCount: 2, WatchedCount: 2, RecordedCount: 0, ExpectedCount: 0, StatusWarningCount: 0 },
				{ SeriesID: "4", Name: "Series 4", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: null, EpisodeCount: 2, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 0, StatusWarningCount: 0 },
				{ SeriesID: "5", Name: "Series 5", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: null, EpisodeCount: 1, WatchedCount: 0, RecordedCount: 0, ExpectedCount: 1, StatusWarningCount: 0 },
				{ SeriesID: "2", Name: "aa Series 2", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 2, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 0, StatusWarningCount: 0 },
				{ SeriesID: "1", Name: "bb Series 1", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 3, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 1, StatusWarningCount: 1 }
			]));
		});

		describe("listByStatus", (): void => {
			it("should return a list of all series with episodes in a given status", async (): Promise<Chai.Assertion> => (await seriesStore.listByStatus("Watched")).should.deep.equal([
				{ SeriesID: "3", Name: "Series 3", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: null, EpisodeCount: 1, WatchedCount: 1 },
				{ SeriesID: "4", Name: "Series 4", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: null, EpisodeCount: 1, WatchedCount: 1 },
				{ SeriesID: "6", Name: "Series 6", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: 1, EpisodeCount: 2, WatchedCount: 2 },
				{ SeriesID: "2", Name: "aa Series 2", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 1, WatchedCount: 1 },
				{ SeriesID: "1", Name: "bb Series 1", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 1, WatchedCount: 1 }
			]));
		});

		describe("listByIncomplete", (): void => {
			it("should return a list of all incomplete series", async (): Promise<Chai.Assertion> => (await seriesStore.listByIncomplete()).should.deep.equal([
				{ SeriesID: "4", Name: "Series 4", ProgramID: "2", ProgramName: "bb Program 2", NowShowing: null, EpisodeCount: 2, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 0 },
				{ SeriesID: "2", Name: "aa Series 2", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 2, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 0 },
				{ SeriesID: "1", Name: "bb Series 1", ProgramID: "1", ProgramName: "cc Program 1", NowShowing: null, EpisodeCount: 3, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 1 }
			]));
		});

		describe("find", (): void => {
			it("should return a series by id", async (): Promise<Chai.Assertion> => (await seriesStore.find("1") as PersistedSeries).should.deep.equal({ SeriesID: "1", Name: "bb Series 1", NowShowing: null, ProgramID: "1" }));
		});

		describe("count", (): void => {
			it("should return the total number of series", async (): Promise<Chai.Assertion> => (await seriesStore.count()).should.equal(7));
		});

		describe("removeAll", (): void => {
			beforeEach(async (): Promise<void> => seriesStore.removeAll());
			it("should remove all series", async (): Promise<Chai.Assertion> => (await db.count("series")).should.equal(0));
		});

		describe("save", (): void => {
			const id = "8",
						name = "Series 8",
						nowShowing = null,
						programId = "1";

			beforeEach(async (): Promise<void> => seriesStore.save({ SeriesID: id, Name: name, NowShowing: nowShowing, ProgramID: programId }));
			it("should save the series", async (): Promise<Chai.Assertion> => (await db.get("series", id) as SeriesStoreObject).should.deep.equal({ id, name, nowShowing, programId }));
			it("should add a sync record", async (): Promise<Chai.Assertion> => (await db.get("syncs", ["Series", id]) as SyncsStoreObject).should.deep.equal({ type: "Series", id, action: "modified" }));
		});

		describe("remove", (): void => {
			const id = "2",
						episodeIds = ["4", "5"];

			beforeEach(async (): Promise<void> => seriesStore.remove(id));
			it("should remove the series", async (): Promise<Chai.Assertion> => (await db.get("series", id) === undefined).should.be.true);
			it("should add a sync record for the series", async (): Promise<Chai.Assertion> => (await db.get("syncs", ["Series", id]) as SyncsStoreObject).should.deep.equal({ type: "Series", id, action: "deleted" }));
			it("should remove all episodes for the series", async (): Promise<Chai.Assertion[]> => Promise.all(episodeIds.map(async (episodeId: string): Promise<Chai.Assertion> => (await db.get("episodes", episodeId) === undefined).should.be.true)));
			it("should add a sync record for each deleted episodes", async (): Promise<Chai.Assertion[]> => Promise.all(episodeIds.map(async (episodeId: string): Promise<Chai.Assertion> => (await db.get("syncs", ["Episode", episodeId]) as SyncsStoreObject).should.deep.equal({ type: "Episode", id: episodeId, action: "deleted" }))));
		});
	});

	after((): void => db.close());
});