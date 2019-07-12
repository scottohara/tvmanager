import Episode from "models/episode-model";
import Program from "models/program-model";
import Series from "models/series-model";

export type EpisodeStatus = "Watched" | "Recorded" | "Expected" | "Missed" | "";

export type SyncAction = "modified" | "deleted";

export type ModelType = "Episode" | "Program" | "Series";

export type Model = Program | Series | Episode;

export interface NowShowingEnum {
	[key: number]: string;
}

// Interfaces for persisting to local storage (IndexedDb)

export interface PersistedProgram {
	rowid?: number;
	ProgramID: string;
	Name: string;
	SeriesCount?: number;
	EpisodeCount?: number;
	WatchedCount?: number;
	RecordedCount?: number;
	ExpectedCount?: number;
}

export interface PersistedSeries {
	rowid?: number;
	SeriesID: string;
	Name: string;
	NowShowing: number | null;
	ProgramID: string;
	ProgramName?: string;
	EpisodeCount?: number;
	WatchedCount?: number;
	RecordedCount?: number;
	ExpectedCount?: number;
	MissedCount?: number;
	StatusWarningCount?: number;
}

export interface PersistedEpisode {
	rowid?: number;
	EpisodeID: string;
	Name: string;
	Status: EpisodeStatus;
	StatusDate: string;
	Unverified: "true" | "false";
	Unscheduled: "true" | "false";
	Sequence: number;
	SeriesID: string;
	SeriesName?: string;
	ProgramID?: string;
	ProgramName?: string;
}

export interface PersistedSync {
	Type: ModelType;
	ID: string;
	Action: SyncAction;
}

interface PersistedSetting {
	name: string;
	value: string;
}

// Interfaces for import/exporting to remote storage (CouchDb)

export type SerializedModel = SerializedProgram | SerializedSeries | SerializedEpisode;

export interface SerializedProgram {
	id: string | null;
	programName: string | null;
	type: "Program";
}

export interface SerializedSeries {
	id: string | null;
	seriesName: string | null;
	nowShowing: number | null;
	programId: string | null;
	type: "Series";
}

export interface SerializedEpisode {
	id: string | null;
	episodeName: string | null;
	seriesId: string | null;
	status: EpisodeStatus;
	statusDate: string;
	unverified: boolean;
	unscheduled: boolean;
	sequence: number;
	type: "Episode";
}