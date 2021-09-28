import type { EpisodeStatus } from "models";

export interface Progress {
	watched?: number;
	recorded?: number;
	expected?: number;
	missed?: number;
	noStatus?: number;
}

export interface ListItem {
	label: string;
	progress?: Progress;
	warning?: boolean;
}

export interface EpisodeListItem {
	label: string;
	status?: EpisodeStatus;
	statusDateSubText?: string;
	unverifiedClass?: boolean;
	warning?: boolean;
}

/*
 * Interfaces for managing test data to populate the database with
 */
interface TestEpisode {
	episodeName?: string;
	status?: EpisodeStatus;
	statusDate?: string;
	unverified?: "false" | "true";
	unscheduled?: "false" | "true";
}

interface TestSeries {
	seriesName?: string;
	nowShowing?: number | null;
	episodes: TestEpisode[];
}

interface TestProgram {
	programName?: string;
	series: TestSeries[];
}

interface TestSetting {
	name: string;
	value: string;
}

export interface TestData {
	programs?: TestProgram[];
	settings?: TestSetting[];
}