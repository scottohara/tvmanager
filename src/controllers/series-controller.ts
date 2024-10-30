import type { NavButtonEventHandler, SeriesListItem } from "~/controllers";
import Program from "~/models/program-model";
import Series from "~/models/series-model";
import SeriesView from "~/views/series-view.html";
import ViewController from "~/controllers/view-controller";

export default class SeriesController extends ViewController {
	private readonly listItem: SeriesListItem;

	private readonly originalNowShowing: number | null = null;

	private readonly originalProgramId: number = 0;

	public constructor(listItem: SeriesListItem) {
		super();

		// If the passed item has an index, we're editing an existing series
		if (Number(listItem.listIndex) >= 0) {
			this.listItem = listItem;
			this.originalNowShowing = this.listItem.series.nowShowing;
			this.originalProgramId = this.listItem.series.programId;
		} else {
			// Otherwise, we're adding a new series
			this.listItem = {
				series: new Series(
					null,
					`Series ${Number(listItem.sequence) + 1}`,
					null,
					Number((listItem.program as Program).id),
					String((listItem.program as Program).programName),
				),
			};
		}
	}

	public get view(): string {
		return SeriesView;
	}

	// DOM selectors
	private get seriesName(): HTMLInputElement {
		return document.querySelector("#seriesName") as HTMLInputElement;
	}

	private get nowShowing(): HTMLSelectElement {
		return document.querySelector("#nowShowing") as HTMLSelectElement;
	}

	private get moveTo(): HTMLSelectElement {
		return document.querySelector("#moveTo") as HTMLSelectElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Series",
			leftButton: {
				eventHandler: this.cancel.bind(this) as NavButtonEventHandler,
				label: "Cancel",
			},
			rightButton: {
				eventHandler: this.save.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Save",
			},
		};

		// Populate the list of programs
		try {
			const programs = await Program.list(),
				options = programs.map((program: Program): HTMLOptionElement => {
					const option = document.createElement("option");

					option.value = String(program.id);
					option.textContent = String(program.programName);

					return option;
				});

			this.moveTo.append(...options);
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}

		// Set the series details
		this.seriesName.value = String(this.listItem.series.seriesName);
		this.nowShowing.value = String(this.listItem.series.nowShowing ?? "");
		this.moveTo.value = String(this.listItem.series.programId);
	}

	public override contentShown(): void {
		// If we're adding a new series, focus and select the episode name
		if (undefined === this.listItem.listIndex) {
			this.seriesName.select();
		}
	}

	private async save(): Promise<void> {
		// Get the series details
		this.listItem.series.seriesName = this.seriesName.value;
		this.listItem.series.nowShowing = Number(this.nowShowing.value) || null;
		this.listItem.series.programId = Number(this.moveTo.value);

		try {
			// Update the database and pop the view off the stack
			await this.listItem.series.save();
			await this.appController.popView(this.listItem);
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}

	private async cancel(): Promise<void> {
		// Revert to the original series details
		this.listItem.series.nowShowing = this.originalNowShowing;
		this.listItem.series.programId = this.originalProgramId;

		// Pop the view off the stack
		return this.appController.popView();
	}
}
