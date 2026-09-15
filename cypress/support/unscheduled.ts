Cypress.Commands.add(
	"createUnscheduledData",
	(): Cypress.Chainable => cy.task("createData", "unscheduled"),
);
