import AboutView from "~/views/about-view.html";
import Episode from "~/models/episode-model";
import type { NavButtonEventHandler } from "~/controllers";
import Program from "~/models/program-model";
import Series from "~/models/series-model";
import ViewController from "~/controllers/view-controller";

export default class AboutController extends ViewController {
	public get view(): string {
		return AboutView;
	}

	// DOM selectors
	private get statistics(): HTMLElement {
		return document.querySelector("#statistics") as HTMLElement;
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

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "About",
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings",
			},
		};

		try {
			const [totalPrograms, totalSeries, totalEpisodes, watchedEpisodes] =
				await Promise.all([
					Program.count(),
					Series.count(),
					Episode.count(),
					Episode.countByStatus("watched"),
				]);

			// Set the total number of programs
			this.totalPrograms.value = String(totalPrograms);

			// Set the total number of series
			this.totalSeries.value = String(totalSeries);

			// Set the total number of episodes, and the percentage watched
			this.totalEpisodes.value = this.watchedPercent(
				totalEpisodes,
				watchedEpisodes,
			);

			// Set the scroll position
			this.appController.setScrollPosition();

			// Show the statistics when populated
			this.statistics.style.display = "block";
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private watchedPercent(totalCount: number, watchedCount: number): string {
		// Calculate the percentage of watched episodes
		const DECIMAL_PLACES = 2,
			PERCENT = 100,
			watchedPercent: string =
				totalCount > 0
					? ((watchedCount / totalCount) * PERCENT).toFixed(DECIMAL_PLACES)
					: "0";

		// Return the total number of episodes and percent watched
		return `${totalCount} (${watchedPercent}% watched)`;
	}
}
