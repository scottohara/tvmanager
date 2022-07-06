import {
	dismissNoticeButton,
	notices
} from "e2e";
import type { TestData } from "types";

describe("App", (): void => {
	it("should show a notice when the last data sync was over 7 days ago and there are changes to sync", (): void => {
		const data: TestData = { programs: [{ series: [{ episodes: [{}] }] }], settings: [{ name: "LastSyncTime", value: "2000-01-01" }] };

		cy.createTestData(data);
		cy.visit("/");
		cy.get(notices).should("be.visible");
		cy.get(notices).should("contain.text", "The last data sync was over 7 days ago");
	});

	it("should not show a notice when the last data sync was under 7 days ago", (): void => {
		const data: TestData = { programs: [{ series: [{ episodes: [{}] }] }], settings: [{ name: "LastSyncTime", value: String(new Date()) }] };

		cy.createTestData(data);
		cy.visit("/");
		cy.get(notices).should("not.be.visible");
	});

	it("should not show a notice when there are no changes to sync", (): void => {
		const data: TestData = { settings: [{ name: "LastSyncTime", value: "2000-01-01" }] };

		cy.createTestData(data);
		cy.visit("/");
		cy.get(notices).should("not.be.visible");
	});

	it("should dismiss the notification", (): void => {
		const data: TestData = { programs: [{ series: [{ episodes: [{}] }] }], settings: [{ name: "LastSyncTime", value: "2000-01-01" }] };

		cy.createTestData(data);
		cy.visit("/");
		cy.get(notices).should("be.visible");
		cy.get(dismissNoticeButton).click();
		cy.get(notices).should("not.be.visible");
	});
});