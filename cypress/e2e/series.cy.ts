import type {
	ListItem,
	TestData
} from "~/support/types";
import {
	checkProgress,
	firstListItem,
	footerLabel,
	footerLeftButton,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	list,
	listItem,
	listItems,
	secondListItem,
	thirdListItem
} from "~/support/e2e";
import {
	moveTo,
	nowShowing,
	seriesName
} from "~/support/series";

describe("Series", (): void => {
	let expectedItems: ListItem[];

	before((): void => {
		const data: TestData = {
			programs: [
				{
					programName: "Test Program",
					series: [
						{
							seriesName: "Series D",
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" },
								{ status: "Missed" },
								{}
							]
						},
						{
							seriesName: "Series C",
							episodes: []
						},
						{
							seriesName: "Series B",
							episodes: [
								{ status: "Watched" }
							]
						},
						{
							seriesName: "Series A",
							episodes: [
								{ status: "Watched" },
								{ status: "Recorded" },
								{ status: "Expected" }
							]
						}
					]
				},
				{
					programName: "Test Program 2",
					series: []
				}
			]
		};

		cy.createTestData(data);

		expectedItems = [
			{ label: "Series A", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Series B", progress: { watched: 1 } },
			{ label: "Series C" },
			{ label: "Series D", progress: { watched: 1, recorded: 1, expected: 1, noStatus: 2 } }
		];
	});

	beforeEach((): void => {
		cy.visit("/");
		cy.get(headerRightButton).click();
		cy.get(secondListItem).click();
	});

	describe("header", (): void => {
		it("should show the program name as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Test Program");
		});

		it("should navigate to the Programs view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Programs");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Programs");
		});

		it("should navigate to the Add/Edit Series view when the right button is clicked", (): void => {
			cy.get(headerRightButton).should("have.text", "+");
			cy.get(headerRightButton).click();
			cy.get(headerLeftButton).should("have.text", "Cancel");
			cy.get(headerLabel).should("have.text", "Add/Edit Series");
			cy.get(headerRightButton).should("have.text", "Save");
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
			cy.get(headerLabel).should("have.text", "Test Program : Series A");
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
			cy.get(firstListItem).click();
			cy.get(headerLabel).should("have.text", "Add/Edit Series");
		});

		it("should toggle between delete mode when the right button is clicked", (): void => {
			cy.get(footerRightButton).should("have.text", "Delete");
			cy.get(footerRightButton).click();
			cy.get(list).should("have.class", "delete");
			cy.get(footerRightButton).should("have.text", "Done");
			cy.get(footerRightButton).click();
			cy.get(list).should("not.have.class", "delete");
			cy.get(footerRightButton).should("have.text", "Delete");
		});
	});

	describe("add series", (): void => {
		beforeEach((): Cypress.Chainable<JQuery> => cy.get(headerRightButton).click());

		it("should update the Series view if the changes are saved", (): void => {
			cy.get(seriesName).should("have.value", "Series 5");
			cy.get(nowShowing).should("have.value", "");
			cy.get(`${moveTo} option:selected`).should("have.text", "Test Program");

			cy.get(seriesName).clear().type("New Series");
			cy.get(nowShowing).select("Mondays");
			cy.get(headerRightButton).click();
			cy.get(firstListItem).should("contain.text", "New Series");
		});

		it("should not update the Series view if the changes are cancelled", (): void => {
			cy.get(seriesName).clear().type("Cancelled Series");
			cy.get(headerLeftButton).click();
			cy.get(firstListItem).should("contain.text", "New Series");
		});
	});

	describe("edit series", (): void => {
		beforeEach((): void => {
			cy.get(footerLeftButton).click();
			cy.get(firstListItem).click();
		});

		it("should update the Series view if the changes are saved", (): void => {
			cy.get(seriesName).should("have.value", "New Series");
			cy.get(nowShowing).should("have.value", "1");
			cy.get(`${moveTo} option:selected`).should("have.text", "Test Program");

			cy.get(seriesName).clear().type("Saved series edit");
			cy.get(headerRightButton).click();
			cy.get(firstListItem).should("contain.text", "Saved series edit");
		});

		it("should not update the Series view if the changes are cancelled", (): void => {
			cy.get(seriesName).clear().type("Cancelled series edit");
			cy.get(headerLeftButton).click();
			cy.get(firstListItem).should("contain.text", "Saved series edit");
		});
	});

	describe("move series", (): void => {
		it("should not show the item in the Series view for the program it moved from", (): void => {
			cy.get(footerLeftButton).click();
			cy.get(firstListItem).click();
			cy.get(moveTo).select("Test Program 2");
			cy.get(headerRightButton).click();
			cy.get(list).should("not.contain.text", "Saved series edit");
		});

		it("should show the item in the Series view for the program it moved to", (): void => {
			cy.get(headerLeftButton).click();
			cy.get(thirdListItem).click();
			cy.get(list).should("contain.text", "Saved series edit");
		});
	});

	describe("delete series", (): void => {
		beforeEach((): Cypress.Chainable<JQuery> => cy.get(footerRightButton).click());

		it("should do nothing if the delete is not confirmed", (): void => {
			cy.on("window:confirm", (): boolean => false);
			cy.get(firstListItem).click();
			cy.get(firstListItem).should("contain.text", "Series A");
		});

		it("should not show the deleted item in the Series view", (): void => {
			cy.get(firstListItem).click();
			cy.get(list).should("not.contain.text", "Series A");
		});
	});
});