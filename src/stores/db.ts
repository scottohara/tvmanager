import * as EpisodesStoreFactory from "~/stores/episodes";
import * as ProgramsStoreFactory from "~/stores/programs";
import * as SeriesStoreFactory from "~/stores/series";
import * as SettingsStoreFactory from "~/stores/settings";
import * as SyncsStoreFactory from "~/stores/syncs";
import type {
	EpisodesStore,
	ProgramsStore,
	SeriesStore,
	SettingsStore,
	Store,
	SyncsStore,
	TVManagerDB,
	TVManagerStoreProxy
} from "~/stores";
import type {
	IDBPDatabase,
	IDBPTransaction,
	StoreNames
} from "idb";
import { expose } from "comlink";
import { openDB } from "idb";

let	db!: IDBPDatabase<TVManagerDB>,
		programsStore: Store | undefined,
		seriesStore: Store | undefined,
		episodesStore: Store | undefined,
		settingsStore: Store | undefined,
		syncsStore: Store | undefined;

async function connect(expectedVersion: number): Promise<void> {
	db = await openDB<TVManagerDB>("tvmanager", expectedVersion, {
		upgrade(database: IDBPDatabase<TVManagerDB>, oldVersion: number, newVersion: number | null, transaction: IDBPTransaction<TVManagerDB, StoreNames<TVManagerDB>[], "versionchange">): void {
			for (let version: number = oldVersion; version < Number(newVersion); version++) {
				ProgramsStoreFactory.upgradeTo[version](database, transaction);
				SeriesStoreFactory.upgradeTo[version](database, transaction);
				EpisodesStoreFactory.upgradeTo[version](database, transaction);
				SettingsStoreFactory.upgradeTo[version](database, transaction);
				SyncsStoreFactory.upgradeTo[version](database, transaction);
			}
		}
	});

	programsStore = ProgramsStoreFactory.create(db);
	seriesStore = SeriesStoreFactory.create(db);
	episodesStore = EpisodesStoreFactory.create(db);
	settingsStore = SettingsStoreFactory.create(db);
	syncsStore = SyncsStoreFactory.create(db);
}

function disconnect(): void {
	db.close();
}

const storeProxy: TVManagerStoreProxy = {
	connect,
	get programsStore(): ProgramsStore {
		return programsStore as ProgramsStore;
	},
	get seriesStore(): SeriesStore {
		return seriesStore as SeriesStore;
	},
	get episodesStore(): EpisodesStore {
		return episodesStore as EpisodesStore;
	},
	get settingsStore(): SettingsStore {
		return settingsStore as SettingsStore;
	},
	get syncsStore(): SyncsStore {
		return syncsStore as SyncsStore;
	}
};

expose(storeProxy);

export { connect, disconnect };