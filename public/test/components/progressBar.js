define(
	[
		'components/progressBar',
		'test/framework/qunit'
	],

	function(ProgressBar, QUnit) {
		"use strict";

		QUnit.module("progressBar", {
			setup: function() {
				this.total = 1;
				this.sections = [];
				this.progressBar = new ProgressBar(this.total, this.sections);
			}
		});

		QUnit.test("constructor", 3, function() {
			QUnit.ok(this.progressBar, "Instantiate ProgressBar object");
			QUnit.equal(this.progressBar.total, this.total, "total property");
			QUnit.equal(this.progressBar.sections, this.sections, "sections property");
		});

		QUnit.test("render", function() {
			var testParams = [
				{
					description: "zero total",
					total: 0,
					result: ""
				},
				{
					description: "no sections",
					total: 1,
					sections: null,
					result: '<div class="progressBar"><div class="total">1</div></div>'
				},
				{
					description: "with sections",
					total: 1,
					sections: [
						{
							percent: 0
						},
						{
							percent: 50,
							style: "test",
							label: 1
						}
					],
					result: '<div class="progressBar"><div class="test" style="width: 50%;">1</div><div class="total">1</div></div>'
				}
			];

			QUnit.expect(testParams.length);
			for (var i = 0; i < testParams.length; i++) {
				this.progressBar.total = testParams[i].total;
				this.progressBar.sections = testParams[i].sections;
				QUnit.equal(this.progressBar.render(), testParams[i].result, testParams[i].description + " - html");
			}
		});

		QUnit.test("setTotal", 1, function() {
			this.total = 2;
			this.progressBar.setTotal(this.total);
			QUnit.equal(this.progressBar.total, this.total, "total property");
		});

		QUnit.test("setSection", 1, function() {
			this.sections.push("section-one");
			this.sections.push("section-two");
			for (var i = 0; i < this.sections.length; i++) {
				this.progressBar.setSection(i, this.sections[i]);
			}
			QUnit.deepEqual(this.progressBar.sections, this.sections, "sections property");
		});
	}
);
