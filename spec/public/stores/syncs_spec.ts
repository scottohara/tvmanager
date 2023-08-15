import type {
	IDBStoreUpgrade,
	SyncsStore,
	TVManagerDB
} from "~/stores";
import {
	create,
	upgradeTo
} from "../../../src/stores/syncs";
import {
	deleteDB,
	openDB
} from "idb";
import type {	IDBPDatabase } from "idb";
import type { ModelType } from "~/models";

describe("syncs", (): void => {
	let db: IDBPDatabase<TVManagerDB>;

	before(async (): Promise<void> => {
		await deleteDB("tvmanagertest");
		db = await openDB<TVManagerDB>("tvmanagertest", 1, {
			upgrade(database: IDBPDatabase<TVManagerDB>): void {
				upgradeTo.forEach((upgrade: IDBStoreUpgrade<TVManagerDB>): void => upgrade(database));
			}
		});
	});

	describe("upgradeTo", (): void => {
		describe("version 1", (): void => {
			it("should create the syncs store", (): Chai.Assertion => [...db.objectStoreNames].includes("syncs").should.be.true);
		});
	});

	describe("create", (): void => {
		const	type = "Episode",
					id = "1";

		let syncsStore: SyncsStore;

		beforeEach(async (): Promise<[ModelType, string][]> => {
			syncsStore = create(db);

			return Promise.all([
				db.put("syncs", { type: "Program", id, action: "modified" }),
				db.put("syncs", { type, id, action: "deleted" })
			]);
		});

		describe("list", (): void => {
			it("should return a list of all sync records", async (): Promise<Chai.Assertion> => (await syncsStore.list()).should.deep.equal([
				{ Type: "Episode", ID: id, Action: "deleted" },
				{ Type: "Program", ID: id, Action: "modified" }
			]));
		});

		describe("count", (): void => {
			it("should return the total number of sync records", async (): Promise<Chai.Assertion> => (await syncsStore.count()).should.equal(2));
		});

		describe("removeAll", (): void => {
			beforeEach(async (): Promise<void> => syncsStore.removeAll());
			it("should remove all sync records", async (): Promise<Chai.Assertion> => (await db.count("syncs")).should.equal(0));
		});

		describe("remove", (): void => {
			beforeEach(async (): Promise<void> => syncsStore.remove(type, id));
			it("should remove a sync record", async (): Promise<Chai.Assertion> => (await db.get("syncs", [type, id]) === undefined).should.be.true);
		});
	});

	after((): void => db.close());
});