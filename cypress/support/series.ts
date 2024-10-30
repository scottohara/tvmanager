export const seriesName = "#seriesName";
export const nowShowing = "#nowShowing";
export const moveTo = "#moveTo";

Cypress.Commands.add("createSeriesData", (): void => {
	cy.exec("bundle exec rake db:e2e:series");
});
