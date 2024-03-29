import type {
	EpisodesStore,
	EpisodesStoreObject,
	IDBStoreUpgrade,
	SyncsStoreObject,
	TVManagerDB,
} from "~/stores";
import { create, upgradeTo } from "./episodes";
import { deleteDB, openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { PersistedEpisode } from "~/models";
import { upgradeTo as programsUpgradeTo } from "./programs";
import { upgradeTo as seriesUpgradeTo } from "./series";
import { upgradeTo as syncsUpgradeTo } from "./syncs";

describe("episodes", (): void => {
	let db: IDBPDatabase<TVManagerDB>;

	before(async (): Promise<void> => {
		await deleteDB("tvmanagertest");
		db = await openDB<TVManagerDB>("tvmanagertest", 1, {
			upgrade(database: IDBPDatabase<TVManagerDB>): void {
				upgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void =>
					upgrade(database),
				);
				programsUpgradeTo.forEach(
					(upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database),
				);
				seriesUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void =>
					upgrade(database),
				);
				syncsUpgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void =>
					upgrade(database),
				);
			},
		});
	});

	describe("upgradeTo", (): void => {
		describe("version 1", (): void => {
			it("should create the episodes store", (): Chai.Assertion =>
				expect([...db.objectStoreNames].includes("episodes")).to.be.true);
		});
	});

	describe("create", (): void => {
		let episodesStore: EpisodesStore;

		beforeEach(async (): Promise<string[]> => {
			episodesStore = create(db);

			return Promise.all([
				db.put("programs", { id: "1", name: "Program 1" }),

				db.put("series", {
					id: "1",
					name: "Series 1",
					programId: "1",
					nowShowing: null,
				}),
				db.put("episodes", {
					id: "2",
					name: "Episode 2",
					seriesId: "1",
					status: "Recorded",
					statusDate: "",
					unverified: 0,
					unscheduled: 0,
					sequence: 1,
				}),
				db.put("episodes", {
					id: "1",
					name: "Episode 1",
					seriesId: "1",
					status: "Watched",
					statusDate: "",
					unverified: 0,
					unscheduled: 0,
					sequence: 1,
				}),
				db.put("episodes", {
					id: "3",
					name: "Episode 3",
					seriesId: "1",
					status: "Expected",
					statusDate: "2000-04-04",
					unverified: 1,
					unscheduled: 1,
					sequence: 2,
				}),

				db.put("programs", { id: "2", name: "Program 2" }),

				db.put("series", {
					id: "2",
					name: "Series 2",
					programId: "2",
					nowShowing: null,
				}),
				db.put("episodes", {
					id: "4",
					name: "Episode 4",
					seriesId: "2",
					status: "Watched",
					statusDate: "",
					unverified: 0,
					unscheduled: 0,
					sequence: 1,
				}),
				db.put("episodes", {
					id: "5",
					name: "Episode 5",
					seriesId: "2",
					status: "Recorded",
					statusDate: "2001-01-05",
					unverified: 0,
					unscheduled: 1,
					sequence: 2,
				}),
				db.put("episodes", {
					id: "6",
					name: "Episode 6",
					seriesId: "2",
					status: "Expected",
					statusDate: "",
					unverified: 0,
					unscheduled: 0,
					sequence: 3,
				}),

				db.put("series", {
					id: "3",
					name: "Series 3",
					programId: "2",
					nowShowing: null,
				}),
				db.put("episodes", {
					id: "7",
					name: "Episode 7",
					seriesId: "3",
					status: "Watched",
					statusDate: "",
					unverified: 0,
					unscheduled: 1,
					sequence: 1,
				}),
				db.put("episodes", {
					id: "8",
					name: "Episode 8",
					seriesId: "3",
					status: "Recorded",
					statusDate: "",
					unverified: 0,
					unscheduled: 0,
					sequence: 2,
				}),
				db.put("episodes", {
					id: "9",
					name: "Episode 9",
					seriesId: "3",
					status: "Expected",
					statusDate: "2000-06-03",
					unverified: 0,
					unscheduled: 1,
					sequence: 3,
				}),
			]);
		});

		describe("listBySeries", (): void => {
			it("should return a list of all episodes for a series", async (): Promise<Chai.Assertion> =>
				expect(await episodesStore.listBySeries("1")).to.deep.equal([
					{
						EpisodeID: "1",
						Name: "Episode 1",
						Status: "Watched",
						StatusDate: "",
						Unverified: "false",
						Unscheduled: "false",
						Sequence: 1,
						SeriesID: "1",
						SeriesName: "Series 1",
						ProgramID: "1",
						ProgramName: "Program 1",
					},
					{
						EpisodeID: "2",
						Name: "Episode 2",
						Status: "Recorded",
						StatusDate: "",
						Unverified: "false",
						Unscheduled: "false",
						Sequence: 1,
						SeriesID: "1",
						SeriesName: "Series 1",
						ProgramID: "1",
						ProgramName: "Program 1",
					},
					{
						EpisodeID: "3",
						Name: "Episode 3",
						Status: "Expected",
						StatusDate: "2000-04-04",
						Unverified: "true",
						Unscheduled: "true",
						Sequence: 2,
						SeriesID: "1",
						SeriesName: "Series 1",
						ProgramID: "1",
						ProgramName: "Program 1",
					},
				]));
		});

		describe("listByUnscheduled", (): void => {
			it("should return a list of all unscheduled episodes", async (): Promise<Chai.Assertion> =>
				expect(await episodesStore.listByUnscheduled()).to.deep.equal([
					{
						EpisodeID: "7",
						Name: "Episode 7",
						Status: "Watched",
						StatusDate: "",
						Unverified: "false",
						Unscheduled: "true",
						Sequence: 1,
						SeriesID: "3",
						SeriesName: "Series 3",
						ProgramID: "2",
						ProgramName: "Program 2",
					},
					{
						EpisodeID: "3",
						Name: "Episode 3",
						Status: "Expected",
						StatusDate: "2000-04-04",
						Unverified: "true",
						Unscheduled: "true",
						Sequence: 2,
						SeriesID: "1",
						SeriesName: "Series 1",
						ProgramID: "1",
						ProgramName: "Program 1",
					},
					{
						EpisodeID: "9",
						Name: "Episode 9",
						Status: "Expected",
						StatusDate: "2000-06-03",
						Unverified: "false",
						Unscheduled: "true",
						Sequence: 3,
						SeriesID: "3",
						SeriesName: "Series 3",
						ProgramID: "2",
						ProgramName: "Program 2",
					},
					{
						EpisodeID: "5",
						Name: "Episode 5",
						Status: "Recorded",
						StatusDate: "2001-01-05",
						Unverified: "false",
						Unscheduled: "true",
						Sequence: 2,
						SeriesID: "2",
						SeriesName: "Series 2",
						ProgramID: "2",
						ProgramName: "Program 2",
					},
				]));
		});

		describe("find", (): void => {
			it("should return an episode by id", async (): Promise<Chai.Assertion> =>
				expect(
					(await episodesStore.find("1")) as PersistedEpisode,
				).to.deep.equal({
					EpisodeID: "1",
					Name: "Episode 1",
					Status: "Watched",
					StatusDate: "",
					Unverified: "false",
					Unscheduled: "false",
					Sequence: 1,
					SeriesID: "1",
				}));
		});

		describe("totalCount", (): void => {
			it("should return the total number of episodes", async (): Promise<Chai.Assertion> =>
				expect(await episodesStore.totalCount()).to.equal(9));
		});

		describe("countByStatus", (): void => {
			it("should return the total number of episodes for a given status", async (): Promise<Chai.Assertion> =>
				expect(await episodesStore.countByStatus("Watched")).to.equal(3));
		});

		describe("removeAll", (): void => {
			beforeEach(async (): Promise<void> => episodesStore.removeAll());
			it("should remove all episodes", async (): Promise<Chai.Assertion> =>
				expect(await db.count("episodes")).to.equal(0));
		});

		describe("save", (): void => {
			const id = "10",
				name = "Episode 10",
				seriesId = "1",
				status = "Recorded",
				sequence = 4,
				statusDate = "2000-12-01";

			describe("unwatched episode", (): void => {
				beforeEach(
					async (): Promise<void> =>
						episodesStore.save({
							EpisodeID: id,
							Name: name,
							SeriesID: seriesId,
							Status: status,
							StatusDate: statusDate,
							Unverified: "true",
							Unscheduled: "false",
							Sequence: sequence,
						}),
				);
				it("should save the episode", async (): Promise<Chai.Assertion> =>
					expect(
						(await db.get("episodes", id)) as EpisodesStoreObject,
					).to.deep.equal({
						id,
						name,
						seriesId,
						status,
						statusDate,
						unverified: 1,
						unscheduled: 0,
						sequence,
					}));
				it("should add a sync record", async (): Promise<Chai.Assertion> =>
					expect(
						(await db.get("syncs", ["Episode", id])) as SyncsStoreObject,
					).to.deep.equal({ type: "Episode", id, action: "modified" }));
			});

			describe("watched episode", (): void => {
				beforeEach(
					async (): Promise<void> =>
						episodesStore.save({
							EpisodeID: id,
							Name: name,
							SeriesID: seriesId,
							Status: "Watched",
							StatusDate: statusDate,
							Unverified: "true",
							Unscheduled: "false",
							Sequence: sequence,
						}),
				);
				it("should clear the status date", async (): Promise<Chai.Assertion> =>
					expect(
						(await db.get("episodes", id)) as EpisodesStoreObject,
					).to.deep.equal({
						id,
						name,
						seriesId,
						status: "Watched",
						statusDate: "",
						unverified: 1,
						unscheduled: 0,
						sequence,
					}));
			});
		});

		describe("remove", (): void => {
			const id = "1";

			beforeEach(async (): Promise<void> => episodesStore.remove(id));
			it("should remove the episode", async (): Promise<Chai.Assertion> =>
				expect(await db.get("episodes", id)).to.be.undefined);
			it("should add a sync record for the episode", async (): Promise<Chai.Assertion> =>
				expect(
					(await db.get("syncs", ["Episode", id])) as SyncsStoreObject,
				).to.deep.equal({ type: "Episode", id, action: "deleted" }));
		});
	});

	after((): void => db.close());
});
