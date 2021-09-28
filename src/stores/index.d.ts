import type {
	DBSchema,
	IDBPDatabase,
	IDBPTransaction,
	StoreNames
} from "idb";
import type {
	EpisodeStatus,
	ModelType,
	PersistedEpisode,
	PersistedProgram,
	PersistedSeries,
	PersistedSetting,
	PersistedSync,
	SyncAction
} from "models";

export type IDBStoreUpgrade<T> = (db: IDBPDatabase<T>, transaction?: IDBPTransaction<T, StoreNames<T>[], "versionchange">) => void;

// Interfaces for store objects

interface StoreObject {
	id: string;
	name: string;
}

type ProgramsStoreObject = StoreObject;

export interface SeriesStoreObject extends StoreObject {
	programId: string;
	nowShowing: number | null;
}

export interface EpisodesStoreObject extends StoreObject {
	seriesId: string;
	status: EpisodeStatus;
	statusDate: string;
	unverified: number;
	unscheduled: number;
	sequence: number;
}

export interface SettingsStoreObject {
	name: string;
	value: string;
}

export interface SyncsStoreObject {
	type: ModelType;
	id: string;
	action: SyncAction;
}

export interface TVManagerDB extends DBSchema {
	programs: {
		key: string;
		value: ProgramsStoreObject;
		indexes: {
			name: string;
		};
	};
	series: {
		key: string;
		value: SeriesStoreObject;
		indexes: {
			programId: string;
			nowShowing: number;
		};
	};
	episodes: {
		key: string;
		value: EpisodesStoreObject;
		indexes: {
			seriesId: string;
			status: [EpisodeStatus, string];
			statusWarning: [EpisodeStatus, string, Date];
			unscheduled: number;
		};
	};
	settings: {
		key: string;
		value: SettingsStoreObject;
	};
	syncs: {
		key: [ModelType, string];
		value: SyncsStoreObject;
	};
}

export interface Store {
	name?: Promise<string>;
}

export interface ProgramsStore extends Store {
	list: () => Promise<PersistedProgram[]>;
	find: (id: string) => Promise<PersistedProgram | undefined>;
	count: () => Promise<number>;
	removeAll: () => Promise<void>;
	save: (program: PersistedProgram) => Promise<void>;
	remove: (id: string) => Promise<void>;
}

export interface SeriesStore extends Store {
	listByProgram: (programId: string) => Promise<PersistedSeries[]>;
	listByNowShowing: () => Promise<PersistedSeries[]>;
	listByStatus: (status: EpisodeStatus) => Promise<PersistedSeries[]>;
	listByIncomplete: () => Promise<PersistedSeries[]>;
	find: (id: string) => Promise<PersistedSeries | undefined>;
	count: () => Promise<number>;
	removeAll: () => Promise<void>;
	save: (series: PersistedSeries) => Promise<void>;
	remove: (id: string) => Promise<void>;
}

export interface EpisodesStore extends Store {
	listBySeries: (seriesId: string) => Promise<PersistedEpisode[]>;
	listByUnscheduled: () => Promise<PersistedEpisode[]>;
	find: (id: string) => Promise<PersistedEpisode | undefined>;
	totalCount: () => Promise<number>;
	countByStatus: (status: EpisodeStatus) => Promise<number>;
	removeAll: () => Promise<void>;
	save: (episode: PersistedEpisode) => Promise<void>;
	remove: (id: string) => Promise<void>;
}

export interface SettingsStore extends Store {
	get: (name: string) => Promise<PersistedSetting | undefined>;
	save: (name: string, value: string) => Promise<string>;
	remove: (name: string) => Promise<void>;
}

export interface SyncsStore extends Store {
	list: () => Promise<PersistedSync[]>;
	count: () => Promise<number>;
	removeAll: () => Promise<void>;
	remove: (type: ModelType, id: string) => Promise<void>;
}

export interface TVManagerStore {
	programsStore: ProgramsStore;
	seriesStore: SeriesStore;
	episodesStore: EpisodesStore;
	settingsStore: SettingsStore;
	syncsStore: SyncsStore;
	version: number;
}

export interface TVManagerStoreProxy {
	connect: (expectedVersion: number) => Promise<void>;
	programsStore: ProgramsStore;
	seriesStore: SeriesStore;
	episodesStore: EpisodesStore;
	settingsStore: SettingsStore;
	syncsStore: SyncsStore;
}

// Interfaces for list results

export interface EpisodeCounts {
	episodeCount: number;
	watchedCount: number;
	recordedCount: number;
	expectedCount: number;
}

export interface ProgramEpisodeCounts extends EpisodeCounts {
	seriesCount: number;
}