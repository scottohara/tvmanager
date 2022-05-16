import type {
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import DatabaseService from "services/database-service";
import Episode from "models/episode-model";
import EpisodeListTemplate from "views/episodeListTemplate.html";
import EpisodesView from "views/episodes-view.html";
import List from "components/list";
import type { PublicInterface } from "global";
import Sortable from "sortablejs";
import ViewController from "controllers/view-controller";

export default class EpisodesController extends ViewController {
	private scrollToFirstUnwatched = true;

	private episodeList!: PublicInterface<List>;

	private sortable!: Sortable;

	public constructor(private readonly listItem: SeriesListItem) {
		super();
	}

	public get view(): string {
		return EpisodesView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: `${this.listItem.series.programName} : ${this.listItem.series.seriesName}`,
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: this.listItem.source ?? "Series"
			},
			rightButton: {
				eventHandler: this.addItem.bind(this) as NavButtonEventHandler,
				label: "+"
			}
		};

		// Instantiate a List object
		this.episodeList = new List("list", EpisodeListTemplate, null, [], this.viewItem.bind(this), null, this.deleteItem.bind(this));

		// Prepare the list for sorting
		this.sortable = Sortable.create(this.list, {
			disabled: true,
			animation: 150
		});

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		// Get the list of episodes for the specified series
		this.episodeList.items = await Episode.listBySeries(String(this.listItem.series.id));

		// Refresh the list
		this.episodeList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	public override contentShown(): void {
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

	private async goBack(): Promise<void> {
		return this.appController.popView(this.listItem);
	}

	private async viewItem(listIndex: number): Promise<void> {
		const episode = this.episodeList.items[listIndex] as Episode;

		// Display the Episode view
		return this.appController.pushView("episode", { listIndex, episode });
	}

	private async addItem(): Promise<void> {
		return this.appController.pushView("episode", { series: this.listItem.series, sequence: this.episodeList.items.length });
	}

	private async deleteItem(listIndex: number): Promise<void> {
		// Get the deleted episode
		const episode = this.episodeList.items[listIndex] as Episode;

		// Remove the item from the DOM
		(this.list.querySelector(`li a#item-${episode.id}`) as HTMLAnchorElement).remove();

		// Remove the item from the database
		await episode.remove();

		// Remove the item from the list
		this.episodeList.items.splice(listIndex, 1);

		// Resequence the remaining items
		return this.resequenceItems();
	}

	private async deleteItems(): Promise<void> {
		// Set the list to delete mode
		this.episodeList.setAction("delete");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		this.list.className = "";
		this.list.classList.add("delete");

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

	private async resequenceItems(): Promise<void> {
		const self: this = this,
					episodes: Promise<string | undefined>[] = [];

		// Iterate over the HTML DOM elements in the list
		this.list.querySelectorAll("li a").forEach((item: HTMLElement, index: number): void => {
			// Only update items that have changed position
			if (item.id !== `item-${(self.episodeList.items[index] as Episode).id}`) {
				// Iterate over the list items array
				for (const episode of (self.episodeList.items as Episode[])) {
					// If the array item at this position is not the same as the HTML DOM element at the same position, update the item's sequence in the database
					if (`item-${episode.id}` === item.id) {
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

	private async editItems(): Promise<void> {
		// Set the list to edit mode
		this.episodeList.setAction("edit");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the edit icons next to each list item
		this.list.className = "";
		this.list.classList.add("edit");

		// Enable sorting
		this.sortable.option("disabled", false);

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

	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.episodeList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Disable sorting
		this.sortable.option("disabled", true);

		// Show the view icons next to each list item
		this.list.className = "";

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

	// DOM selectors
	private get list(): HTMLUListElement {
		return document.querySelector("#list") as HTMLUListElement;
	}
}