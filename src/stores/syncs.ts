import type {
	IDBStoreUpgrade,
	SyncsStore,
	SyncsStoreObject,
	TVManagerDB
} from "stores";
import type {
	ModelType,
	PersistedSync
} from "models";
import type { IDBPDatabase } from "idb";

const upgradeTo: IDBStoreUpgrade<TVManagerDB>[] = [
	// Version 1
	(db: IDBPDatabase<TVManagerDB>): void => {
		db.createObjectStore("syncs", { keyPath: ["type", "id"] });
	}
];

function create(db: IDBPDatabase<TVManagerDB>): SyncsStore {
	return {
		async list(): Promise<PersistedSync[]> {
			return (await db.getAll("syncs")).map((sync: SyncsStoreObject): PersistedSync => ({
				Type: sync.type,
				ID: sync.id,
				Action: sync.action
			}));
		},

		async count(): Promise<number> {
			return db.count("syncs");
		},

		async removeAll(): Promise<void> {
			return db.clear("syncs");
		},

		async remove(type: ModelType, id: string): Promise<void> {
			return db.delete("syncs", [type, id]);
		}
	};
}

export { upgradeTo, create };