import {
	checkProgress,
	firstListItem,
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
	thirdListItem,
} from "~/support/e2e";
import { moveTo, nowShowing, seriesName } from "~/support/series";
import type { ListItem } from "~/support/types";

describe("Series", (): void => {
	let expectedItems: ListItem[];

	before((): void => {
		cy.createSeriesData();

		expectedItems = [
			{ label: "Series A", progress: { watched: 1, recorded: 1, expected: 1 } },
			{ label: "Series B", progress: { watched: 1 } },
			{ label: "Series C" },
			{
				label: "Series D",
				progress: { watched: 1, recorded: 1, expected: 1, noStatus: 2 },
			},
		];
	});

	beforeEach((): void => {
		cy.login();
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

		it("should show a notice if the series could not be retreived", (): void => {
			cy.intercept("GET", "/programs/*/series", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.get(headerLeftButton).click();
			cy.get(secondListItem).click();
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
			cy.get(firstListItem).click();
			cy.get(headerLabel).should("have.text", "Add/Edit Series");
		});

		it("should show a notice if populating the programs list fails", (): void => {
			cy.intercept("GET", "/programs", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.get(footerLeftButton).click();
			cy.get(firstListItem).click();
			cy.get(headerLabel).should("have.text", "Add/Edit Series");
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Retrieve failed");
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
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(headerRightButton).click(),
		);

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

		it("should do nothing and show a notice if the save fails", (): void => {
			cy.intercept("POST", "/programs/*/series", {
				statusCode: 500,
				body: "Save failed",
			});
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Save failed");
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

		it("should do nothing and show a notice if the save fails", (): void => {
			cy.intercept("PUT", "/series/*", {
				statusCode: 500,
				body: "Save failed",
			});
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Save failed");
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
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(footerRightButton).click(),
		);

		it("should do nothing if the delete is not confirmed", (): void => {
			cy.on("window:confirm", (): boolean => false);
			cy.get(firstListItem).click();
			cy.get(firstListItem).should("contain.text", "Series A");
		});

		it("should do nothing and show a notice if the delete fails", (): void => {
			cy.intercept("DELETE", "/series/*", {
				statusCode: 500,
				body: "Delete failed",
			});
			cy.get(secondListItem).click();
			cy.get(firstListItem).should("contain.text", "Series A");
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Delete failed");
		});

		it("should not show the deleted item in the Series view", (): void => {
			cy.get(firstListItem).click();
			cy.get(list).should("not.contain.text", "Series A");
		});
	});
});
