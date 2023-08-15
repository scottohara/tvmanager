import type {
	ListItem,
	Progress,
	TestData
} from "~/support/types";
import {
	allExpectedRow,
	allIncompleteRow,
	allMissedRow,
	allRecordedRow
} from "~/support/settings";
import {
	checkProgress,
	firstListItem,
	footerLabel,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	lastListItem,
	list,
	listItem,
	listItems
} from "~/support/e2e";
import type { EpisodeStatus } from "~/models";
import { watched } from "~/support/episode";

const reports: { status: EpisodeStatus | "Incomplete"; selector: string; }[] = [
	{ status: "Recorded", selector: allRecordedRow },
	{ status: "Expected", selector: allExpectedRow },
	{ status: "Missed", selector: allMissedRow },
	{ status: "Incomplete", selector: allIncompleteRow }
];

describe("Report", (): void => {
	reports.forEach(({ status, selector }): void => {
		describe(`All ${status}`, (): void => {
			let expectedItems: ListItem[];

			before((): void => {
				let data: TestData;

				if ("Incomplete" === status) {
					data = {
						programs: [
							{
								programName: "Program Z",
								series: [
									{
										episodes: [
											{ status: "Watched" },
											{ status: "Watched" }
										]
									},
									{
										seriesName: "Series C",
										episodes: [
											{ status: "Watched" },
											{ status: "Watched" },
											{}
										]
									},
									{
										seriesName: "Series B",
										episodes: [
											{ status: "Watched" },
											{}
										]
									},
									{ episodes: [] }
								]
							},
							{
								programName: "Program A",
								series: [
									{
										seriesName: "Series A",
										episodes: [
											{ status: "Watched" },
											{ status: "Watched" },
											{ status: "Recorded" },
											{ status: "Expected" },
											{ status: "Missed" },
											{}
										]
									},
									{ episodes: [{}] }
								]
							}
						]
					};

					expectedItems = [
						{ label: "Program A:Series A", progress: { watched: 2, recorded: 1, expected: 1, noStatus: 2 } },
						{ label: "Program Z:Series B", progress: { watched: 1, noStatus: 1 } },
						{ label: "Program Z:Series C", progress: { watched: 2, noStatus: 1 } }
					];
				} else {
					data = {
						programs: [
							{
								programName: "Program Z",
								series: [
									{
										seriesName: "Series C",
										episodes: [
											{ status },
											{},
											{ status }
										]
									},
									{
										seriesName: "Series B",
										episodes: [
											{ status },
											{}
										]
									},
									{ episodes: [] }
								]
							},
							{
								programName: "Program A",
								series: [
									{
										seriesName: "Series A",
										episodes: [
											{ status },
											{ status }
										]
									},
									{ episodes: [{}] }
								]
							}
						]
					};

					expectedItems = [
						{ label: "Program A:Series A", progress: { [status.toLowerCase()]: 2 } },
						{ label: "Program Z:Series B", progress: { [status.toLowerCase()]: 1 } },
						{ label: "Program Z:Series C", progress: { [status.toLowerCase()]: 2 } }
					];
				}

				cy.createTestData(data);
			});

			beforeEach((): void => {
				cy.visit("/");
				cy.get(footerRightButton).click();
				cy.get(selector).click();
			});

			describe("header", (): void => {
				it(`should show 'All ${status}' as the label`, (): void => {
					cy.get(headerLabel).should("have.text", `All ${status}`);
				});

				it("should navigate to the Settings view when the left button is clicked", (): void => {
					cy.get(headerLeftButton).should("have.text", "Settings");
					cy.get(headerLeftButton).click();
					cy.get(headerLabel).should("have.text", "Settings");
				});
			});

			describe("content", (): void => {
				it("should display an item for each series", (): void => {
					cy.get(listItems).should("have.length", expectedItems.length);

					cy.get(listItems).each((item: HTMLLIElement, index: number): void => {
						const { label, progress } = expectedItems[index];

						cy.wrap(item).within((): void => {
							cy.get(listItem).should("contain.text", label);
							checkProgress(progress);
						});
					});
				});

				it("should navigate to the Episodes view when a list item is clicked", (): void => {
					cy.get(firstListItem).click();
					cy.get(headerLabel).should("have.text", "Program A : Series A");
				});
			});

			describe("footer", (): void => {
				it("should show the database version as the label", (): void => {
					cy.get(footerLabel).should("have.text", "v1");
				});
			});

			describe("edit episode", (): void => {
				let progress: Progress | undefined;

				beforeEach((): Cypress.Chainable<JQuery> => cy.get(lastListItem).click());

				it("should not update the Report view if the changes are cancelled", (): void => {
					[,,{ progress }] = expectedItems;

					cy.get(firstListItem).click();
					cy.get(`#${"Incomplete" === status ? "watched" : status.toLowerCase()}`).click();
					cy.get(headerLeftButton).click();
					cy.get(headerLeftButton).click();
					cy.get(lastListItem).within((): void => checkProgress(progress));
				});

				it("should update the Report view if the changes are saved", (): void => {
					cy.get(firstListItem).click();

					if ("Incomplete" === status) {
						progress = { watched: 1, noStatus: 2 };
						cy.get(watched).click();
					} else {
						progress = { [status.toLowerCase()]: 1 };
						cy.get(`#${status.toLowerCase()}`).click();
					}

					cy.get(headerRightButton).click();
					cy.get(headerLeftButton).click();
					cy.get(lastListItem).within((): void => checkProgress(progress));
				});

				if ("Incomplete" === status) {
					it("should not show a series that is no longer Incomplete", (): void => {
						cy.get(firstListItem).click();
						cy.get(watched).click();
						cy.get(headerRightButton).click();
						cy.get(lastListItem).click();
						cy.get(watched).click();
						cy.get(headerRightButton).click();
						cy.get(headerLeftButton).click();
						cy.get(list).should("not.contain.text", "Program Z:Series C");
					});
				} else {
					it(`should not show a series that no longer has any ${status} episodes`, (): void => {
						cy.get(lastListItem).click();
						cy.get(`#${status.toLowerCase()}`).click();
						cy.get(headerRightButton).click();
						cy.get(headerLeftButton).click();
						cy.get(list).should("not.contain.text", "Program Z:Series C");
					});
				}
			});
		});
	});
});