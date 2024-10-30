import { headerLabel, headerRightButton } from "~/support/e2e";
import { password, userName } from "~/support/login";

describe("App", (): void => {
	describe("not authenticated", (): void => {
		beforeEach((): Cypress.Chainable => cy.visit("/"));

		it("should display the Login view if not authenticated", (): void => {
			cy.get(headerLabel).should("have.text", "Login");
		});

		it("should navigate to the Schedule view after authenticating", (): void => {
			cy.get(userName).type(String(Cypress.env("TVMANAGER_USERNAME")));
			cy.get(password).type(String(Cypress.env("TVMANAGER_PASSWORD")));
			cy.get(headerRightButton).click();
			cy.get(headerLabel).should("have.text", "Schedule");
		});
	});

	it("should display the Schedule view if authenticated", (): void => {
		cy.login();
		cy.visit("/");
		cy.get(headerLabel).should("have.text", "Schedule");
	});
});
