export const seriesName = "#seriesName";
export const nowShowing = "#nowShowing";
export const moveTo = "#moveTo";

Cypress.Commands.add(
	"createSeriesData",
	(): Cypress.Chainable => cy.task("createData", "series"),
);
