export const totalPrograms = "#totalPrograms";
export const totalSeries = "#totalSeries";
export const totalEpisodes = "#totalEpisodes";

Cypress.Commands.add(
	"createAboutData",
	(): Cypress.Chainable => cy.task("createData", "about"),
);
