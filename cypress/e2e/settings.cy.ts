import {
	aboutRow,
	allExpectedRow,
	allIncompleteRow,
	allMissedRow,
	allRecordedRow,
	importExportRow
} from "settings";
import {
	footerRightButton,
	headerLabel,
	headerLeftButton
} from "e2e";

describe("Settings", (): void => {
	beforeEach((): void => {
		cy.visit("/");
		cy.get(footerRightButton).click();
	});

	describe("header", (): void => {
		it("should show 'Settings' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Settings");
		});

		it("should navigate to the Schedule view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Schedule");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Schedule");
		});
	});

	describe("content", (): void => {
		it("should navigate to the Import/Export view when the Import/Export row is clicked", (): void => {
			cy.get(importExportRow).click();
			cy.get(headerLabel).should("have.text", "Import/Export");
		});

		it("should navigate to the About view when the About row is clicked", (): void => {
			cy.get(aboutRow).click();
			cy.get(headerLabel).should("have.text", "About");
		});

		it("should navigate to the All Recorded report when the All Recorded row is clicked", (): void => {
			cy.get(allRecordedRow).click();
			cy.get(headerLabel).should("have.text", "All Recorded");
		});

		it("should navigate to the All Expected report when the All Expected row is clicked", (): void => {
			cy.get(allExpectedRow).click();
			cy.get(headerLabel).should("have.text", "All Expected");
		});

		it("should navigate to the All Missed report when the All Missed row is clicked", (): void => {
			cy.get(allMissedRow).click();
			cy.get(headerLabel).should("have.text", "All Missed");
		});

		it("should navigate to the All Incomplete report when the All Incomplete row is clicked", (): void => {
			cy.get(allIncompleteRow).click();
			cy.get(headerLabel).should("have.text", "All Incomplete");
		});
	});
});