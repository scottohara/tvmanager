import "~/support/report";
import type { ListItem, Progress } from "~/support/types";
import {
	allExpectedRow,
	allIncompleteRow,
	allMissedRow,
	allRecordedRow,
} from "~/support/settings";
import {
	checkProgress,
	firstListItem,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	lastListItem,
	list,
	listItem,
	listItems,
	notices,
} from "~/support/e2e";
import type { EpisodeStatus } from "~/models";
import { watched } from "~/support/episode";

const reports: {
	status: EpisodeStatus | "Incomplete";
	headerText: string;
	selector: string;
}[] = [
	{ status: "recorded", headerText: "All Recorded", selector: allRecordedRow },
	{ status: "expected", headerText: "All Expected", selector: allExpectedRow },
	{ status: "missed", headerText: "All Missed", selector: allMissedRow },
	{
		status: "Incomplete",
		headerText: "All Incomplete",
		selector: allIncompleteRow,
	},
];

describe("Report", (): void => {
	reports.forEach(({ status, headerText, selector }): void => {
		describe(headerText, (): void => {
			let expectedItems: ListItem[];

			before((): void => {
				if ("Incomplete" === status) {
					cy.createIncompleteReportData();

					expectedItems = [
						{
							label: "Program A:Series A",
							progress: { watched: 2, recorded: 1, expected: 1, noStatus: 2 },
						},
						{
							label: "Program Z:Series B",
							progress: { watched: 1, noStatus: 1 },
						},
						{
							label: "Program Z:Series C",
							progress: { watched: 2, noStatus: 1 },
						},
					];
				} else {
					cy.createStatusReportData(status);

					expectedItems = [
						{
							label: "Program A:Series A",
							progress: { [status.toLowerCase()]: 2 },
						},
						{
							label: "Program Z:Series B",
							progress: { [status.toLowerCase()]: 1 },
						},
						{
							label: "Program Z:Series C",
							progress: { [status.toLowerCase()]: 2 },
						},
					];
				}
			});

			beforeEach((): void => {
				cy.login();
				cy.visit("/");
				cy.get(footerRightButton).click();
				cy.get(selector).click();
			});

			describe("header", (): void => {
				it(`should show '${headerText}' as the label`, (): void => {
					cy.get(headerLabel).should("have.text", headerText);
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

				it("should show a notice if the report could not be retreived", (): void => {
					cy.intercept("GET", "/reports/*", {
						statusCode: 500,
						body: "Retrieve failed",
					});
					cy.get(headerLeftButton).click();
					cy.get(selector).click();
					cy.get(notices).should("be.visible");
					cy.get(notices).should("contain.text", "Retrieve failed");
				});
			});

			describe("edit episode", (): void => {
				let progress: Progress | undefined;

				beforeEach(
					(): Cypress.Chainable<JQuery> => cy.get(lastListItem).click(),
				);

				it("should not update the Report view if the changes are cancelled", (): void => {
					[, , { progress }] = expectedItems;

					cy.get(firstListItem).click();
					cy.get(
						`#${"Incomplete" === status ? "watched" : status.toLowerCase()}`,
					).click();
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
