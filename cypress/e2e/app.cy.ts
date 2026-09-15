import { headerLabel, headerRightButton } from "~/support/e2e";
import { password, userName } from "~/support/login";

describe("App", (): void => {
	describe("not authenticated", (): void => {
		beforeEach((): Cypress.Chainable => cy.visit("/"));

		it("should display the Login view if not authenticated", (): void => {
			cy.get(headerLabel).should("have.text", "Login");
		});

		it("should navigate to the Schedule view after authenticating", (): Cypress.Chainable =>
			cy
				.env(["TVMANAGER_USERNAME", "TVMANAGER_PASSWORD"])
				.then(
					({
						TVMANAGER_USERNAME,
						TVMANAGER_PASSWORD,
					}: Record<string, string>): void => {
						cy.get(userName).type(TVMANAGER_USERNAME);
						cy.get(password).type(TVMANAGER_PASSWORD);
						cy.get(headerRightButton).click();
						cy.get(headerLabel).should("have.text", "Schedule");
					},
				));
	});

	it("should display the Schedule view if authenticated", (): void => {
		cy.login();
		cy.visit("/");
		cy.get(headerLabel).should("have.text", "Schedule");
	});
});
