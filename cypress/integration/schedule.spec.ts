import type {
	ListItem,
	TestData
} from "types";
import {
	checkGroup,
	checkProgress,
	fifthListItem,
	footerLabel,
	footerLeftButton,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	list,
	listItem,
	listItems,
	secondListItem
} from "../support";
import {
	moveTo,
	nowShowing,
	seriesName
} from "series";

describe("Schedule", (): void => {
	let expectedItems: (ListItem | string)[];

	before((): void => {
		const data: TestData = {
			programs: [
				{
					programName: "Program Z",
					series: [
						{
							seriesName: "Series S",
							episodes: [
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series R",
							episodes: [
								{ status: "Recorded" }
							]
						},
						{
							seriesName: "Series P",
							nowShowing: 8,
							episodes: []
						},
						{
							seriesName: "Series N",
							nowShowing: 7,
							episodes: []
						},
						{
							seriesName: "Series L",
							nowShowing: 6,
							episodes: []
						},
						{
							seriesName: "Series J",
							nowShowing: 5,
							episodes: []
						},
						{
							seriesName: "Series H",
							nowShowing: 4,
							episodes: []
						},
						{
							seriesName: "Series F",
							nowShowing: 3,
							episodes: []
						},
						{
							seriesName: "Series D",
							nowShowing: 2,
							episodes: [
								{},
								{}
							]
						},
						{
							seriesName: "Series B",
							nowShowing: 1,
							episodes: [
								{ status: "Watched" }
							]
						}
					]
				},
				{
					programName: "Program A",
					series: [
						{
							seriesName: "Series Q",
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series O",
							nowShowing: 8,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series M",
							nowShowing: 7,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series K",
							nowShowing: 6,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series I",
							nowShowing: 5,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series G",
							nowShowing: 4,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series E",
							nowShowing: 3,
							episodes: [
								{ status: "Expected" }
							]
						},
						{
							seriesName: "Series C",
							nowShowing: 2,
							episodes: [
								{ status: "Recorded" },
								{ status: "Expected" },
								{},
								{}
							]
						},
						{
							seriesName: "Series A",
							nowShowing: 1,
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected", statusDate: "2000-01-01" },
								{ status: "Missed" },
								{}
							]
						}
					]
				}
			]
		};

		cy.createTestData(data);

		expectedItems = [
			"Mondays",
			{ label: "Program A:Series A", progress: { watched: 1, recorded: 1, expected: 1, noStatus: 2 }, warning: true },
			{ label: "Program Z:Series B", progress: { watched: 1 } },
			"Tuesdays",
			{ label: "Program A:Series C", progress: { recorded: 1, expected: 1, noStatus: 2 } },
			{ label: "Program Z:Series D", progress: { noStatus: 2 } },
			"Wednesdays",
			{ label: "Program A:Series E", progress: { expected: 1 } },
			{ label: "Program Z:Series F" },
			"Thursdays",
			{ label: "Program A:Series G", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series H" },
			"Fridays",
			{ label: "Program A:Series I", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series J" },
			"Saturdays",
			{ label: "Program A:Series K", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series L" },
			"Sundays",
			{ label: "Program A:Series M", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series N" },
			"Daily",
			{ label: "Program A:Series O", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series P" },
			"Not Showing",
			{ label: "Program A:Series Q", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Program Z:Series R", progress: { recorded: 1 } },
			{ label: "Program Z:Series S", progress: { expected: 1 } }
		];
	});

	beforeEach((): Cypress.Chainable => cy.visit("/"));

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
					checkGroup(item, expectedItems[index] as string);
				} else {
					const { label, progress, warning } = expectedItems[index] as ListItem;

					cy.wrap(item).within((): void => {
						cy.get(listItem).should("contain.text", label);
						cy.get(listItem).should(`${true === warning ? "" : "not."}have.class`, "warning");
						checkProgress(progress);
					});
				}
			});
		});

		it("should navigate to the Episodes view when a list item is clicked", (): void => {
			cy.get(secondListItem).click();
			cy.get(headerLabel).should("have.text", "Program A : Series A");
		});
	});

	describe("footer", (): void => {
		it("should show the database version as the label", (): void => {
			cy.get(footerLabel).should("have.text", "v1");
		});

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
			cy.get(fifthListItem).should("contain.text", "Program Z:Saved series edit");
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