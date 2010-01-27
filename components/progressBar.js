function ProgressBar(total, sections) {
	this.sections = sections;
	this.setTotal(total);
}

ProgressBar.prototype.render = function() {
	if (this.total > 0) {
		var bar = document.createElement("DIV");
		bar.className = "progressBar";

		if (this.sections) {
			for (var i = 0; i < this.sections.length; i++) {
				if (this.sections[i].percent > 0) {
					var section = document.createElement("DIV");
					section.className = this.sections[i].style;
					section.style.width = this.sections[i].percent + "%";
					section.textContent = this.sections[i].label;
					bar.appendChild(section);
				}
			}
		}

		var total = document.createElement("DIV");
		total.className = "total";
		total.textContent = this.total;
		bar.appendChild(total);
		return bar.outerHTML;
	} else {
		return "";
	}
}

ProgressBar.prototype.setTotal = function(total) {
	this.total = total;
	return this.render();
}

ProgressBar.prototype.setSection = function(index, section) {
	this.sections[index] = section;
	return this.render();
}