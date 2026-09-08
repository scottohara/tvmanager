import Episode from "~/models/episode-model";
import EpisodeListTemplate from "~/views/episodeListTemplate.html";
import EpisodesView from "~/views/episodes-view.html";
import List from "~/components/list";
import type { PublicInterface } from "~/global";
import type { SeriesListItem } from "~/controllers";
import Sortable from "sortablejs";
import ViewController from "~/controllers/view-controller";

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

	// DOM selectors
	private get list(): HTMLUListElement {
		return document.querySelector("#list") as HTMLUListElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: `${this.listItem.series.programName} : ${this.listItem.series.seriesName}`,
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: this.listItem.source ?? "Series",
			},
			rightButton: {
				eventHandler: this.addItem.bind(this),
				label: "+",
			},
		};

		// Instantiate a List object
		this.episodeList = new List(
			"list",
			EpisodeListTemplate,
			null,
			[],
			this.viewItem.bind(this),
			null,
			this.deleteItem.bind(this),
		);

		// Prepare the list for sorting
		this.sortable = Sortable.create(this.list, {
			disabled: true,
			animation: 150,
		});

		// Activate the controller
		return this.activate();
	}

	public override async activate(): Promise<void> {
		try {
			// Get the list of episodes for the specified series
			this.episodeList.items = await Episode.list(
				Number(this.listItem.series.id),
			);

			// Refresh the list
			this.episodeList.refresh();

			// Set to view mode
			this.viewItems();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	public override contentShown(): void {
		// If necessary, scroll to the first unwatched episode
		if (this.scrollToFirstUnwatched) {
			// Find the first unwatched episode
			const firstUnwatched = this.episodeList.items.find(
				(item: Episode): boolean => "watched" !== item.status,
			) as PublicInterface<Episode> | undefined;

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
		return this.appController.pushView("episode", {
			series: this.listItem.series,
			sequence: this.episodeList.items.length,
		});
	}

	private async deleteItem(listIndex: number): Promise<void> {
		// Get the deleted episode and it's corresponding DOM item
		const episode = this.episodeList.items[listIndex] as Episode,
			episodeItem = this.list.querySelector(
				`li a#item-${episode.id}`,
			) as HTMLAnchorElement;

		try {
			// Remove the item from the database
			await episode.remove();

			// Remove the item from the list and from the DOM
			this.episodeList.items.splice(listIndex, 1);
			episodeItem.remove();

			// Resequence the remaining items
			await this.resequenceItems();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private deleteItems(): void {
		// Set the list to delete mode
		this.episodeList.setAction("delete");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the delete icons next to each list item
		this.list.className = "";
		this.list.classList.add("delete");

		// Setup the footer
		this.footer = {
			rightButton: {
				eventHandler: this.viewItems.bind(this),
				style: "confirmButton",
				label: "Done",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}

	private async resequenceItems(): Promise<void> {
		const items = this.episodeList.items as Episode[],
			// The HTML DOM elements are the source of truth for the order after sorting
			resequencedItems = Array.from(
				this.list.querySelectorAll("li a"),
				(item: Element): Episode =>
					items.find(
						(episode: Episode): boolean =>
							`item-${String(episode.id)}` === item.id,
					) as Episode,
			);

		// Nothing to do if none of the items changed position
		if (
			resequencedItems.every(
				(episode: Episode, index: number): boolean => episode === items[index],
			)
		) {
			return;
		}

		try {
			await Episode.resequence(
				Number(this.listItem.series.id),
				resequencedItems.map((episode: Episode): number => Number(episode.id)),
			);

			resequencedItems.forEach((episode: Episode, index: number): void => {
				episode.sequence = index;
			});

			this.episodeList.items = resequencedItems;

			// Refresh the list
			this.episodeList.refresh();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private editItems(): void {
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
			leftButton: {
				eventHandler: async (): Promise<void> => {
					await this.resequenceItems();

					this.viewItems();
				},
				style: "confirmButton",
				label: "Done",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}

	private viewItems(): void {
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
			leftButton: {
				eventHandler: this.editItems.bind(this),
				label: "Sort",
			},
			rightButton: {
				eventHandler: this.deleteItems.bind(this),
				style: "cautionButton",
				label: "Delete",
			},
		};

		// Set the view footer
		this.appController.setFooter();
	}
}
