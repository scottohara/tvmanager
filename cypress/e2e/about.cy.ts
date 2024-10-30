import {
	footerRightButton,
	headerLabel,
	headerLeftButton,
	notices,
} from "~/support/e2e";
import { totalEpisodes, totalPrograms, totalSeries } from "~/support/about";
import { aboutRow } from "~/support/settings";

describe("About", (): void => {
	before((): void => cy.createAboutData());

	beforeEach((): void => {
		cy.login();
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
		it("should show the total number of programs", (): Cypress.Chainable<JQuery> =>
			cy.get(totalPrograms).should("have.value", "2"));
		it("should show the total number of series", (): Cypress.Chainable<JQuery> =>
			cy.get(totalSeries).should("have.value", "3"));
		it("should show the total number of episodes and the percentage watched", (): Cypress.Chainable<JQuery> =>
			cy.get(totalEpisodes).should("have.value", "4 (25.00% watched)"));

		it("should show a notice if the programs count could not be retrieved", (): void => {
			cy.intercept("GET", "/programs/count", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.get(headerLeftButton).click();
			cy.get(aboutRow).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Retrieve failed");
		});
	});
});
