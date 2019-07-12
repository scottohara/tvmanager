/**
 * @file (Controllers) EpisodeController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/episode-controller
 * @requires jquery
 * @requires models/episode-model
 * @requires framework/spinningwheel
 * @requires components/toucheventproxy
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Episode from "models/episode-model";
import { EpisodeListItem } from "controllers";
import { EpisodeStatus } from "models";
import EpisodeView from "views/episode-view.html";
import Series from "models/series-model";
import SpinningWheel from "framework/spinningwheel";
import TouchEventProxy from "components/toucheventproxy";
import ViewController from "controllers/view-controller";

enum Months {Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec}

/**
 * @class EpisodeController
 * @classdesc Controller for the episode view
 * @extends ViewController
 * @this EpisodeController
 * @property {EpisodeListItem} listItem - a list item from the Episodes or Unscheduled view
 * @property {String} originalStatus - the status of the episode when the view is first loaded
 * @property {String} originalStatusDate - the status date of the episode when the view is first loaded
 * @property {HeaderFooter} header - the view header bar
 * @property {Boolean} settingStatus - indicates that the status is currently being set
 * @property {TouchEventProxy} swtoucheventproxy - remaps touch events for the SpinningWheel
 * @param {EpisodeListItem} listItem - a list item from the Episodes or Unscheduled view
 */
export default class EpisodeController extends ViewController {
	public swtoucheventproxy: TouchEventProxy | null = null;

	private readonly listItem: EpisodeListItem;

	private readonly originalStatus: EpisodeStatus = "";

	private readonly originalStatusDate: string = "";

	private settingStatus = false;

	public constructor(listItem: EpisodeListItem) {
		super();

		// If the passed item has an index, we're editing an existing episode
		if (Number(listItem.listIndex) >= 0) {
			this.listItem = listItem;
			this.originalStatus = this.listItem.episode.status;
			this.originalStatusDate = this.listItem.episode.statusDate;
		} else {
			// Otherwise, we're adding a new episode
			this.listItem = { episode: new Episode(null, "", "", "", false, false, Number(listItem.sequence), (listItem.series as Series).id) };
		}
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return EpisodeView;
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Episode",
			leftButton: {
				eventHandler: this.cancel.bind(this),
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this),
				style: "confirmButton",
				label: "Save"
			}
		};

		// Set the episode details
		$("#episodeName").val(String(this.listItem.episode.episodeName));
		$("#unverified").prop("checked", this.listItem.episode.unverified);
		$("#unscheduled").prop("checked", this.listItem.episode.unscheduled);

		// Bind events for all of the buttons/controls
		$("#watched").on("click", (): void => this.setStatus("Watched"));
		$("#recorded").on("click", (): void => this.setStatus("Recorded"));
		$("#expected").on("click", (): void => this.setStatus("Expected"));
		$("#missed").on("click", (): void => this.setStatus("Missed"));
		$("#statusDate").on("click", this.getStatusDate.bind(this));
		$("#unscheduled").on("click", this.toggleStatusDateRow.bind(this));

		// Toggle the current status
		const { status }: {status: EpisodeStatus;} = this.listItem.episode;

		this.listItem.episode.setStatus("");
		this.setStatus(status);

		// Set the status date
		$("#statusDate").val(this.listItem.episode.statusDate);

		return Promise.resolve();
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method save
	 * @desc Saves the episode details to the database and returns to the previous view
	 */
	private async save(): Promise<void> {
		const PREVIOUS_VIEW_OFFSET = 2;

		// Get the episode details
		this.listItem.episode.episodeName = String($("#episodeName").val());
		this.listItem.episode.setUnverified($("#unverified").is(":checked"));
		this.listItem.episode.unscheduled = $("#unscheduled").is(":checked");

		// Update the database
		await this.listItem.episode.save();

		// If a new episode was added, scroll the Episodes view to the end of the list to reveal the new item
		if (isNaN(Number(this.listItem.listIndex)) || Number(this.listItem.listIndex) < 0) {
			this.appController.viewStack[this.appController.viewStack.length - PREVIOUS_VIEW_OFFSET].scrollPos = -1;
		}

		// Pop the view off the stack
		return this.appController.popView(this.listItem);
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method cancel
	 * @desc Reverts any changes and returns to the previous view
	 */
	private cancel(): Promise<void> {
		// Revert to the original episode details
		this.listItem.episode.status = this.originalStatus;
		this.listItem.episode.statusDate = this.originalStatusDate;

		// Pop the view off the stack
		return this.appController.popView();
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method setStatus
	 * @desc Toggles the episode status
	 * @param {String} status - the episode status
	 */
	private setStatus(status: EpisodeStatus): void {
		// Only proceed if the status is not already being set
		if (!this.settingStatus) {
			// Set the setting flag
			this.settingStatus = true;

			// Reset the current view
			$("#watched").removeClass();
			$("#recorded").removeClass();
			$("#expected").removeClass();
			$("#missed").removeClass();
			$("#unverifiedRow").hide();

			// If the current status was passed, toggle (ie. reset) the episode status
			if (this.listItem.episode.status === status) {
				this.listItem.episode.setStatus("");
			} else {
				// Otherwise set the status to the passed value and update the view
				this.listItem.episode.setStatus(status);
				switch (status) {
					case "Watched":
						$("#watched").addClass("status");
						break;

					case "Recorded":
						$("#recorded").addClass("status");
						$("#unverifiedRow").show();
						break;

					case "Expected":
						$("#expected").addClass("status");
						$("#unverifiedRow").show();
						break;

					case "Missed":
						$("#missed").addClass("status");
						$("#unverifiedRow").show();
						break;

					// No default
				}
			}

			// Check if the status date needs to be shown/hidden
			this.toggleStatusDateRow();

			// Clear the setting flag
			this.settingStatus = false;
		}
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method getStatusDate
	 * @desc Displays a SpinningWheel control for capturing the episode status date
	 */
	private getStatusDate(): void {
		// Setup a dictionary of months and split the current status date on the dashes into date and month parts
		const parts: (number | string)[] = this.listItem.episode.statusDate.split("-"),
					MIN_PARTS = 2;

		// If we don't have enough parts (ie. no date set), default to today's date
		if (parts.length < MIN_PARTS) {
			const today: Date = new Date();

			parts[0] = today.getDate();
			parts[1] = Months[today.getMonth()];
		} else {
			// Otherwise cast the date part to a number
			parts[0] = Number(parts[0]);
		}

		// Initialise the SpinningWheel with two slots, for date and month; and show the control
		SpinningWheel.addSlot<number>({
			1: "01",
			2: "02",
			3: "03",
			4: "04",
			5: "05",
			6: "06",
			7: "07",
			8: "08",
			9: "09",
			10: "10",
			11: "11",
			12: "12",
			13: "13",
			14: "14",
			15: "15",
			16: "16",
			17: "17",
			18: "18",
			19: "19",
			20: "20",
			21: "21",
			22: "22",
			23: "23",
			24: "24",
			25: "25",
			26: "26",
			27: "27",
			28: "28",
			29: "29",
			30: "30",
			31: "31"
		}, "right", Number(parts[0]));

		SpinningWheel.addSlot<string>({ Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", May: "May", Jun: "Jun", Jul: "Jul", Aug: "Aug", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec" }, null, String(parts[1]));
		SpinningWheel.setDoneAction(this.setStatusDate.bind(this));
		SpinningWheel.open();

		// SpinningWheel only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
		this.swtoucheventproxy = new TouchEventProxy($("#sw-wrapper").get(0));
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method setStatusDate
	 * @desc Gets the selected value from the SpinningWheel and updates the model and view
	 */
	private setStatusDate(): void {
		// Update the model with the selected values in the SpinningWheel
		this.listItem.episode.setStatusDate(SpinningWheel.getSelectedValues<string>().values.join("-"));

		// Update the view
		$("#statusDate").val(this.listItem.episode.statusDate);

		// Remove the touch event proxy
		this.swtoucheventproxy = null;
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method toggleStatusDateRow
	 * @desc Shows/hides the status date based on the current episode details
	 */
	private toggleStatusDateRow(): void {
		// Hide the status date
		$("#statusDateRow").hide();

		// Show the status date if certain criteria is met
		if ($("#unscheduled").is(":checked") || "Recorded" === this.listItem.episode.status || "Expected" === this.listItem.episode.status || "Missed" === this.listItem.episode.status) {
			$("#statusDateRow").show();

			// If no date has been specified, prompt the user for a date
			if ("" === this.listItem.episode.statusDate) {
				this.getStatusDate();
			}
		}
	}
}