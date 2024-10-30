import type { EpisodeStatus } from "~/models";

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
