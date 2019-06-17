/**
 * @file (Components) ProgressBar
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module components/progressbar
 * @requires jquery
 */
import $ from "jquery";
import { Section } from "components";

/**
 * @class ProgressBar
 * @classdesc Generic progress bar view. Multiple sections may be specified, creating a 'stacked' bar
 * @this ProgressBar
 * @property {Number} total - the number that represents 100% complete
 * @property {Array<Section>} sections - array of section objects
 * @param {Number} total - the number that represents 100% complete
 * @param {Array} sections - array of section objects
 */
export default class ProgressBar {
	private total = 0;

	public constructor(total: number, private readonly sections: Section[]) {
		this.setTotal(total);
	}

	/**
	 * @memberof ProgressBar
	 * @this ProgressBar
	 * @instance
	 * @method setSection
	 * @desc (Re)Sets a section and regenerates the HTML for the progress bar
	 * @param {Number} index - the section number (zero-based)
	 * @param {Section} section - a section object
	 * @returns {String} the HTML of the progress bar
	 */
	public setSection(index: number, section: Section): string {
		this.sections[index] = section;

		return this.render();
	}

	/**
	 * @memberof ProgressBar
	 * @this ProgressBar
	 * @instance
	 * @method setTotal
	 * @desc Sets the total and regenerates the HTML for the progress bar
	 * @param {Number} total - the number that represents 100% complete
	 * @returns {String} the HTML of the progress bar
	 */
	public setTotal(total: number): string {
		this.total = total;

		return this.render();
	}

	/**
	 * @memberof ProgressBar
	 * @this ProgressBar
	 * @instance
	 * @method render
	 * @desc Generates the HTML for the progress bar
	 * @returns {String} the HTML of the progress bar
	 */
	private render(): string {
		// Only generate the HTML if a total is set
		if (this.total > 0) {
			// Create the progress bar div
			const bar: JQuery<HTMLElement> = $("<div>")
				.addClass("progressBar");

			// Append any sections to display
			bar.append(this.sections

				// Only output the section if it has a percentage set
				.filter((section: Section): boolean => section.percent > 0)

				// Create a div for each section
				.map((section: Section): JQuery<HTMLElement> => $("<div>")

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