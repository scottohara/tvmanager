import type {
	IDBStoreUpgrade,
	SettingsStore,
	TVManagerDB
} from "~/stores";
import {
	create,
	upgradeTo
} from "./settings";
import {
	deleteDB,
	openDB
} from "idb";
import type {	IDBPDatabase } from "idb";
import type { PersistedSetting } from "~/models";

describe("settings", (): void => {
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
			it("should create the settings store", (): Chai.Assertion => expect([...db.objectStoreNames].includes("settings")).to.be.true);
		});
	});

	describe("create", (): void => {
		const	name = "Test setting name",
					value = "Test setting value";

		let settingsStore: SettingsStore;

		beforeEach((): SettingsStore => (settingsStore = create(db)));

		describe("get", (): void => {
			beforeEach(async (): Promise<string> => db.put("settings", { name, value }));
			it("should return a setting by name", async (): Promise<Chai.Assertion> => expect(await settingsStore.get(name) as PersistedSetting).to.deep.equal({ name, value }));
		});

		describe("save", (): void => {
			beforeEach(async (): Promise<string> => settingsStore.save(name, value));
			it("should save the setting", async (): Promise<Chai.Assertion> => expect(await db.get("settings", name) as PersistedSetting).to.deep.equal({ name, value }));
		});

		describe("remove", (): void => {
			beforeEach(async (): Promise<void> => {
				await db.put("settings", { name, value });

				return settingsStore.remove(name);
			});

			it("should remove a setting by name", async (): Promise<Chai.Assertion> => expect(await db.get("settings", name)).to.be.undefined);
		});
	});

	after((): void => db.close());
});