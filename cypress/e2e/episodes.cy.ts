import type { EpisodeListItem, TestData } from "~/support/types";
import {
	episodeName,
	expected,
	missed,
	recorded,
	statusDate,
	unscheduled,
	unscheduledLabel,
	unverified,
	unverifiedLabel,
	watched,
} from "~/support/episode";
import {
	firstListItem,
	footerLabel,
	footerLeftButton,
	footerRightButton,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	lastListItem,
	list,
	listItem,
	listItemSubText,
	listItems,
	secondListItem,
	thirdListItem,
} from "~/support/e2e";
import type { EpisodeStatus } from "~/models";

describe("Episodes", (): void => {
	let expectedItems: EpisodeListItem[];

	before((): void => {
		const data: TestData = {
			programs: [
				{
					programName: "Test Program",
					series: [
						{
							seriesName: "Test Series",
							episodes: [
								{ episodeName: "Episode A", status: "Watched" },
								{
									episodeName: "Episode B",
									status: "Recorded",
									statusDate: "2000-01-01",
								},
								{
									episodeName: "Episode C",
									status: "Recorded",
									statusDate: "2000-01-02",
									unverified: "true",
									unscheduled: "true",
								},
								{
									episodeName: "Episode D",
									status: "Expected",
									statusDate: "2000-01-03",
								},
								{
									episodeName: "Episode E",
									status: "Missed",
									statusDate: "2000-01-04",
								},
								{
									episodeName: "Episode F",
									status: "Missed",
									statusDate: "2000-01-05",
									unverified: "true",
								},
								{
									episodeName: "Episode G",
									status: "Expected",
									statusDate: "2100-01-01",
								},
								{
									episodeName: "Episode H",
									status: "Expected",
									statusDate: "2100-01-02",
									unverified: "true",
								},
								{ episodeName: "Episode I" },
							],
						},
					],
				},
			],
		};

		cy.createTestData(data);

		expectedItems = [
			{ label: "Episode A", status: "Watched" },
			{
				label: "Episode B",
				status: "Recorded",
				statusDateSubText: "Sat Jan 01 2000",
			},
			{
				label: "Episode C",
				status: "Recorded",
				statusDateSubText: "Sun Jan 02 2000",
				unverifiedClass: true,
			},
			{
				label: "Episode D",
				status: "Expected",
				statusDateSubText: "Mon Jan 03 2000",
				warning: true,
			},
			{
				label: "Episode E",
				status: "Missed",
				statusDateSubText: "Tue Jan 04 2000",
			},
			{
				label: "Episode F",
				status: "Missed",
				statusDateSubText: "Wed Jan 05 2000",
				unverifiedClass: true,
			},
			{
				label: "Episode G",
				status: "Expected",
				statusDateSubText: "Fri Jan 01 2100",
			},
			{
				label: "Episode H",
				status: "Expected",
				statusDateSubText: "Sat Jan 02 2100",
				unverifiedClass: true,
			},
			{ label: "Episode I" },
		];
	});

	beforeEach((): void => {
		cy.visit("/");
		cy.get(headerRightButton).click();
		cy.get(secondListItem).click();
		cy.get(firstListItem).click();
	});

	describe("header", (): void => {
		it("should show the program and series name as the label", (): void => {
			cy.get(headerLabel).should("have.text", "Test Program : Test Series");
		});

		it("should navigate to the Series view when the left button is clicked", (): void => {
			cy.get(headerLeftButton).should("have.text", "Series");
			cy.get(headerLeftButton).click();
			cy.get(headerLabel).should("have.text", "Test Program");
		});

		it("should navigate to the Add/Edit Episode view when the right button is clicked", (): void => {
			cy.get(headerRightButton).should("have.text", "+");
			cy.get(headerRightButton).click();
			cy.get(headerLeftButton).should("have.text", "Cancel");
			cy.get(headerLabel).should("have.text", "Add/Edit Episode");
			cy.get(headerRightButton).should("have.text", "Save");
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
	});

	describe("footer", (): void => {
		it("should show the database version as the label", (): void => {
			cy.get(footerLabel).should("have.text", "v1");
		});

		it("should toggle between sort mode when the left button is clicked", (): void => {
			cy.get(footerLeftButton).should("have.text", "Sort");
			cy.get(footerLeftButton).click();
			cy.get(list).should("have.class", "edit");
			cy.get(footerLeftButton).should("have.text", "Done");
			cy.get(footerLeftButton).click();
			cy.get(list).should("not.have.class", "edit");
			cy.get(footerLeftButton).should("have.text", "Sort");
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

	describe("Add/Edit Episode view", (): void => {
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(headerRightButton).click(),
		);

		["Watched", "Recorded", "Expected", "Missed"].forEach(
			(status: EpisodeStatus): void => {
				it(`should toggle the ${status} indicator when clicked`, (): void => {
					cy.get(watched).should("not.have.class", "status");
					cy.get(recorded).should("not.have.class", "status");
					cy.get(expected).should("not.have.class", "status");
					cy.get(missed).should("not.have.class", "status");

					// Toggle on
					cy.get(`#${status.toLowerCase()}`).click();
					cy.get(watched).should(
						`${"Watched" === status ? "" : "not."}have.class`,
						"status",
					);
					cy.get(recorded).should(
						`${"Recorded" === status ? "" : "not."}have.class`,
						"status",
					);
					cy.get(expected).should(
						`${"Expected" === status ? "" : "not."}have.class`,
						"status",
					);
					cy.get(missed).should(
						`${"Missed" === status ? "" : "not."}have.class`,
						"status",
					);
					cy.get(statusDate).should(
						`${"Watched" === status ? "not." : ""}be.visible`,
					);
					cy.get(unverifiedLabel).should(
						`${"Watched" === status ? "not." : ""}be.visible`,
					);

					// Toggle off
					cy.get(`#${status.toLowerCase()}`).click();
					cy.get(watched).should("not.have.class", "status");
					cy.get(recorded).should("not.have.class", "status");
					cy.get(expected).should("not.have.class", "status");
					cy.get(missed).should("not.have.class", "status");
				});
			},
		);

		it("should show/hide the status date when unscheduled is toggled", (): void => {
			cy.get(statusDate).should("not.be.visible");

			// Toggle on
			cy.get(unscheduledLabel).click();
			cy.get(statusDate).should("be.visible");

			// Toggle off
			cy.get(unscheduledLabel).click();
			cy.get(statusDate).should("not.be.visible");
		});
	});

	describe("add episode", (): void => {
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(headerRightButton).click(),
		);

		it("should update the Episodes view if the changes are saved", (): void => {
			cy.get(episodeName).should("have.value", "Episode 10");
			cy.get(watched).should("not.have.class", "status");
			cy.get(recorded).should("not.have.class", "status");
			cy.get(expected).should("not.have.class", "status");
			cy.get(missed).should("not.have.class", "status");
			cy.get(statusDate).should("not.be.visible");
			cy.get(unverifiedLabel).should("not.be.visible");
			cy.get(unscheduled).should("not.be.checked");

			cy.get(episodeName).clear().type("New Episode");
			cy.get(expected).click();
			cy.get(statusDate).type("2000-04-01");
			cy.get(unverifiedLabel).click();
			cy.get(unscheduledLabel).click();
			cy.get(headerRightButton).click();

			cy.get(lastListItem).within((): void => {
				cy.get(listItem).should("contain.text", "New Episode");
				cy.get(listItem).should("have.class", "Expected");
				cy.get(listItem).should("have.class", "Unverified");
				cy.get(listItem).should("have.class", "warning");
				cy.get(listItemSubText).should("have.text", "Sat Apr 01 2000");
			});
		});

		it("should not update the Episodes view if the changes are cancelled", (): void => {
			cy.get(episodeName).clear().type("Cancelled Episode");
			cy.get(headerLeftButton).click();
			cy.get(lastListItem).should("contain.text", "New Episode");
		});
	});

	describe("edit episode", (): void => {
		beforeEach((): Cypress.Chainable<JQuery> => cy.get(thirdListItem).click());

		it("should update the Episodes view if the changes are saved", (): void => {
			cy.get(episodeName).should("have.value", "Episode C");
			cy.get(watched).should("not.have.class", "status");
			cy.get(recorded).should("have.class", "status");
			cy.get(expected).should("not.have.class", "status");
			cy.get(missed).should("not.have.class", "status");
			cy.get(statusDate).should("have.value", "2000-01-02");
			cy.get(unverified).should("be.checked");
			cy.get(unscheduled).should("be.checked");

			cy.get(episodeName).clear().type("Saved episode edit");
			cy.get(watched).click();
			cy.get(unscheduledLabel).click();
			cy.get(headerRightButton).click();

			cy.get(thirdListItem).within((): void => {
				cy.get(listItem).should("contain.text", "Saved episode edit");
				cy.get(listItem).should("have.class", "Watched");
				cy.get(listItem).should("not.have.class", "Unverified");
				cy.get(listItemSubText).should("have.text", "");
			});
		});

		it("should not update the Episodes view if the changes are cancelled", (): void => {
			cy.get(episodeName).clear().type("Cancelled episode edit");
			cy.get(headerLeftButton).click();
			cy.get(thirdListItem).should("contain.text", "Saved episode edit");
		});
	});

	describe("delete episode", (): void => {
		beforeEach(
			(): Cypress.Chainable<JQuery> => cy.get(footerRightButton).click(),
		);

		it("should do nothing if the delete is not confirmed", (): void => {
			cy.on("window:confirm", (): boolean => false);
			cy.get(firstListItem).click();
			cy.get(firstListItem).should("contain.text", "Episode A");
		});

		it("should not show the deleted item in the Episodes view", (): void => {
			cy.get(firstListItem).click();
			cy.get(list).should("not.contain.text", "Episode A");
		});
	});

	describe("sort episode", (): void => {
		beforeEach((): void => {
			cy.get(footerLeftButton).click();
			cy.get(firstListItem).drag(secondListItem);
			cy.get(footerLeftButton).click();
		});

		it("should reorder the list", (): void => {
			cy.get(secondListItem).should("contain.text", "Episode B");
			cy.get(headerLeftButton).click();
			cy.get(firstListItem).click();
			cy.get(secondListItem).should("contain.text", "Episode B");
		});
	});
});
