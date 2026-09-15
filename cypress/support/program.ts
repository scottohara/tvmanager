export const programName = "#programName";

Cypress.Commands.add(
	"createProgramsData",
	(): Cypress.Chainable => cy.task("createData", "programs"),
);
