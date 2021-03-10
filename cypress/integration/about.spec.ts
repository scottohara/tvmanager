import {
	databaseVersion,
	totalEpisodes,
	totalPrograms,
	totalSeries
} from "about";
import {
	footerRightButton,
	headerLabel,
	headerLeftButton
} from "../support";
import { TestData } from "types";
import { aboutRow } from "settings";

describe("About", (): void => {
	before((): void => {
		const data: TestData = {
			programs: [
				{
					series: [
						{ episodes: [{ status: "Watched" }, {}] },
						{ episodes: [{}] }
					]
				},
				{ series: [{ episodes: [{}] }] }
			]
		};

		cy.createTestData(data);
	});

	beforeEach((): void => {
		cy.visit("/");
		cy.get(footerRightButton).click();
		cy.get(aboutRow).click();
	});

	describe("header", (): void => {
		it("should show 'About' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "About");
		});

		it("should navigate to the Settings view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Settings");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Settings");
		});
	});

	describe("content", (): void => {
		it("should show the total number of programs", (): Cypress.Chainable<JQuery> => cy.get(totalPrograms).should("have.value", "2"));
		it("should show the total number of series", (): Cypress.Chainable<JQuery> => cy.get(totalSeries).should("have.value", "3"));
		it("should show the total number of episodes and the percentage watched", (): Cypress.Chainable<JQuery> => cy.get(totalEpisodes).should("have.value", "4 (25.00% watched)"));
		it("should show the database version", (): Cypress.Chainable<JQuery> => cy.get(databaseVersion).should("have.value", "v1"));
	});
});