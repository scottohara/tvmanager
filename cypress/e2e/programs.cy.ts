import {
	checkGroup,
	checkProgress,
	firstListItem,
	footerLeftButton,
	footerRightButton,
	fourthListItem,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	index,
	list,
	listItem,
	listItems,
	notices,
	secondListItem,
	thirdListItem,
} from "~/support/e2e";
import type { ListItem } from "~/support/types";
import { programName } from "~/support/program";

describe("Programs", (): void => {
	let expectedItems: (ListItem | string)[];

	before((): void => {
		cy.createProgramsData();

		expectedItems = [
			"A",
			{
				label: "Another Test Program",
				progress: { watched: 1, recorded: 1, expected: 2, noStatus: 1 },
			},
			"D",
			{ label: "D01" },
			{ label: "D02" },
			{ label: "D03" },
			{ label: "D04" },
			{ label: "D05" },
			{ label: "D06" },
			{ label: "D07" },
			{ label: "D08" },
			{ label: "D09" },
			{ label: "D10" },
			{ label: "D11" },
			{ label: "D12" },
			{ label: "D13" },
			{ label: "D14" },
			{ label: "D15" },
			"M",
			{ label: "M01" },
			"R",
			{ label: "R01" },
			{ label: "R02" },
			{ label: "R03" },
			{ label: "R04" },
			{ label: "R05" },
			{ label: "R06" },
			{ label: "R07" },
			{ label: "R08" },
			"T",
			{
				label: "Test Program",
				progress: { watched: 2, recorded: 1, expected: 1, noStatus: 2 },
			},
		];
	});

	beforeEach((): void => {
		cy.login();
		cy.visit("/");
		cy.get(headerRightButton).click();
	});

	describe("header", (): void => {
		it("should show 'Programs' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Programs");
		});

		it("should navigate to the Schedule view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Schedule");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Schedule");
		});

		it("should navigate to the Add/Edit Program view when the right button is clicked", (): void => {
			cy.get(headerRightButton).should("have.text", "+");
			cy.get(headerRightButton).click();
			cy.get(headerLeftButton).should("have.text", "Cancel");
			cy.get(headerLabel).should("have.text", "Add/Edit Program");
			cy.get(headerRightButton).should("have.text", "Save");
		});
	});

	describe("content", (): void => {
		it("should display an item for each group and program", (): void => {
			cy.get(listItems).should("have.length", expectedItems.length);

			cy.get(listItems).each((item: HTMLLIElement, i: number): void => {
				if ("string" === typeof expectedItems[i]) {
					checkGroup(item, expectedItems[i]);
				} else {
					const { label, progress } = expectedItems[i];

					cy.wrap(item).within((): void => {
						cy.get(listItem).should("contain.text", label);
						checkProgress(progress);
					});
				}
			});
		});

		it("should navigate to the Series view when a list item is clicked", (): void => {
			cy.get(secondListItem).click();
			cy.get(headerLabel).should("have.text", "Another Test Program");
		});

		it("should show a notice if the programs could not be retreived", (): void => {
			cy.intercept("GET", "/programs", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.get(headerLeftButton).click();
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Retrieve failed");
		});
	});

	describe("index", (): void => {
		it("should scroll the list when the index is swiped", (): void => {
			cy.get("#group-T").should(
				(item: JQuery): Chai.Assertion =>
					expect(item.position().top).to.be.greaterThan(
						Number(Cypress.$(list).height()),
					),
			);
			cy.get(index).trigger("pointerdown", "top", { buttons: 1 });
			cy.get(index).trigger("pointermove", "bottom", { buttons: 1 });
			cy.get(index).trigger("pointerup");
			cy.get("#group-T").should(
				(item: JQuery): Chai.Assertion =>
					expect(item.position().top).to.be.lessThan(
						Number(Cypress.$(list).height()),
					),
			);
			cy.get(index).trigger("pointerdown", "bottom", { buttons: 1 });
			cy.get(index).trigger("pointermove", "top", { buttons: 1 });
			cy.get(index).trigger("pointerup");
			cy.get("#group-T").should(
				(item: JQuery): Chai.Assertion =>
					expect(item.position().top).to.be.greaterThan(
						Number(Cypress.$(list).height()),
					),
			);
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
			cy.get(headerLabel).should("have.text", "Add/Edit Program");
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

	describe("add program", (): void => {
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(headerRightButton).click(),
		);

		it("should update the Programs view if the changes are saved", (): void => {
			cy.get(programName).should("have.value", "");
			cy.get(programName).type("B01");
			cy.get(headerRightButton).click();
			cy.get(thirdListItem).should("have.text", "B");
			cy.get(fourthListItem).should("contain.text", "B01");
		});

		it("should not update the Programs view if the changes are cancelled", (): void => {
			cy.get(programName).clear().type("Cancelled Program");
			cy.get(headerLeftButton).click();
			cy.get(thirdListItem).should("have.text", "B");
			cy.get(fourthListItem).should("contain.text", "B01");
		});

		it("should do nothing and show a notice if the save fails", (): void => {
			cy.intercept("POST", "/programs", {
				statusCode: 500,
				body: "Save failed",
			});
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Save failed");
		});
	});

	describe("edit program", (): void => {
		beforeEach((): void => {
			cy.get(footerLeftButton).click();
			cy.get(secondListItem).click();
		});

		it("should update the Programs view if the changes are saved", (): void => {
			cy.get(programName).should("have.value", "Another Test Program");
			cy.get(programName).clear().type("C01");
			cy.get(headerRightButton).click();
			cy.get(thirdListItem).should("have.text", "C");
			cy.get(fourthListItem).should("contain.text", "C01");
		});

		it("should not update the Programs view if the changes are cancelled", (): void => {
			cy.get(programName).clear().type("Cancelled program edit");
			cy.get(headerLeftButton).click();
			cy.get(firstListItem).should("have.text", "B");
			cy.get(secondListItem).should("contain.text", "B01");
		});

		it("should do nothing and show a notice if the save fails", (): void => {
			cy.intercept("PUT", "/programs/*", {
				statusCode: 500,
				body: "Save failed",
			});
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Save failed");
		});
	});

	describe("delete program", (): void => {
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(footerRightButton).click(),
		);

		it("should do nothing if the delete is not confirmed", (): void => {
			cy.on("window:confirm", (): boolean => false);
			cy.get(secondListItem).click();
			cy.get(secondListItem).should("contain.text", "B01");
		});

		it("should do nothing and show a notice if the delete fails", (): void => {
			cy.intercept("DELETE", "/programs/*", {
				statusCode: 500,
				body: "Delete failed",
			});
			cy.get(secondListItem).click();
			cy.get(secondListItem).should("contain.text", "B01");
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Delete failed");
		});

		it("should not show the deleted item in the Programs view", (): void => {
			cy.get(secondListItem).click();
			cy.get(list).should("not.contain.text", "B01");
		});
	});
});
