import "~/support/unscheduled";
import {
	episodeName,
	recorded,
	statusDate,
	unscheduledLabel,
	unverifiedLabel,
} from "~/support/episode";
import {
	firstListItem,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	lastListItem,
	list,
	listItem,
	listItemSubText,
	listItems,
	notices,
} from "~/support/e2e";
import type { EpisodeListItem } from "~/support/types";

describe("Unscheduled", (): void => {
	let expectedItems: EpisodeListItem[];

	before((): void => {
		cy.createUnscheduledData();

		expectedItems = [
			{
				label: "Program A:Series A:Episode B",
				status: "recorded",
				statusDateSubText: "Sat Jan 01 2000",
			},
			{
				label: "Program A:Series A:Episode C",
				status: "recorded",
				statusDateSubText: "Sun Jan 02 2000",
				unverifiedClass: true,
			},
			{
				label: "Program A:Series A:Episode D",
				status: "expected",
				statusDateSubText: "Mon Jan 03 2000",
				warning: true,
			},
			{
				label: "Program A:Series A:Episode E",
				status: "missed",
				statusDateSubText: "Tue Jan 04 2000",
			},
			{
				label: "Program A:Series A:Episode F",
				status: "missed",
				statusDateSubText: "Wed Jan 05 2000",
				unverifiedClass: true,
			},
			{
				label: "Program A:Series A:Episode G",
				status: "expected",
				statusDateSubText: "Fri Jan 01 2100",
			},
			{
				label: "Program A:Series A:Episode H",
				status: "expected",
				statusDateSubText: "Sat Jan 02 2100",
				unverifiedClass: true,
			},
			{ label: "Program A:Series A:Episode A", status: "watched" },
			{ label: "Program A:Series A:Episode I" },
			{ label: "Program A:Series B:Episode K" },
			{ label: "Program B:Series C:Episode L" },
		];
	});

	beforeEach((): void => {
		cy.login();
		cy.visit("/");
		cy.get(headerLeftButton).click();
	});

	describe("header", (): void => {
		it("should show 'Unscheduled' as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Unscheduled");
		});

		it("should navigate to the Schedule view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Schedule");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Schedule");
		});
	});

	describe("content", (): void => {
		it("should display an item for each episode", (): void => {
			cy.get(listItems).should("have.length", expectedItems.length);

			cy.get(listItems).each((item: HTMLLIElement, index: number): void => {
				const {
					label,
					status,
					statusDateSubText = "",
					unverifiedClass,
					warning,
				} = expectedItems[index];

				cy.wrap(item).within((): void => {
					cy.get(listItem).should("contain.text", label);
					cy.get(listItem).should(
						`${undefined === status ? "not." : ""}have.class`,
						status,
					);
					cy.get(listItem).should(
						`${true === unverifiedClass ? "" : "not."}have.class`,
						"Unverified",
					);
					cy.get(listItem).should(
						`${true === warning ? "" : "not."}have.class`,
						"warning",
					);
					cy.get(listItemSubText).should("have.text", statusDateSubText);
				});
			});
		});

		it("should navigate to the Add/Edit Episode view when a list item is clicked", (): void => {
			cy.get(firstListItem).click();
			cy.get(headerLabel).should("have.text", "Add/Edit Episode");
		});

		it("should show a notice if the unscheduled episodes could not be retreived", (): void => {
			cy.intercept("GET", "/unscheduled", {
				statusCode: 500,
				body: "Retrieve failed",
			});
			cy.get(headerLeftButton).click();
			cy.get(headerLeftButton).click();
			cy.get(notices).should("be.visible");
			cy.get(notices).should("contain.text", "Retrieve failed");
		});
	});

	describe("edit episode", (): void => {
		beforeEach((): Cypress.Chainable<JQuery> => cy.get(lastListItem).click());

		it("should update the Unscheduled view if the changes are saved", (): void => {
			cy.get(episodeName).clear().type("Saved episode edit");
			cy.get(recorded).click();
			cy.get(statusDate).type("1999-12-31");
			cy.get(unverifiedLabel).click();
			cy.get(headerRightButton).click();

			cy.get(firstListItem).within((): void => {
				cy.get(listItem).should("contain.text", "Saved episode edit");
				cy.get(listItem).should("not.have.class", "watched");
				cy.get(listItem).should("have.class", "recorded");
				cy.get(listItem).should("have.class", "Unverified");
				cy.get(listItemSubText).should("have.text", "Fri Dec 31 1999");
			});
		});

		it("should not update the Unscheduled view if the changes are cancelled", (): void => {
			cy.get(episodeName).clear().type("Cancelled series edit");
			cy.get(headerLeftButton).click();
			cy.get(lastListItem).should(
				"contain.text",
				"Program A:Series B:Episode K",
			);
		});

		it("should not show an item that is no longer unscheduled", (): void => {
			cy.get(unscheduledLabel).click();
			cy.get(headerRightButton).click();
			cy.get(list).should("not.contain.text", "Program A:Series B:Episode K");
		});
	});
});
