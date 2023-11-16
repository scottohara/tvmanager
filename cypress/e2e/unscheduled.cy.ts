import type { EpisodeListItem, TestData } from "~/support/types";
import {
	episodeName,
	recorded,
	statusDate,
	unscheduledLabel,
	unverifiedLabel,
} from "~/support/episode";
import {
	firstListItem,
	footerLabel,
	headerLabel,
	headerLeftButton,
	headerRightButton,
	lastListItem,
	list,
	listItem,
	listItemSubText,
	listItems,
} from "~/support/e2e";

describe("Unscheduled", (): void => {
	let expectedItems: EpisodeListItem[];

	before((): void => {
		const data: TestData = {
			programs: [
				{
					programName: "Program A",
					series: [
						{
							seriesName: "Series A",
							episodes: [
								{
									episodeName: "Episode A",
									status: "Watched",
									unscheduled: "true",
								},
								{
									episodeName: "Episode B",
									status: "Recorded",
									statusDate: "2000-01-01",
									unscheduled: "true",
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
									unscheduled: "true",
								},
								{
									episodeName: "Episode E",
									status: "Missed",
									statusDate: "2000-01-04",
									unscheduled: "true",
								},
								{
									episodeName: "Episode F",
									status: "Missed",
									statusDate: "2000-01-05",
									unverified: "true",
									unscheduled: "true",
								},
								{
									episodeName: "Episode G",
									status: "Expected",
									statusDate: "2100-01-01",
									unscheduled: "true",
								},
								{
									episodeName: "Episode H",
									status: "Expected",
									statusDate: "2100-01-02",
									unverified: "true",
									unscheduled: "true",
								},
								{ episodeName: "Episode I", unscheduled: "true" },
							],
						},
						{
							seriesName: "Series B",
							episodes: [
								{ episodeName: "Episode J" },
								{ episodeName: "Episode K", unscheduled: "true" },
							],
						},
					],
				},
				{
					programName: "Program B",
					series: [
						{
							seriesName: "Series C",
							episodes: [{ episodeName: "Episode L", unscheduled: "true" }],
						},
					],
				},
			],
		};

		cy.createTestData(data);

		expectedItems = [
			{ label: "Program A:Series A:Episode A", status: "Watched" },
			{ label: "Program A:Series A:Episode I" },
			{ label: "Program A:Series B:Episode K" },
			{ label: "Program B:Series C:Episode L" },
			{
				label: "Program A:Series A:Episode B",
				status: "Recorded",
				statusDateSubText: "Sat Jan 01 2000",
			},
			{
				label: "Program A:Series A:Episode C",
				status: "Recorded",
				statusDateSubText: "Sun Jan 02 2000",
				unverifiedClass: true,
			},
			{
				label: "Program A:Series A:Episode D",
				status: "Expected",
				statusDateSubText: "Mon Jan 03 2000",
				warning: true,
			},
			{
				label: "Program A:Series A:Episode E",
				status: "Missed",
				statusDateSubText: "Tue Jan 04 2000",
			},
			{
				label: "Program A:Series A:Episode F",
				status: "Missed",
				statusDateSubText: "Wed Jan 05 2000",
				unverifiedClass: true,
			},
			{
				label: "Program A:Series A:Episode G",
				status: "Expected",
				statusDateSubText: "Fri Jan 01 2100",
			},
			{
				label: "Program A:Series A:Episode H",
				status: "Expected",
				statusDateSubText: "Sat Jan 02 2100",
				unverifiedClass: true,
			},
		];
	});

	beforeEach((): void => {
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
	});

	describe("footer", (): void => {
		it("should show the database version as the label", (): void => {
			cy.get(footerLabel).should("have.text", "v1");
		});
	});

	describe("edit episode", (): void => {
		beforeEach((): Cypress.Chainable<JQuery> => cy.get(firstListItem).click());

		it("should update the Unscheduled view if the changes are saved", (): void => {
			cy.get(episodeName).clear().type("Saved episode edit");
			cy.get(recorded).click();
			cy.get(statusDate).type("2100-04-01");
			cy.get(unverifiedLabel).click();
			cy.get(headerRightButton).click();

			cy.get(lastListItem).within((): void => {
				cy.get(listItem).should("contain.text", "Saved episode edit");
				cy.get(listItem).should("not.have.class", "Watched");
				cy.get(listItem).should("have.class", "Recorded");
				cy.get(listItem).should("have.class", "Unverified");
				cy.get(listItemSubText).should("have.text", "Thu Apr 01 2100");
			});
		});

		it("should not update the Unscheduled view if the changes are cancelled", (): void => {
			cy.get(episodeName).clear().type("Cancelled series edit");
			cy.get(headerLeftButton).click();
			cy.get(firstListItem).should(
				"contain.text",
				"Program A:Series A:Episode I",
			);
		});

		it("should not show an item that is no longer unscheduled", (): void => {
			cy.get(unscheduledLabel).click();
			cy.get(headerRightButton).click();
			cy.get(list).should("not.contain.text", "Program A:Series A:Episode I");
		});
	});
});
