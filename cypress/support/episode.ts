export const episodeName = "#episodeName";
export const watched = "#watched";
export const recorded = "#recorded";
export const expected = "#expected";
export const missed = "#missed";
export const statusDate = "#statusDate";
export const unverified = "#unverified";
export const unverifiedLabel = "#unverifiedRow > label[for=unverified]";
export const unscheduled = "#unscheduled";
export const unscheduledLabel = "label[for=unscheduled]";

Cypress.Commands.add("createEpisodesData", (): void => {
	cy.exec("bundle exec rake db:e2e:episodes");
});
