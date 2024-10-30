export const programName = "#programName";

Cypress.Commands.add("createProgramsData", (): void => {
	cy.exec("bundle exec rake db:e2e:programs");
});
