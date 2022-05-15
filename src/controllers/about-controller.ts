import $ from "jquery";
import AboutView from "views/about-view.html";
import DatabaseService from "services/database-service";
import Episode from "models/episode-model";
import type { NavButtonEventHandler } from "controllers";
import Program from "models/program-model";
import Series from "models/series-model";
import ViewController from "controllers/view-controller";

export default class AboutController extends ViewController {
	private episodeTotalCount = 0;

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

		// Get the total number of programs
		this.programCount(await Program.count());

		// Get the total number of series
		this.seriesCount(await Series.count());

		// Get the total number of episodes
		await this.episodeCount(await Episode.totalCount());

		// Set the version information
		$("#databaseVersion").val(`v${(await DatabaseService).version}`);

		// Set the scroll position
		this.appController.setScrollPosition();
	}

	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	private programCount(count: number): void {
		$("#totalPrograms").val(count);
	}

	private seriesCount(count: number): void {
		$("#totalSeries").val(count);
	}

	private async episodeCount(count: number): Promise<void> {
		// Save the total for later
		this.episodeTotalCount = count;

		// Get the total number of watched episodes
		this.watchedCount(await Episode.countByStatus("Watched"));
	}

	private watchedCount(count: number): void {
		// Calculate the percentage of watched episodes
		const DECIMAL_PLACES = 2,
					PERCENT = 100,
					watchedPercent: string = this.episodeTotalCount > 0 ? (count / this.episodeTotalCount * PERCENT).toFixed(DECIMAL_PLACES) : "0";

		// Display the total number of episodes and percent watched
		$("#totalEpisodes").val(`${this.episodeTotalCount} (${watchedPercent}% watched)`);
	}
}