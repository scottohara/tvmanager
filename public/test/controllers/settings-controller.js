define(
	[
		"controllers/settings-controller",
		"controllers/application-controller",
		"models/series-model",
		"framework/jquery"
	],

	(SettingsController, ApplicationController, Series, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("SettingsController", () => {
			const reports = [
				{
					description: "Recorded",
					viewArgs: {
						reportName: "All Recorded",
						dataSource: Series.listByStatus,
						args: "Recorded"
					}
				},
				{
					description: "Expected",
					viewArgs: {
						reportName: "All Expected",
						dataSource: Series.listByStatus,
						args: "Expected"
					}
				},
				{
					description: "Missed",
					viewArgs: {
						reportName: "All Missed",
						dataSource: Series.listByStatus,
						args: "Missed"
					}
				},
				{
					description: "Incomplete",
					viewArgs: {
						reportName: "All Incomplete",
						dataSource: Series.listByIncomplete,
						args: null
					}
				}
			];

			let settingsController;

			beforeEach(() => {
				settingsController = new SettingsController();
			});

			describe("object constructor", () => {
				it("should return a SettingsController instance", () => settingsController.should.be.an.instanceOf(SettingsController));
			});

			describe("setup", () => {
				beforeEach(() => {
					sinon.stub(settingsController, "goBack");
					sinon.stub(settingsController, "activate");
					settingsController.setup();
				});

				it("should set the header label", () => settingsController.header.label.should.equal("Settings"));

				it("should attach a header left button event handler", () => {
					settingsController.header.leftButton.eventHandler();
					settingsController.goBack.should.have.been.called;
				});

				it("should set the header left button style", () => settingsController.header.leftButton.style.should.equal("backButton"));
				it("should set the header left button label", () => settingsController.header.leftButton.label.should.equal("Schedule"));

				it("should activate the controller", () => settingsController.activate.should.have.been.called);
			});

			describe("activate", () => {
				const testParams = [
					{
						description: "data sync",
						id: "dataSyncRow",
						handler: "viewDataSync"
					},
					{
						description: "about",
						id: "aboutRow",
						handler: "viewAbout"
					},
					{
						description: "recorded report",
						id: "recordedReportRow",
						handler: "viewRecordedReport"
					},
					{
						description: "expected report",
						id: "expectedReportRow",
						handler: "viewExpectedReport"
					},
					{
						description: "missed report",
						id: "missedReportRow",
						handler: "viewMissedReport"
					},
					{
						description: "incomplete report",
						id: "incompleteReportRow",
						handler: "viewIncompleteReport"
					}
				];

				testParams.forEach(params => {
					it(`should attach a ${params.description} click event handler`, () => {
						const element = $("<div>")
							.attr("id", params.id)
							.appendTo(document.body);

						sinon.stub(settingsController, params.handler);
						settingsController.activate();
						element.trigger("click");
						settingsController[params.handler].should.have.been.called;
						element.remove();
					});
				});
			});

			describe("goBack", () => {
				it("should pop the view", () => {
					settingsController.goBack();
					appController.popView.should.have.been.called;
				});
			});

			describe("viewDataSync", () => {
				it("should push the data sync view", () => {
					settingsController.viewDataSync();
					appController.pushView.should.have.been.calledWith("dataSync");
				});
			});

			describe("viewAbout", () => {
				it("should push the about view", () => {
					settingsController.viewAbout();
					appController.pushView.should.have.been.calledWith("about");
				});
			});

			reports.forEach(report => {
				describe(`view${report.description}Report`, () => {
					it(`should push the ${report.description.toLowerCase()} report view`, () => {
						settingsController[`view${report.description}Report`]();
						appController.pushView.should.have.been.calledWith("report", sinon.match({
							reportName: report.viewArgs.reportName,
							dataSource: sinon.match.func,
							args: report.viewArgs.args
						}));
					});
				});
			});
		});
	}
);