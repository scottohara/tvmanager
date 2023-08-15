import type Episode from "~/models/episode-model";
import type Program from "~/models/program-model";
import type { PublicInterface } from "~/global";
import type Series from "~/models/series-model";

export interface Section {
	label: number | string;
	percent: number;
	style: string;
}

export type ListAction = "delete" | "edit" | "view";
export type ListEventHandler = (index: number) => void;
export type ListItem = PublicInterface<Episode | Program | Series>;