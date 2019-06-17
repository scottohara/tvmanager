import {
	ListCallback,
	SerializedModel
} from "models";
import Episode from "models/episode-model";
import Program from "models/program-model";
import { PublicInterface } from "global";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

/**
 * @class HeaderFooter
 * @classdesc Anonymous object containing the properties of a view header/footer
 * @private
 * @property {String} label - the header/footer label
 * @property {NavButton} [leftButton] - the button to display on the left-hand side
 * @property {NavButton} [rightButton] - the button to display on the right-hand side
 */

export interface HeaderFooter {
	label?: string;
	leftButton?: NavButton;
	rightButton?: NavButton;
}

/**
 * @class NavButton
 * @classdesc Anonymous object containing the properties of a navigation button
 * @private
 * @property {String} style - the CSS class name to use for the button
 * @property {String} label - the button label
 */

interface NavButton {
	eventHandler?: () => void;
	style?: "backButton" | "cautionButton" | "confirmButton";
	label: string;
}

/**
 * @class View
 * @classdesc Anonymous object containing the properties of a view
 * @private
 * @property {Object} controller - instance of the view controller
 * @property {Number} scrollPos - the current scroll position for the view
 */

export interface View {
	controller: ViewController;
	scrollPos: number;
}

type ViewControllerConstructor = new(args?: object) => ViewController;

export interface ViewControllerSet {
	[key: string]: ViewControllerConstructor;
}

/**
 * @class NoticeStack
 * @classdesc Anonymous object containing the properties of the notices stack
 * @private
 * @property {Number} height - the height of the notices stack
 * @property {Array<Notice>} notice - the array of notices displayed
 */

export interface NoticeStack {
	height: number;
	notice: JQuery<HTMLElement>[];
}

/**
 * @class Notice
 * @classdesc Anonymous object containing the properties of a notice
 * @private
 * @property {String} id - unique notice identifier
 * @property {String} label - the message to be displayed
 * @property {NavButton} [leftButton] - the button to display on the left-hand side
 * @property {NavButton} [rightButton] - the button to display on the right-hand side
 */

interface Notice {
	id?: string;
	label: string | DOMString;
	leftButton?: NavButton;
	rightButton?: NavButton;
}

/**
 * @class Device
 * @classdesc Anonymous object containing the properties of a registered device
 * @private
 * @property {String} name - the name of the device
 * @property {Boolean} imported - indicates whether the device has performed a full import
 * @property {String} id - the UUID of the device
 */
export interface Device {
	id: string;
	name: string;
	imported: boolean;
}

export type SyncOperation = "Import" | "Export";

export type SyncErrorType = "Send error" | "Receive error" | "Save error" | "Delete error" | "Checksum mismatch";

export interface FullImport{
	checksum: string;
	data: SerializedModel[];
}

export interface ImportData {
	importJson: SerializedModel[];
	returnedHash: string;
}

export type ImportObject = SerializedModel & {pending: string[]; isDeleted: boolean;};

/**
 * @class EpisodeListItem
 * @classdesc Anonymous object containing the properties of an episode list item
 * @private
 * @property {Number} [listIndex] - the list index of an episode being edited
 * @property {Episode} [episode] - an episode being edited
 * @property {Number} [sequence] - the initial sequence to use for a new episode being added
 * @property {Series} [series] - the series that a new episode being added belongs to
 */
export interface EpisodeListItem {
	listIndex?: number;
	episode: PublicInterface<Episode>;
	sequence?: number;
	series?: PublicInterface<Series>;
}

/**
 * @class SeriesListItem
 * @classdesc Anonymous object containing the properties of a series list item
 * @private
 * @property {Number} [listIndex] - the list index of a series being edited
 * @property {Series} [series] - a series being edited
 * @property {String} [source] - the name of the view that we came from
 */
export interface SeriesListItem {
	listIndex?: number;
	series: PublicInterface<Series>;
	source?: string;
	program?: Program;
}

/**
 * @class ProgramListItem
 * @classdesc Anonymous object containing the properties of a program list item
 * @private
 * @property {Number} [listIndex] - the list index of a program being edited
 * @property {Program} [program] - a program being edited
 */
export interface ProgramListItem {
	listIndex?: number;
	program: PublicInterface<Program>;
}

/**
 * @class Report
 * @classdesc Anonymous object containing the properties of a report
 * @private
 * @property {String} reportName - the name of the report
 * @property {Function} dataSource - the function that returns data for the report
 * @property {Object} args - arguments to pass to the data source function
 */
export interface Report {
	reportName: string;
	dataSource: (callback: ListCallback, args: string | null) => void;
	args: string | null;
}