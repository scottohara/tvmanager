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
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import Episode from "models/episode-model";
import EpisodeListTemplate from "views/episodeListTemplate.html";
import EpisodesView from "views/episodes-view.html";
import List from "components/list";
import { PublicInterface } from "global";
import ViewController from "controllers/view-controller";

/**
 * @class EpisodesController
 * @classdesc Controller for the episodes view
 * @extends ViewController
 * @this EpisodesController
 * @property {SeriesListItem} listItem - a list item from the SeriesList, Schedule or Report view
 * @property {Boolean} scrollToFirstUnwatched - indicates whether to automatically scroll the list to reveal the first unwatched episode
 * @property {HeaderFooter} header - the view header bar
 * @property {List} episodeList - the list of episodes to display
 * @property {HeaderFooter} footer - the view footer bar
 * @param {SeriesListItem} listItem - a list item from the Series, Schedule or Report view
 */
export default class EpisodesController extends ViewController {
	private scrollToFirstUnwatched = true;

	private episodeList!: PublicInterface<List>;

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
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: `${this.listItem.series.programName} : ${this.listItem.series.seriesName}`,
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: undefined === this.listItem.source ? "Series" : this.listItem.source
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+"
			}
		};

		// Instantiate a List object
		this.episodeList = new List("list", EpisodeListTemplate, null, [], this.viewItem.bind(this), null, this.deleteItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 */
	public async activate(): Promise<void> {
		// Get the list of episodes for the specified series
		this.episodeList.items = await Episode.listBySeries(String(this.listItem.series.id));

		// Refresh the list
		this.episodeList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method contentShown
	 * @desc Called after the controller content is visible
	 */
	public contentShown(): void {
		// If necessary, scroll to the first unwatched episode
		if (this.scrollToFirstUnwatched) {
			// Find the first unwatched episode
			const firstUnwatched: PublicInterface<Episode> | undefined = this.episodeList.items.find((item: Episode): boolean => "Watched" !== item.status) as PublicInterface<Episode> | undefined;

			if (undefined !== firstUnwatched) {
				this.episodeList.scrollTo(String(firstUnwatched.id));
			}

			this.scrollToFirstUnwatched = false;
		}
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	private async goBack(): Promise<void> {
		return this.appController.popView(this.listItem);
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episode view for editing an episode
	 * @param {Number} listIndex - the list index of the episode to edit
	 */
	private async viewItem(listIndex: number): Promise<void> {
		const episode = this.episodeList.items[listIndex] as Episode;

		// Display the Episode view
		return this.appController.pushView("episode", { listIndex, episode });
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method addItem
	 * @desc Displays the Episode view for adding an episode
	 */
	private async addItem(): Promise<void> {
		return this.appController.pushView("episode", { series: this.listItem.series, sequence: this.episodeList.items.length });
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method deleteItem
	 * @desc Deletes an episode from the list
	 * @param {Number} listIndex - the list index of the episode to delete
	 */
	private async deleteItem(listIndex: number): Promise<void> {
		// Get the deleted episode
		const episode = this.episodeList.items[listIndex] as Episode;

		// Remove the item from the DOM
		$(`#list li a#${episode.id}`).remove();

		// Remove the item from the database
		await episode.remove();

		// Remove the item from the list
		this.episodeList.items.splice(listIndex, 1);

		// Resequence the remaining items
		return this.resequenceItems();
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method deleteItems
	 * @desc Sets the list to delete mode
	 */
	private async deleteItems(): Promise<void> {
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
			label: `v${(await DatabaseService).version}`,
			rightButton: {
				eventHandler: this.viewItems.bind(this) as NavButtonEventHandler,
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
	private async resequenceItems(): Promise<void> {
		const self: this = this,
					episodes: Promise<string | undefined>[] = [];

		// Iterate over the HTML DOM elements in the list
		$("#list li a").each((index: number, item: HTMLElement): void => {
			// Only update items that have changed position
			if ($(item).attr("id") !== (self.episodeList.items[index] as Episode).id) {
				// Iterate over the list items array
				for (const episode of (self.episodeList.items as Episode[])) {
					// If the array item at this position is not the same as the HTML DOM element at the same position, update the item's sequence in the database
					if (episode.id === $(item).attr("id")) {
						episode.sequence = index;
						episodes.push(episode.save());

						// Stop after the first update
						break;
					}
				}
			}
		});

		await Promise.all(episodes);

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
	private async editItems(): Promise<void> {
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
				sort: this.sortItems.bind(this) as JQueryUI.SortableEvent
			});

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`,
			leftButton: {
				eventHandler: async (): Promise<void> => {
					await this.resequenceItems();

					return this.viewItems();
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

		$(ui.helper).offset({ top: e.clientY - PADDING_PX });
	}

	/**
	 * @memberof EpisodesController
	 * @this EpisodesController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private async viewItems(): Promise<void> {
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
			label: `v${(await DatabaseService).version}`,
			leftButton: {
				eventHandler: this.editItems.bind(this) as NavButtonEventHandler,
				label: "Sort"
			},
			rightButton: {
				eventHandler: this.deleteItems.bind(this) as NavButtonEventHandler,
				style: "cautionButton",
				label: "Delete"
			}
		};

		// Set the view footer
		this.appController.setFooter();
	}
}