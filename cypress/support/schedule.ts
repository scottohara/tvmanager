Cypress.Commands.add("createScheduleData", (): void => {
	cy.exec("bundle exec rake db:e2e:schedule");
});
