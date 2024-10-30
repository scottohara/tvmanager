import {
	footerRightButton,
	headerLabel,
	headerRightButton,
	notices,
} from "~/support/e2e";
import { password, userName } from "~/support/login";
import { loginRow } from "~/support/settings";

describe("Login", (): void => {
	beforeEach((): void => {
		cy.login();
		cy.visit("/");
		cy.get(footerRightButton).click();
		cy.get(loginRow).click();
	});

	describe("header", (): void => {
		it("should show 'Login' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Login");
		});

		it("should show 'Login' as the right button", (): void => {
			cy.get(headerRightButton).should("have.text", "Login");
		});
	});

	describe("login", (): void => {
		it("should navigate to the Settings view if the authentication succeeds", (): void => {
			cy.get(userName).type(String(Cypress.env("TVMANAGER_USERNAME")));
			cy.get(password).type(String(Cypress.env("TVMANAGER_PASSWORD")));
			cy.get(headerRightButton).click();
			cy.get(headerLabel).should("have.text", "Settings");
		});

		it("should show a notice if the save fails", (): void => {
			cy.get(userName).type("baduser");
			cy.get(password).type("badpassword");
			cy.get(headerRightButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Invalid login and/or password");
		});
	});
});
