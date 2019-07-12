import {
	EpisodesStore,
	EpisodesStoreObject,
	IDBStoreUpgrade,
	SyncsStoreObject,
	TVManagerDB
} from "stores";
import {
	IDBPDatabase,
	deleteDB,
	openDB
} from "idb";
import {
	create,
	upgradeTo
} from "../../../src/stores/episodes";
import sinon, { SinonFakeTimers } from "sinon";
import { PersistedEpisode } from "models";
import { upgradeTo as programsUpgradeTo } from "../../../src/stores/programs";
import { upgradeTo as seriesUpgradeTo } from "../../../src/stores/series";
import { upgradeTo as syncsUpgradeTo } from "../../../src/stores/syncs";

describe("episodes", (): void => {
	let db: IDBPDatabase<TVManagerDB>;

	before(async (): Promise<void> => {
		await deleteDB("tvmanagertest");
		db = await openDB<TVManagerDB>("tvmanagertest", 1, {
			upgrade(database: IDBPDatabase<TVManagerDB>): void {
				upgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				programsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				seriesUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				syncsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
			}
		});
	});

	describe("upgradeTo", (): void => {
		describe("version 1", (): void => {
			it("should create the episodes store", (): Chai.Assertion => [...db.objectStoreNames].includes("episodes").should.be.true);
		});
	});

	describe("create", (): void => {
		let episodesStore: EpisodesStore,
				clock: SinonFakeTimers;

		beforeEach(async (): Promise<string[]> => {
			clock = sinon.useFakeTimers(new Date(2000, 3, 14).valueOf());
			episodesStore = create(db);

			return Promise.all([
				db.put("programs", { id: "1", name: "Program 1" }),

				db.put("series", { id: "1", name: "Series 1", programId: "1", nowShowing: null }),
				db.put("episodes", { id: "2", name: "Episode 2", seriesId: "1", status: "Recorded", statusDate: null, unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "1", name: "Episode 1", seriesId: "1", status: "Watched", statusDate: null, unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "3", name: "Episode 3", seriesId: "1", status: "Expected", statusDate: new Date(2000, 2, 31), unverified: 1, unscheduled: 1, sequence: 2 }),

				db.put("programs", { id: "2", name: "Program 2" }),

				db.put("series", { id: "2", name: "Series 2", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "4", name: "Episode 4", seriesId: "2", status: "Watched", statusDate: null, unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "5", name: "Episode 5", seriesId: "2", status: "Recorded", statusDate: new Date(2000, 0, 5), unverified: 0, unscheduled: 1, sequence: 2 }),
				db.put("episodes", { id: "6", name: "Episode 6", seriesId: "2", status: "Expected", statusDate: null, unverified: 0, unscheduled: 0, sequence: 3 }),

				db.put("series", { id: "3", name: "Series 3", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "7", name: "Episode 7", seriesId: "3", status: "Watched", statusDate: null, unverified: 0, unscheduled: 1, sequence: 1 }),
				db.put("episodes", { id: "8", name: "Episode 8", seriesId: "3", status: "Recorded", statusDate: null, unverified: 0, unscheduled: 0, sequence: 2 }),
				db.put("episodes", { id: "9", name: "Episode 9", seriesId: "3", status: "Expected", statusDate: new Date(2000, 5, 3), unverified: 0, unscheduled: 1, sequence: 3 })
			]);
		});

		describe("listBySeries", (): void => {
			it("should return a list of all episodes for a series", async (): Promise<Chai.Assertion> => (await episodesStore.listBySeries("1")).should.deep.equal([
				{ EpisodeID: "1", Name: "Episode 1", Status: "Watched", StatusDate: "", Unverified: "false", Unscheduled: "false", Sequence: 1, SeriesID: "1", SeriesName: "Series 1", ProgramID: "1", ProgramName: "Program 1" },
				{ EpisodeID: "2", Name: "Episode 2", Status: "Recorded", StatusDate: "", Unverified: "false", Unscheduled: "false", Sequence: 1, SeriesID: "1", SeriesName: "Series 1", ProgramID: "1", ProgramName: "Program 1" },
				{ EpisodeID: "3", Name: "Episode 3", Status: "Expected", StatusDate: "31-Mar", Unverified: "true", Unscheduled: "true", Sequence: 2, SeriesID: "1", SeriesName: "Series 1", ProgramID: "1", ProgramName: "Program 1" }
			]));
		});

		describe("listByUnscheduled", (): void => {
			it("should return a list of all unscheduled episodes", async (): Promise<Chai.Assertion> => (await episodesStore.listByUnscheduled()).should.deep.equal([
				{ EpisodeID: "7", Name: "Episode 7", Status: "Watched", StatusDate: "", Unverified: "false", Unscheduled: "true", Sequence: 1, SeriesID: "3", SeriesName: "Series 3", ProgramID: "2", ProgramName: "Program 2" },
				{ EpisodeID: "3", Name: "Episode 3", Status: "Expected", StatusDate: "31-Mar", Unverified: "true", Unscheduled: "true", Sequence: 2, SeriesID: "1", SeriesName: "Series 1", ProgramID: "1", ProgramName: "Program 1" },
				{ EpisodeID: "9", Name: "Episode 9", Status: "Expected", StatusDate: "03-Jun", Unverified: "false", Unscheduled: "true", Sequence: 3, SeriesID: "3", SeriesName: "Series 3", ProgramID: "2", ProgramName: "Program 2" },
				{ EpisodeID: "5", Name: "Episode 5", Status: "Recorded", StatusDate: "05-Jan", Unverified: "false", Unscheduled: "true", Sequence: 2, SeriesID: "2", SeriesName: "Series 2", ProgramID: "2", ProgramName: "Program 2" }
			]));
		});

		describe("find", (): void => {
			it("should return an episode by id", async (): Promise<Chai.Assertion> => (await episodesStore.find("1") as PersistedEpisode).should.deep.equal({ EpisodeID: "1", Name: "Episode 1", Status: "Watched", StatusDate: "", Unverified: "false", Unscheduled: "false", Sequence: 1, SeriesID: "1" }));
		});

		describe("totalCount", (): void => {
			it("should return the total number of episodes", async (): Promise<Chai.Assertion> => (await episodesStore.totalCount()).should.equal(9));
		});

		describe("countByStatus", (): void => {
			it("should return the total number of episodes for a given status", async (): Promise<Chai.Assertion> => (await episodesStore.countByStatus("Watched")).should.equal(3));
		});

		describe("removeAll", (): void => {
			beforeEach(async (): Promise<void> => episodesStore.removeAll());
			it("should remove all episodes", async (): Promise<Chai.Assertion> => (await db.count("episodes")).should.equal(0));
		});

		describe("save", (): void => {
			const id = "10",
						name = "Episode 10",
						seriesId = "1",
						status = "Recorded",
						statusDate = new Date(1999, 11, 1),
						sequence = 4;

			beforeEach(async (): Promise<void> => {
				clock = sinon.useFakeTimers(new Date(2000, 1, 14).valueOf());

				return episodesStore.save({ EpisodeID: id, Name: name, SeriesID: seriesId, Status: status, StatusDate: "01-Dec", Unverified: "true", Unscheduled: "false", Sequence: sequence });
			});

			it("should save the episode", async (): Promise<Chai.Assertion> => (await db.get("episodes", id) as EpisodesStoreObject).should.deep.equal({ id, name, seriesId, status, statusDate, unverified: 1, unscheduled: 0, sequence }));
			it("should add a sync record", async (): Promise<Chai.Assertion> => (await db.get("syncs", ["Episode", id]) as SyncsStoreObject).should.deep.equal({ type: "Episode", id, action: "modified" }));
		});

		describe("remove", (): void => {
			const id = "1";

			beforeEach(async (): Promise<void> => episodesStore.remove(id));
			it("should remove the episode", async (): Promise<Chai.Assertion> => (await db.get("episodes", id) === undefined).should.be.true);
			it("should add a sync record for the episode", async (): Promise<Chai.Assertion> => (await db.get("syncs", ["Episode", id]) as SyncsStoreObject).should.deep.equal({ type: "Episode", id, action: "deleted" }));
		});

		after((): void => clock.restore());
	});

	after((): void => db.close());
});