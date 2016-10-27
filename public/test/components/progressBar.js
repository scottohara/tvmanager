define(
	[
		"components/progressBar"
	],

	ProgressBar => {
		"use strict";

		describe("ProgressBar", () => {
			let total,
					sections,
					progressBar;

			beforeEach(() => {
				total = 1;
				sections = [];
				progressBar = new ProgressBar(total, sections);
			});

			describe("object constructor", () => {
				it("should return a ProgressBar instance", () => progressBar.should.be.an.instanceOf(ProgressBar));
				it("should set the total", () => progressBar.total.should.equal(total));
				it("should set the sections", () => progressBar.sections.should.equal(sections));
			});

			describe("render", () => {
				const testParams = [
					{
						description: "zero total",
						total: 0,
						result: ""
					},
					{
						description: "no sections",
						total: 1,
						sections: null,
						result: "<div class=\"progressBar\"><div class=\"total\">1</div></div>"
					},
					{
						description: "sections",
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
						result: "<div class=\"progressBar\"><div class=\"test\" style=\"width: 50%;\">1</div><div class=\"total\">1</div></div>"
					}
				];

				testParams.forEach(params => {
					it(`should return html with ${params.description}`, () => {
						progressBar.total = params.total;
						progressBar.sections = params.sections;
						progressBar.render().should.equal(params.result);
					});
				});
			});

			describe("setTotal", () => {
				it("should set the total", () => {
					total = 2;
					progressBar.setTotal(total);
					progressBar.total.should.equal(total);
				});
			});

			describe("setSection", () => {
				it("should set the section", () => {
					sections.push("section-one");
					sections.push("section-two");
					sections.forEach((section, index) => progressBar.setSection(index, section));
					progressBar.sections.should.deep.equal(sections);
				});
			});
		});
	}
);