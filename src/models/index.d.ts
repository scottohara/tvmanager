import Base from "models/base-model";
import Episode from "models/episode-model";
import Program from "models/program-model";
import { PublicInterface } from "global";
import Series from "models/series-model";

export type EpisodeStatus = "Watched" | "Recorded" | "Expected" | "Missed" | "";

export type SyncAction = "modified" | "deleted";

export type SaveCallback = (id?: string | boolean | null) => void;

export type ListCallback = (list: Base[]) => void;

export type CountCallback = (count: number) => void;

export type FindCallback = (model?: PublicInterface<Base> | null) => void;

export type RemoveCallback = (message?: string) => void;

export type ModelType = "Episode" | "Program" | "Series";

export type Model = Program | Series | Episode;

export type SerializedModel = SerializedProgram | SerializedSeries | SerializedEpisode;

export interface PersistedProgram {
	rowid: number;
	ProgramID: string;
	Name: string;
	SeriesCount: number;
	EpisodeCount: number;
	WatchedCount: number;
	RecordedCount: number;
	ExpectedCount: number;
}

export interface PersistedSeries {
	rowid: number;
	SeriesID: string;
	Name: string;
	NowShowing: number;
	ProgramID: string;
	ProgramName: string;
	EpisodeCount: number;
	WatchedCount: number;
	RecordedCount: number;
	ExpectedCount: number;
	MissedCount: number;
	StatusWarningCount: number;
}

export interface PersistedEpisode {
	rowid: number;
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

export interface StandardQuery {
	baseData: string;
	summaryData: string;
	entityList: string;
}

export interface NowShowingEnum {
	[key: number]: string;
}
