import type Episode from "~/models/episode-model";
import type Program from "~/models/program-model";
import type { PublicInterface } from "~/global";
import type { SerializedModel } from "~/models";
import type Series from "~/models/series-model";
import type ViewController from "~/controllers/view-controller";

export type NavButtonEventHandler = () => void;
export type NavButtonAsyncEventHandler = () => Promise<void>;

interface NavButton {
	eventHandler?: NavButtonEventHandler;
	style?: "backButton" | "cautionButton" | "confirmButton";
	label: string;
}

export interface HeaderFooter {
	label?: string;
	leftButton?: NavButton;
	rightButton?: NavButton;
}

export interface View {
	controller: ViewController;
	scrollPos: number;
}

export interface NoticeStack {
	height: number;
	notice: HTMLDivElement[];
}

interface Notice {
	id?: string;
	label: string;
}

export interface Device {
	id: string;
	name: string;
	imported: boolean;
}

export type SyncOperation = "Export" | "Import";

export type SyncErrorType =
	| "Delete error"
	| "Receive error"
	| "Save error"
	| "Send error";

export type ImportObject = SerializedModel & {
	pending: string[];
	isDeleted: boolean;
};

export interface ImportDoc {
	doc: ImportObject;
}

export interface EpisodeListItem {
	listIndex?: number;
	episode: PublicInterface<Episode>;
	sequence?: number;
	series?: PublicInterface<Series>;
}

export interface SeriesListItem {
	listIndex?: number;
	series: PublicInterface<Series>;
	source?: string;
	program?: PublicInterface<Program>;
	sequence?: number;
}

export interface ProgramListItem {
	listIndex?: number;
	program: PublicInterface<Program>;
}

export type ReportDataSource = (
	args?: string,
) => Promise<PublicInterface<Series>[]>;

export interface Report {
	reportName: string;
	dataSource: ReportDataSource;
	args?: string;
}

type ViewControllerArgs =
	| EpisodeListItem
	| ProgramListItem
	| Report
	| SeriesListItem;
type ViewControllerConstructor = new (
	args?: ViewControllerArgs,
) => ViewController;
export type ViewControllerSet = Record<string, ViewControllerConstructor>;
