import ProgressBar from "../../../src/components/progressbar";
import {Section} from "components";

describe("ProgressBar", (): void => {
	let total: number,
			sections: Section[],
			progressBar: ProgressBar;

	beforeEach((): void => {
		total = 2;
		sections = [];
		progressBar = new ProgressBar(total, sections);
	});

	describe("object constructor", (): void => {
		it("should return a ProgressBar instance", (): Chai.Assertion => progressBar.should.be.an.instanceOf(ProgressBar));
		it("should set the total", (): Chai.Assertion => progressBar["total"].should.equal(total));
		it("should set the sections", (): Chai.Assertion => progressBar["sections"].should.equal(sections));
	});

	describe("setSection", (): void => {
		it("should set the section", (): void => {
			sections.push({
				label: "section-one",
				percent: 50,
				style: "style-one"
			});
			sections.push({
				label: "section-two",
				percent: 25,
				style: "style-two"
			});
			sections.forEach((section: Section, index: number): string => progressBar.setSection(index, section));
			progressBar["sections"].should.deep.equal(sections);
		});
	});

	describe("setTotal", (): void => {
		it("should set the total", (): void => {
			total = 2;
			progressBar.setTotal(total);
			progressBar["total"].should.equal(total);
		});
	});

	describe("render", (): void => {
		interface Scenario {
			description: string;
			total: number;
			sections: Section[];
			result: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "zero total",
				total: 0,
				sections: [],
				result: ""
			},
			{
				description: "no sections",
				total: 1,
				sections: [],
				result: "<div class=\"progressBar\"><div class=\"total\">1</div></div>"
			},
			{
				description: "sections",
				total: 1,
				sections: [
					{
						label: "section-one",
						percent: 0,
						style: "style-one"
					},
					{
						label: 1,
						percent: 50,
						style: "style-two"
					}
				],
				result: "<div class=\"progressBar\"><div class=\"style-two\" style=\"width: 50%;\">1</div><div class=\"total\">1</div></div>"
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			it(`should return html with ${scenario.description}`, (): void => {
				progressBar = new ProgressBar(scenario.total, scenario.sections);
				progressBar["render"]().should.equal(scenario.result);
			});
		});
	});
});