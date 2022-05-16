import AboutView from "views/about-view.html";
import DatabaseService from "services/database-service";
import Episode from "models/episode-model";
import type { NavButtonEventHandler } from "controllers";
import Program from "models/program-model";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

export default class AboutController extends ViewController {
	public get view(): string {
		return AboutView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "About",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings"
			}
		};

		// Set the total number of programs
		this.totalPrograms.value = String(await Program.count());

		// Set the total number of series
		this.totalSeries.value = String(await Series.count());

		// Set the total number of episodes, and the percentage watched
		this.totalEpisodes.value = this.watchedPercent(await Episode.totalCount(), await Episode.countByStatus("Watched"));

		// Set the version information
		this.databaseVersion.value = `v${(await DatabaseService).version}`;

		// Set the scroll position
		this.appController.setScrollPosition();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private watchedPercent(totalCount: number, watchedCount: number): string {
		// Calculate the percentage of watched episodes
		const DECIMAL_PLACES = 2,
					PERCENT = 100,
					watchedPercent: string = totalCount > 0 ? (watchedCount / totalCount * PERCENT).toFixed(DECIMAL_PLACES) : "0";

		// Return the total number of episodes and percent watched
		return `${totalCount} (${watchedPercent}% watched)`;
	}

	// DOM selectors
	private get databaseVersion(): HTMLInputElement {
		return document.querySelector("#databaseVersion") as HTMLInputElement;
	}

	private get totalPrograms(): HTMLInputElement {
		return document.querySelector("#totalPrograms") as HTMLInputElement;
	}

	private get totalSeries(): HTMLInputElement {
		return document.querySelector("#totalSeries") as HTMLInputElement;
	}

	private get totalEpisodes(): HTMLInputElement {
		return document.querySelector("#totalEpisodes") as HTMLInputElement;
	}
}