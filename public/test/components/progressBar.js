module("progressBar", {
	setup: function() {
		this.total = 1;
		this.sections = [];
		this.progressBar = new ProgressBar(this.total, this.sections);
	}
});

test("constructor", 3, function() {
	ok(this.progressBar, "Instantiate ProgressBar object");
	equals(this.progressBar.total, this.total, "total property");
	equals(this.progressBar.sections, this.sections, "sections property");
});

test("render", function() {
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

	expect(testParams.length);
	for (var i = 0; i < testParams.length; i++) {
		this.progressBar.total = testParams[i].total;
		this.progressBar.sections = testParams[i].sections;
		equals(this.progressBar.render(), testParams[i].result, testParams[i].description + " - html");
	}
});

test("setTotal", 1, function() {
	this.total = 2;
	this.progressBar.setTotal(this.total);
	equals(this.progressBar.total, this.total, "total property");
});

test("setSection", 1, function() {
	this.sections.push("section-one");
	this.sections.push("section-two");
	for (var i = 0; i < this.sections.length; i++) {
		this.progressBar.setSection(i, this.sections[i]);
	}
	same(this.progressBar.sections, this.sections, "sections property");
});
