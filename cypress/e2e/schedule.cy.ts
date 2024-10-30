import "~/support/schedule";
import {
	checkGroup,
	checkProgress,
	fifthListItem,
	footerLeftButton,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	list,
	listItem,
	listItems,
	notices,
	secondListItem,
} from "~/support/e2e";
import { moveTo, nowShowing, seriesName } from "~/support/series";
import type { ListItem } from "~/support/types";

describe("Schedule", (): void => {
	let expectedItems: (ListItem | string)[];

	before((): void => {
		cy.createScheduleData();

		expectedItems = [
			"Mondays",
			{
				label: "Program A:Series A",
				progress: { watched: 1, recorded: 1, expected: 1, noStatus: 2 },
				warning: true,
			},
			{ label: "Program Z:Series B", progress: { watched: 1 } },
			"Tuesdays",
			{
				label: "Program A:Series C",
				progress: { recorded: 1, expected: 1, noStatus: 2 },
			},
			{ label: "Program Z:Series D", progress: { noStatus: 2 } },
			"Wednesdays",
			{ label: "Program A:Series E", progress: { expected: 1 } },
			{ label: "Program Z:Series F" },
			"Thursdays",
			{
				label: "Program A:Series G",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series H" },
			"Fridays",
			{
				label: "Program A:Series I",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series J" },
			"Saturdays",
			{
				label: "Program A:Series K",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series L" },
			"Sundays",
			{
				label: "Program A:Series M",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series N" },
			"Daily",
			{
				label: "Program A:Series O",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series P" },
			"Not Showing",
			{
				label: "Program A:Series Q",
				progress: { watched: 1, recorded: 1, expected: 1 },
			},
			{ label: "Program Z:Series R", progress: { recorded: 1 } },
			{ label: "Program Z:Series S", progress: { expected: 1 } },
		];
	});

	beforeEach((): void => {
		cy.login();
		cy.visit("/");
	});

	describe("header", (): void => {
		it("should show 'Schedule' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Schedule");
		});

		it("should navigate to the Unscheduled view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Unscheduled");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Unscheduled");
		});

		it("should navigate to the Programs view when the right button is clicked", (): void => {
			cy.get(headerRightButton).should("have.text", "Programs");
			cy.get(headerRightButton).click();
			cy.get(headerLabel).should("have.text", "Programs");
		});
	});

	describe("content", (): void => {
		it("should display an item for each group and scheduled series", (): void => {
			cy.get(listItems).should("have.length", expectedItems.length);

			cy.get(listItems).each((item: HTMLLIElement, index: number): void => {
				if ("string" === typeof expectedItems[index]) {
					checkGroup(item, expectedItems[index]);
				} else {
					const { label, progress, warning } = expectedItems[index];

					cy.wrap(item).within((): void => {
						cy.get(listItem).should("contain.text", label);
						cy.get(listItem).should(
							`${true === warning ? "" : "not."}have.class`,
							"warning",
						);
						checkProgress(progress);
					});
				}
			});
		});

		it("should navigate to the Episodes view when a list item is clicked", (): void => {
			cy.get(secondListItem).click();
			cy.get(headerLabel).should("have.text", "Program A : Series A");
		});

		it("should show a notice if the schedule could not be retreived", (): void => {
			cy.intercept("GET", "/scheduled", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.visit("/");
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Retrieve failed");
		});
	});

	describe("footer", (): void => {
		it("should toggle between edit mode when the left button is clicked", (): void => {
			cy.get(footerLeftButton).should("have.text", "Edit");
			cy.get(footerLeftButton).click();
			cy.get(list).should("have.class", "edit");
			cy.get(footerLeftButton).should("have.text", "Done");
			cy.get(footerLeftButton).click();
			cy.get(list).should("not.have.class", "edit");
			cy.get(footerLeftButton).should("have.text", "Edit");

			cy.get(footerLeftButton).click();
			cy.get(secondListItem).click();
			cy.get(headerLabel).should("have.text", "Add/Edit Series");
		});

		it("should navigate to the Settings view when the right button is clicked", (): void => {
			cy.get(footerRightButton).should("have.text", "Settings");
			cy.get(footerRightButton).click();
			cy.get(headerLabel).should("have.text", "Settings");
		});
	});

	describe("edit series", (): void => {
		beforeEach((): void => {
			cy.get(footerLeftButton).click();
			cy.get(secondListItem).click();
		});

		it("should update the Schedule view if the changes are saved", (): void => {
			cy.get(seriesName).clear().type("Saved series edit");
			cy.get(nowShowing).select("Tuesdays");
			cy.get(moveTo).select("Program Z");
			cy.get(headerRightButton).click();
			cy.get(fifthListItem).should(
				"contain.text",
				"Program Z:Saved series edit",
			);
		});

		it("should not update the Schedule view if the changes are cancelled", (): void => {
			cy.get(seriesName).clear().type("Cancelled series edit");
			cy.get(nowShowing).select("Tuesdays");
			cy.get(moveTo).select("Program A");
			cy.get(headerLeftButton).click();
			cy.get(secondListItem).should("contain.text", "Program Z:Series B");
		});

		it("should not show an item that is no longer scheduled", (): void => {
			cy.get(nowShowing).select("Not Showing");
			cy.get(headerRightButton).click();
			cy.get(list).should("not.contain.text", "Program Z:Series B");
		});
	});
});
