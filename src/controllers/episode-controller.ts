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
 * @requires controllers/view-controller
 */
import {
	EpisodeListItem,
	NavButtonEventHandler
} from "controllers";
import $ from "jquery";
import Episode from "models/episode-model";
import { EpisodeStatus } from "models";
import EpisodeView from "views/episode-view.html";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

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
 * @param {EpisodeListItem} listItem - a list item from the Episodes or Unscheduled view
 */
export default class EpisodeController extends ViewController {
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
			this.listItem = { episode: new Episode(null, `Episode ${Number(listItem.sequence) + 1}`, "", "", (listItem.series as Series).id, false, false, Number(listItem.sequence)) };
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
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Episode",
			leftButton: {
				eventHandler: this.cancel.bind(this) as NavButtonEventHandler,
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Save"
			}
		};

		// Set the episode details
		$("#episodeName").val(String(this.listItem.episode.episodeName));
		$("#statusDate").val(this.listItem.episode.statusDate);
		$("#unverified").prop("checked", this.listItem.episode.unverified);
		$("#unscheduled").prop("checked", this.listItem.episode.unscheduled);

		// Bind events for all of the buttons/controls
		$("#watched").on("click", (): void => this.setStatus("Watched"));
		$("#recorded").on("click", (): void => this.setStatus("Recorded"));
		$("#expected").on("click", (): void => this.setStatus("Expected"));
		$("#missed").on("click", (): void => this.setStatus("Missed"));
		$("#unscheduled").on("click", this.toggleStatusDateRow.bind(this));

		// Toggle the current status
		const { status }: {status: EpisodeStatus;} = this.listItem.episode;

		this.listItem.episode.status = "";
		this.setStatus(status);

		return Promise.resolve();
	}

	/**
	 * @memberof EpisodeController
	 * @this EpisodeController
	 * @instance
	 * @method contentShown
	 * @desc Called after the controller content is visible
	 */
	public contentShown(): void {
		// If we're adding a new episode, focus and select the episode name
		if (undefined === this.listItem.listIndex) {
			$("#episodeName").select();
		}
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
		this.listItem.episode.statusDate = String($("#statusDate").val());
		this.listItem.episode.unverified = $("#unverified").is(":checked");
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
	private async cancel(): Promise<void> {
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
				this.listItem.episode.status = "";
			} else {
				// Otherwise set the status to the passed value and update the view
				this.listItem.episode.status = status;
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

					default:
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
	 * @method toggleStatusDateRow
	 * @desc Shows/hides the status date based on the current episode details
	 */
	private toggleStatusDateRow(): void {
		// Hide the status date
		$("#statusDateRow").hide();

		// Show the status date if certain criteria is met
		if ($("#unscheduled").is(":checked") || "Recorded" === this.listItem.episode.status || "Expected" === this.listItem.episode.status || "Missed" === this.listItem.episode.status) {
			$("#statusDateRow").show();
		}
	}
}