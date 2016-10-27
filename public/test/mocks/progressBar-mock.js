define(
	() => {
		"use strict";

		class ProgressBarMock {
			constructor(total, sections) {
				this.total = total;
				this.sections = sections;
			}

			setTotal(total) {
				this.total = total;

				return this.total;
			}

			setSection(index, section) {
				this.sections[index] = section;

				return this.sections[index];
			}
		}

		return ProgressBarMock;
	}
);
