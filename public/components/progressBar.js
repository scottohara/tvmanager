/**
 * @file (Components) ProgressBar
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class Section
 * @classdesc Anonymous object containing the properties of a progress bar section
 * @private
 * @property {String} label - the label to display in the section
 * @property {Number} percent - the percent of the total for this section (0-100)
 * @property {String} style - a CSS class name to use for the section
 */

/**
 * @class ProgressBar
 * @classdesc Generic progress bar view. Multiple sections may be specified, creating a 'stacked' bar
 * @property {Number} total - the number that represents 100% complete
 * @property {Array<Section>} sections - array of section objects
 * @this ProgressBar
 * @constructor
 * @param {Number} total - the number that represents 100% complete
 * @param {Array} sections - array of section objects
 */
var ProgressBar = function (total, sections) {
	"use strict";

	this.sections = sections;
	this.setTotal(total);
};

/**
 * @memberof ProgressBar
 * @this ProgressBar
 * @instance
 * @method render
 * @desc Generates the HTML for the progress bar
 * @returns {String} the HTML of the progress bar
 */
ProgressBar.prototype.render = function() {
	"use strict";

	// Only generate the HTML if a total is set
	if (this.total > 0) {
		// Create the progress bar div
		var bar = $("<div>")
			.addClass("progressBar");

		// Check if we have sections to display
		if (this.sections) {
			// Iterate over the specified sections array
			for (var i = 0; i < this.sections.length; i++) {
				// Only output the section if it has a percentage set
				if (this.sections[i].percent > 0) {
					// Create a div for the section
					$("<div>")
						// Set the CSS class to use for the section
						.addClass(this.sections[i].style)

						// Set the width of the section to the percentage of the total
						.width(this.sections[i].percent + "%")

						// Set the label of the section
						.text(this.sections[i].label)

						// Add the section to the progress bar
						.appendTo(bar);
				}
			}
		}

		// Create a div for the total
		$("<div>")
			.addClass("total")
			.text(this.total)
			.appendTo(bar);

		// Return the generated HTML
		return bar.get(0).outerHTML;
	} else {
		// No total specified, just return an empty string
		return "";
	}
};

/**
 * @memberof ProgressBar
 * @this ProgressBar
 * @instance
 * @method setTotal
 * @desc Sets the total and regenerates the HTML for the progress bar
 * @param {Number} total - the number that represents 100% complete
 * @returns {String} the HTML of the progress bar
 */
ProgressBar.prototype.setTotal = function(total) {
	"use strict";

	this.total = total;
	return this.render();
};

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
ProgressBar.prototype.setSection = function(index, section) {
	"use strict";

	this.sections[index] = section;
	return this.render();
};
