var ProgressBar = function (total, sections) {
	this.sections = sections;
	this.setTotal(total);
};

ProgressBar.prototype.render = function() {
	if (this.total > 0) {
		var bar = $("<div>")
			.addClass("progressBar");

		if (this.sections) {
			for (var i = 0; i < this.sections.length; i++) {
				if (this.sections[i].percent > 0) {
					$("<div>")
						.addClass(this.sections[i].style)
						.width(this.sections[i].percent + "%")
						.text(this.sections[i].label)
						.appendTo(bar);
				}
			}
		}

		$("<div>")
			.addClass("total")
			.text(this.total)
			.appendTo(bar);

		return bar.get(0).outerHTML;
	} else {
		return "";
	}
};

ProgressBar.prototype.setTotal = function(total) {
	this.total = total;
	return this.render();
};

ProgressBar.prototype.setSection = function(index, section) {
	this.sections[index] = section;
	return this.render();
};