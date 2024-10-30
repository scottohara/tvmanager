export type EpisodeStatus = "" | "expected" | "missed" | "recorded" | "watched";

interface JsonModel {
	id: number | null;
	name: string;
}

type JsonProgram = JsonModel;

export interface JsonProgramWithCounts extends JsonProgram {
	series_count: number;
	episode_count: number;
	watched_count: number;
	recorded_count: number;
	expected_count: number;
}

export interface JsonSeries extends JsonModel {
	now_showing: number | null;
	program_id: number;
}

export interface JsonSeriesWithCounts extends JsonSeries {
	program_name: string;
	episode_count: number;
	watched_count?: number;
	recorded_count?: number;
	expected_count?: number;
	missed_count?: number;
	status_warning_count?: number;
}

export interface JsonEpisode extends JsonModel {
	status: EpisodeStatus;
	status_date: string;
	unverified: boolean;
	unscheduled: boolean;
	sequence: number;
	series_id: number;
}

export interface JsonEpisodeWithNames extends JsonEpisode {
	series_name: string;
	program_name: string;
}
