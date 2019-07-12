import {
	IDBStoreUpgrade,
	SettingsStore,
	TVManagerDB
} from "stores";
import { IDBPDatabase } from "idb";
import { PersistedSetting } from "models";

const upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		db.createObjectStore("settings", { keyPath: "name" });
	}
];

function create(db: IDBPDatabase<TVManagerDB>): SettingsStore {
	return {
		async get(name: string): Promise<PersistedSetting | undefined> {
			return db.get("settings", name);
		},

		async save(name: string, value: string): Promise<string> {
			return db.put("settings", { name, value });
		},

		async remove(name: string): Promise<void> {
			return db.delete("settings", name);
		}
	};
}

export { upgradeTo, create };