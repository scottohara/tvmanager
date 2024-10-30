import "@4tw/cypress-drag-drop";
import type { Progress } from "~/support/types";

export const headerLabel = "#headerLabel";
export const headerLeftButton = "#headerLeftButton";
export const headerRightButton = "#headerRightButton";

export const nowLoading = "#nowLoading";
export const content = "#content";
export const list = "#list";
export const listItems = `${list} > li`;
export const firstListItem = `${listItems}:first-of-type`;
export const secondListItem = `${listItems}:nth-of-type(2)`;
export const thirdListItem = `${listItems}:nth-of-type(3)`;
export const fourthListItem = `${listItems}:nth-of-type(4)`;
export const fifthListItem = `${listItems}:nth-of-type(5)`;
export const lastListItem = `${listItems}:last-of-type`;
export const listItem = "a";
export const listItemSubText = `${listItem} > div.subText`;
export const index = "#index";

export const footerLabel = "#footerLabel";
export const footerLeftButton = "#footerLeftButton";
export const footerRightButton = "#footerRightButton";

export const notices = "#notices";
export const dismissNoticeButton = "#notices > div.notice > a:first-of-type";

const progressBar = `${listItem} > div.progressBar`,
	progressTotal = `${progressBar} div.total`,
	progressWatched = `${progressBar} div.watched`,
	progressRecorded = `${progressBar} div.recorded`,
	progressExpected = `${progressBar} div.expected`,
	progressMissed = `${progressBar} div.missed`;

export function checkGroup(group: HTMLLIElement, label: string): void {
	cy.wrap(group).should("have.class", "group");
	cy.wrap(group).should("have.text", label);
}

export function checkProgress({
	watched = 0,
	recorded = 0,
	expected = 0,
	missed = 0,
	noStatus = 0,
}: Progress = {}): void {
	const total = watched + recorded + expected + missed + noStatus;

	if (total > 0) {
		cy.get(progressTotal).should("have.text", total);
	} else {
		cy.get(progressBar).should("not.exist");
		cy.get(progressTotal).should("not.exist");
	}

	if (watched > 0) {
		cy.get(progressWatched).should("have.text", watched);
	} else {
		cy.get(progressWatched).should("not.exist");
	}

	if (recorded > 0) {
		cy.get(progressRecorded).should("have.text", recorded);
	} else {
		cy.get(progressRecorded).should("not.exist");
	}

	if (expected > 0) {
		cy.get(progressExpected).should("have.text", expected);
	} else {
		cy.get(progressExpected).should("not.exist");
	}

	if (missed > 0) {
		cy.get(progressMissed).should("have.text", missed);
	} else {
		cy.get(progressMissed).should("not.exist");
	}
}

Cypress.Commands.add("login", (): void => {
	cy.window().then((window: Window): void => {
		const authenticationKey: string = window.btoa(
			`${String(Cypress.env("TVMANAGER_USERNAME"))}:${String(
				Cypress.env("TVMANAGER_PASSWORD"),
			)}`,
		);

		window.localStorage.setItem(
			"tvManagerAuthenticationKey",
			authenticationKey,
		);
	});
});
