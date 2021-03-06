import Episode from "models/episode-model";
import Program from "models/program-model";
import { PublicInterface } from "global";
import Series from "models/series-model";

/**
 * @class Section
 * @classdesc Anonymous object containing the properties of a progress bar section
 * @private
 * @property {String} label - the label to display in the section
 * @property {Number} percent - the percent of the total for this section (0-100)
 * @property {String} style - a CSS class name to use for the section
 */

export interface Section {
	label: string | number;
	percent: number;
	style: string;
}

export type ListAction = "view" | "edit" | "delete";
export type ListEventHandler = (index: number) => void;
export type ListItem = PublicInterface<Program | Series | Episode>;

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