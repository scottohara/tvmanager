import type Episode from "~/models/episode-model";
import type Program from "~/models/program-model";
import type { PublicInterface } from "~/global";
import type Series from "~/models/series-model";
import type ViewController from "~/controllers/view-controller";

export type ClickEventHandler = () => Promise<void> | void;
export type ClickEventListener = () => void;

interface NavButton<T = ClickEventHandler> {
	eventHandler?: T;
	style?: "backButton" | "cautionButton" | "confirmButton";
	label: string;
}

export interface HeaderFooter<T = ClickEventHandler> {
	label?: string;
	leftButton?: NavButton<T>;
	rightButton?: NavButton<T>;
}

export interface View {
	controller: ViewController;
	scrollPos: number;
}

interface Notice {
	id?: string;
	label: string;
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

export interface ReportConfig {
	reportName: string;
	dataSource: ReportDataSource;
	args?: string;
}

type ViewControllerArgs =
	EpisodeListItem | ProgramListItem | ReportConfig | SeriesListItem;
type ViewControllerConstructor = new (
	args?: ViewControllerArgs,
) => ViewController;
export type ViewControllerSet = Record<string, ViewControllerConstructor>;
