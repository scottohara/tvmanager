export const totalPrograms = "#totalPrograms";
export const totalSeries = "#totalSeries";
export const totalEpisodes = "#totalEpisodes";

Cypress.Commands.add("createAboutData", (): void => {
	cy.exec("bundle exec rake db:e2e:about");
});
