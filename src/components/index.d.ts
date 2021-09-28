import type Episode from "models/episode-model";
import type Program from "models/program-model";
import type { PublicInterface } from "global";
import type Series from "models/series-model";

/**
 * @class Section
 * @classdesc Anonymous object containing the properties of a progress bar section
 * @private
 * @property {String} label - the label to display in the section
 * @property {Number} percent - the percent of the total for this section (0-100)
 * @property {String} style - a CSS class name to use for the section
 */

export interface Section {
	label: number | string;
	percent: number;
	style: string;
}

export type ListAction = "delete" | "edit" | "view";
export type ListEventHandler = (index: number) => void;
export type ListItem = PublicInterface<Episode | Program | Series>;

export interface SyntheticTouch {
	identifier?: -1;
	clientX?: number;
	clientY?: number;
	target?: EventTarget | null;
}

export interface SyntheticTouchEvent {
	targetTouches?: SyntheticTouch[];
	changedTouches?: SyntheticTouch[];
}