Cypress.Commands.add(
	"createScheduleData",
	(): Cypress.Chainable => cy.task("createData", "schedule"),
);
