/**
 * @file (Controllers) EpisodesController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/episodes-controller
 * @requires jquery-ui/ui/widgets/sortable
 * @requires jquery-ui-touch-punch
 * @requires jquery
 * @requires models/episode-model
 * @requires components/list
 * @requires controllers/view-controller
 */
import "jquery-ui/ui/widgets/sortable";
import "jquery-ui-touch-punch";
import {
	EpisodeListItem,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import Episode from "models/episode-model";
import EpisodeListTemplate from "views/episodeListTemplate.html";
import EpisodesView from "views/episodes-view.html";
import List from "components/list";
import {PublicInterface} from "global";
import ViewController from "controllers/view-controller";
import window from "components/window";

/**
 * @class EpisodesController
 * @classdesc Controller for the episodes view
 * @extends ViewController
 * @this EpisodesController
 * @property {SeriesListItem} listItem - a list item from the SeriesList, Schedule or Report view
 * @property {Boolean} scrollToFirstUnwatched - indicates whether to automatically scroll the list to reveal the first unwatched episode
 * @property {HeaderFooter} header - the view header bar
 * @property {List} episodeList - the list of episodes to display
 * @property {Number} origWatchedCount - the watched status of an episode before editing
 * @property {Number} origRecordedCount - the recorded status of an episode before editing
 * @property {Number} origExpectedCount - the expected status of an episode before editing
 * @property {Number} origStatusWarningCount - the warning status of and episode before editing
 * @property {HeaderFooter} footer - the view footer bar
 * @param {SeriesListItem} listItem - a list item from the Series, Schedule or Report view
 */
export default class EpisodesController extends ViewController {
	private scrollToFirstUnwatched = true;

	private episodeList!: PublicInterface<List>;

	private origWatchedCount = 0;

	private origRecordedCount = 0;

	private origExpectedCount = 0;

	private origStatusWarningCount = 0;

	public constructor(private readonly listItem: SeriesListItem) {
		super();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return EpisodesView;
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public setup(): void {
		// Setup the header
		this.header = {
			label: `${this.listItem.series.programName} : ${this.listItem.series.seriesName}`,
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: this.listItem.source || "Series"
			},
			rightButton: {
				eventHandler: this.addItem.bind(this),
				label: "+"
			}
		};

		// Instantiate a List object
		this.episodeList = new List("list", EpisodeListTemplate, null, [], this.viewItem.bind(this), null, this.deleteItem.bind(this));

		// Get the list of episodes for the specified series
		Episode.listBySeries(String(this.listItem.series.id), this.listRetrieved.bind(this));
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 * @param {EpisodeListItem} [listItem] - a list item that was just added/edited in the Episode view
	 */
	public activate(listItem?: EpisodeListItem): void {
		// When returning from the Episode view, we need to update the list with the new values
		if (listItem) {
			// Get the details of the added/edited episode
			const newWatchedCount: number = "Watched" === listItem.episode.status ? 1 : 0,
						newRecordedCount: number = "Recorded" === listItem.episode.status ? 1 : 0,
						newExpectedCount: number = "Expected" === listItem.episode.status ? 1 : 0,
						newStatusWarningCount: number = "warning" === listItem.episode.statusWarning ? 1 : 0;

			// If an existing episode was edited, increment/decrement the status counts for the series
			if (Number(listItem.listIndex) >= 0) {
				this.episodeList.items[Number(listItem.listIndex)] = listItem.episode;
				this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + (newWatchedCount - this.origWatchedCount));
				this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + (newRecordedCount - this.origRecordedCount));
				this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + (newExpectedCount - this.origExpectedCount));
				this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + (newStatusWarningCount - this.origStatusWarningCount));
			} else {
				// Otherwise add the new episode to the list and increment the status counts for the series
				this.episodeList.items.push(listItem.episode);
				this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount + 1);
				this.listItem.series.setWatchedCount(this.listItem.series.watchedCount + newWatchedCount);
				this.listItem.series.setRecordedCount(this.listItem.series.recordedCount + newRecordedCount);
				this.listItem.series.setExpectedCount(this.listItem.series.expectedCount + newExpectedCount);
				this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount + newStatusWarningCount);
			}
		}

		// Refresh the list
		this.episodeList.refresh();

		// If necessary, scroll to the first unwatched episode
		if (this.scrollToFirstUnwatched) {
			const DELAY_MS = 300;

			window.setTimeout((): void => {
				// Find the first unwatched episode
				const firstUnwatched: Episode | undefined = this.episodeList.items.find((item: Episode): boolean => "Watched" !== item.status) as Episode;

				if (firstUnwatched) {
					this.episodeList.scrollTo(String(firstUnwatched.id));
				}

				this.scrollToFirstUnwatched = false;
			}, DELAY_MS);
		}

		// Set to view mode
		this.viewItems();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method listRetrieved
	 * @desc Callback function after the list of episodes is retrieved
	 * @param {Array<Episode>} episodeList - array of episode objects
	 */
	private listRetrieved(episodeList: PublicInterface<Episode>[]): void {
		// Set the list items
		this.episodeList.items = episodeList;

		// Activate the controller
		this.activate();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	private goBack(): void {
		this.appController.popView(this.listItem);
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episode view for editing an episode
	 * @param {Number} listIndex - the list index of the episode to edit
	 */
	private viewItem(listIndex: number): void {
		const episode = this.episodeList.items[listIndex] as Episode;

		// Save the current episode details
		this.origWatchedCount = "Watched" === episode.status ? 1 : 0;
		this.origRecordedCount = "Recorded" === episode.status ? 1 : 0;
		this.origExpectedCount = "Expected" === episode.status ? 1 : 0;
		this.origStatusWarningCount = episode.statusWarning ? 1 : 0;

		// Display the Episode view
		this.appController.pushView("episode", {listIndex, episode});
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method addItem
	 * @desc Displays the Episode view for adding an episode
	 */
	private addItem(): void {
		this.appController.pushView("episode", {series: this.listItem.series, sequence: this.episodeList.items.length});
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method deleteItem
	 * @desc Deletes an episode from the list
	 * @param {Number} listIndex - the list index of the episode to delete
	 */
	private deleteItem(listIndex: number): void {
		// Get the details of the deleted episode
		const episode = this.episodeList.items[listIndex] as Episode,
					newWatchedCount = "Watched" === episode.status ? 1 : 0,
					newRecordedCount = "Recorded" === episode.status ? 1 : 0,
					newExpectedCount = "Expected" === episode.status ? 1 : 0,
					newStatusWarningCount = "warning" === episode.statusWarning ? 1 : 0;

		// Decrement the status counts for the series
		this.listItem.series.setEpisodeCount(this.listItem.series.episodeCount - 1);
		this.listItem.series.setWatchedCount(this.listItem.series.watchedCount - newWatchedCount);
		this.listItem.series.setRecordedCount(this.listItem.series.recordedCount - newRecordedCount);
		this.listItem.series.setExpectedCount(this.listItem.series.expectedCount - newExpectedCount);
		this.listItem.series.setStatusWarning(this.listItem.series.statusWarningCount - newStatusWarningCount);

		// Remove the item from the DOM
		$(`#list li a#${episode.id}`).remove();

		// Remove the item from the database
		episode.remove();

		// Remove the item from the list
		this.episodeList.items.splice(listIndex, 1);

		// Resequence the remaining items
		this.resequenceItems();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method deleteItems
	 * @desc Sets the list to delete mode
	 */
	private deleteItems(): void {
		// Set the list to delete mode
		this.episodeList.setAction("delete");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		$("#list")
			.removeClass()
			.addClass("delete");

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			rightButton: {
				eventHandler: this.viewItems.bind(this),
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method resequenceItems
	 * @desc Updates the sequence number of list items based on their current position in the list
	 */
	private resequenceItems(): void {
		const self: this = this;

		// Iterate over the HTML DOM elements in the list
		$("#list li a").each((index: number, item: HTMLElement): void => {
			// Only update items that have changed position
			if ($(item).attr("id") !== (self.episodeList.items[index] as Episode).id) {
				// Iterate over the list items array
				for (let i = 0; i < self.episodeList.items.length; i++) {
					const episode = self.episodeList.items[i] as Episode;

					// If the array item at this position is not the same as the HTML DOM element at the same position, update the item's sequence in the database
					if (episode.id === $(item).attr("id")) {
						episode.sequence = index;
						episode.save();

						// Stop after the first update
						break;
					}
				}
			}
		});

		// Resort the list items based on the update sequences
		this.episodeList.items = this.episodeList.items.sort((a: Episode, b: Episode): number => (a.sequence < b.sequence ? -1 : a.sequence > b.sequence ? 1 : 0));

		// Refresh the list
		this.episodeList.refresh();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method editItems
	 * @desc Sets the list to edit mode
	 */
	private editItems(): void {
		// Set the list to edit mode
		this.episodeList.setAction("edit");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the edit icons next to each list item, and make the list sortable
		$("#list")
			.removeClass()
			.addClass("edit")
			.sortable({
				axis: "y",
				sort: this.sortItems
			});

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			leftButton: {
				eventHandler: (): void => {
					this.resequenceItems();
					this.viewItems();
				},
				style: "confirmButton",
				label: "Done"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method sortItems
	 * @desc Repositions the sort helper when sorting the list items
	 */
	private sortItems(e: JQueryEventObject, ui: JQueryUI.SortableUIParams): void {
		const PADDING_PX = 20;

		$(ui.helper).offset({top: e.clientY - PADDING_PX});
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private viewItems(): void {
		// Set the list to view mode
		this.episodeList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Make the list unsortable
		$("#list.ui-sortable")
			.removeClass()
			.sortable("destroy");

		// Show the view icons next to each list item
		$("#list").removeClass();

		// Setup the footer
		this.footer = {
			label: `v${this.appController.db.version}`,
			leftButton: {
				eventHandler: this.editItems.bind(this),
				label: "Sort"
			},
			rightButton: {
				eventHandler: this.deleteItems.bind(this),
				style: "cautionButton",
				label: "Delete"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}