import $ from "jquery";
import type { Section } from "components";

export default class ProgressBar {
	private total = 0;

	public constructor(total: number, private readonly sections: Section[]) {
		this.setTotal(total);
	}

	public setSection(index: number, section: Section): string {
		this.sections[index] = section;

		return this.render();
	}

	public setTotal(total: number): string {
		this.total = total;

		return this.render();
	}

	private render(): string {
		// Only generate the HTML if a total is set
		if (this.total > 0) {
			// Create the progress bar div
			const bar: JQuery = $("<div>")
				.addClass("progressBar");

			// Append any sections to display
			bar.append(this.sections

				// Only output the section if it has a percentage set
				.filter((section: Section): boolean => section.percent > 0)

				// Create a div for each section
				.map((section: Section): JQuery => $("<div>")

					// Set the CSS class to use for the section
					.addClass(section.style)

					// Set the width of the section to the percentage of the total
					.width(`${section.percent}%`)

					// Set the label of the section
					.text(section.label)));

			// Create a div for the total
			$("<div>")
				.addClass("total")
				.text(this.total)
				.appendTo(bar);

			// Return the generated HTML
			return bar.get(0).outerHTML;
		}

		// No total specified, just return an empty string
		return "";
	}
}