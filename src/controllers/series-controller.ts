import type {
	NavButtonEventHandler,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import Program from "models/program-model";
import Series from "models/series-model";
import SeriesView from "views/series-view.html";
import ViewController from "controllers/view-controller";

export default class SeriesController extends ViewController {
	private readonly listItem: SeriesListItem;

	private readonly originalNowShowing: number | null = null;

	private readonly originalProgramId: string | null = null;

	public constructor(listItem: SeriesListItem) {
		super();

		// If the passed item has an index, we're editing an existing series
		if (Number(listItem.listIndex) >= 0) {
			this.listItem = listItem;
			this.originalNowShowing = this.listItem.series.nowShowing;
			this.originalProgramId = this.listItem.series.programId;
		} else {
			// Otherwise, we're adding a new series
			this.listItem = { series: new Series(null, `Series ${Number(listItem.sequence) + 1}`, null, (listItem.program as Program).id, String((listItem.program as Program).programName)) };
		}
	}

	public get view(): string {
		return SeriesView;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Add/Edit Series",
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

		// Populate the list of programs
		const programs: Program[] = await Program.list(),
					options = programs.map((program: Program): JQuery => $("<option>").val(String(program.id)).text(String(program.programName)));

		$("#moveTo").append(options);

		// Set the series details
		$("#seriesName").val(String(this.listItem.series.seriesName));
		$("#nowShowing").val(this.listItem.series.nowShowing ?? "");
		$("#moveTo").val(String(this.listItem.series.programId));
	}

	public override contentShown(): void {
		// If we're adding a new series, focus and select the episode name
		if (undefined === this.listItem.listIndex) {
			$("#seriesName").select();
		}
	}

	private async save(): Promise<void> {
		// Get the series details
		this.listItem.series.seriesName = String($("#seriesName").val());
		this.listItem.series.nowShowing = Number($("#nowShowing").val()) || null;
		this.listItem.series.programId = String($("#moveTo").val());

		// Update the database and pop the view off the stack
		await this.listItem.series.save();

		return this.appController.popView(this.listItem);
	}

	private async cancel(): Promise<void> {
		// Revert to the original series details
		this.listItem.series.nowShowing = this.originalNowShowing;
		this.listItem.series.programId = this.originalProgramId;

		// Pop the view off the stack
		return this.appController.popView();
	}
}