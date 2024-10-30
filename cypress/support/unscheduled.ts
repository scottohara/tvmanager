Cypress.Commands.add("createUnscheduledData", (): void => {
	cy.exec("bundle exec rake db:e2e:unscheduled");
});
