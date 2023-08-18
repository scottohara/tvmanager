import type {
	IDBStoreUpgrade,
	ProgramsStore,
	ProgramsStoreObject,
	SyncsStoreObject,
	TVManagerDB
} from "~/stores";
import {
	create,
	upgradeTo
} from "../../../src/stores/programs";
import {
	deleteDB,
	openDB
} from "idb";
import type { IDBPDatabase } from "idb";
import type { PersistedProgram } from "~/models";
import { upgradeTo as episodesUpgradeTo } from "../../../src/stores/episodes";
import { upgradeTo as seriesUpgradeTo } from "../../../src/stores/series";
import { upgradeTo as syncsUpgradeTo } from "../../../src/stores/syncs";

describe("programs", (): void => {
	let db: IDBPDatabase<TVManagerDB>;

	before(async (): Promise<void> => {
		await deleteDB("tvmanagertest");
		db = await openDB<TVManagerDB>("tvmanagertest", 1, {
			upgrade(database: IDBPDatabase<TVManagerDB>): void {
				upgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				seriesUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				episodesUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
				syncsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
			}
		});
	});

	describe("upgradeTo", (): void => {
		describe("version 1", (): void => {
			it("should create the programs store", (): Chai.Assertion => expect([...db.objectStoreNames].includes("programs")).to.be.true);
		});
	});

	describe("create", (): void => {
		let programsStore: ProgramsStore;

		beforeEach(async (): Promise<string[]> => {
			programsStore = create(db);

			return Promise.all([
				db.put("programs", { id: "1", name: "bb Program 1" }),

				db.put("series", { id: "1", name: "Series 1", programId: "1", nowShowing: null }),
				db.put("episodes", { id: "1", name: "Episode 1", seriesId: "1", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "2", name: "Episode 2", seriesId: "1", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),
				db.put("episodes", { id: "3", name: "Episode 3", seriesId: "1", status: "Expected", statusDate: "", unverified: 0, unscheduled: 0, sequence: 3 }),

				db.put("programs", { id: "2", name: "aa Program 2" }),

				db.put("series", { id: "2", name: "Series 2", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "4", name: "Episode 4", seriesId: "2", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "5", name: "Episode 5", seriesId: "2", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),
				db.put("episodes", { id: "6", name: "Episode 6", seriesId: "2", status: "Expected", statusDate: "", unverified: 0, unscheduled: 0, sequence: 3 }),

				db.put("series", { id: "3", name: "Series 3", programId: "2", nowShowing: null }),
				db.put("episodes", { id: "7", name: "Episode 7", seriesId: "3", status: "Watched", statusDate: "", unverified: 0, unscheduled: 0, sequence: 1 }),
				db.put("episodes", { id: "8", name: "Episode 8", seriesId: "3", status: "Recorded", statusDate: "", unverified: 0, unscheduled: 0, sequence: 2 }),
				db.put("episodes", { id: "9", name: "Episode 9", seriesId: "3", status: "Expected", statusDate: "", unverified: 0, unscheduled: 0, sequence: 3 })
			]);
		});

		describe("list", (): void => {
			it("should return a list of all programs", async (): Promise<Chai.Assertion> => expect(await programsStore.list()).to.deep.equal([
				{ ProgramID: "2", Name: "aa Program 2", SeriesCount: 2, EpisodeCount: 6, WatchedCount: 2, RecordedCount: 2, ExpectedCount: 2 },
				{ ProgramID: "1", Name: "bb Program 1", SeriesCount: 1, EpisodeCount: 3, WatchedCount: 1, RecordedCount: 1, ExpectedCount: 1 }
			]));
		});

		describe("find", (): void => {
			it("should return a program by id", async (): Promise<Chai.Assertion> => expect(await programsStore.find("1") as PersistedProgram).to.deep.equal({ ProgramID: "1", Name: "bb Program 1" }));
		});

		describe("count", (): void => {
			it("should return the total number of programs", async (): Promise<Chai.Assertion> => expect(await programsStore.count()).to.equal(2));
		});

		describe("removeAll", (): void => {
			beforeEach(async (): Promise<void> => programsStore.removeAll());
			it("should remove all programs", async (): Promise<Chai.Assertion> => expect(await db.count("programs")).to.equal(0));
		});

		describe("save", (): void => {
			const id = "3",
						name = "Program 3";

			beforeEach(async (): Promise<void> => programsStore.save({ ProgramID: id, Name: name }));
			it("should save the program", async (): Promise<Chai.Assertion> => expect(await db.get("programs", id) as ProgramsStoreObject).to.deep.equal({ id, name }));
			it("should add a sync record", async (): Promise<Chai.Assertion> => expect(await db.get("syncs", ["Program", id]) as SyncsStoreObject).to.deep.equal({ type: "Program", id, action: "modified" }));
		});

		describe("remove", (): void => {
			const id = "2",
						seriesIds = ["2", "3"],
						episodeIds = ["4", "5", "6", "7", "8", "9"];

			beforeEach(async (): Promise<void> => programsStore.remove(id));
			it("should remove the program", async (): Promise<Chai.Assertion> => expect(await db.get("programs", id)).to.be.undefined);
			it("should add a sync record for the program", async (): Promise<Chai.Assertion> => expect(await db.get("syncs", ["Program", id]) as SyncsStoreObject).to.deep.equal({ type: "Program", id, action: "deleted" }));
			it("should remove all series for the program", async (): Promise<Chai.Assertion[]> => Promise.all(seriesIds.map(async (seriesId: string): Promise<Chai.Assertion> => expect(await db.get("series", seriesId)).to.be.undefined)));
			it("should add a sync record for each deleted series", async (): Promise<Chai.Assertion[]> => Promise.all(seriesIds.map(async (seriesId: string): Promise<Chai.Assertion> => expect(await db.get("syncs", ["Series", seriesId]) as SyncsStoreObject).to.deep.equal({ type: "Series", id: seriesId, action: "deleted" }))));
			it("should remove all episodes for the program", async (): Promise<Chai.Assertion[]> => Promise.all(episodeIds.map(async (episodeId: string): Promise<Chai.Assertion> => expect(await db.get("episodes", episodeId)).to.be.undefined)));
			it("should add a sync record for each deleted episodes", async (): Promise<Chai.Assertion[]> => Promise.all(episodeIds.map(async (episodeId: string): Promise<Chai.Assertion> => expect(await db.get("syncs", ["Episode", episodeId]) as SyncsStoreObject).to.deep.equal({ type: "Episode", id: episodeId, action: "deleted" }))));
		});
	});

	after((): void => db.close());
});