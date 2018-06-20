import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import ScheduleController from "controllers/schedule-controller";
import ScheduleView from "views/schedule-view.html";
import Series from "models/series-model";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("ScheduleController", () => {
	let items,
			scheduleList,
			scheduleController;

	beforeEach(() => {
		items = [
			{
				seriesName: "test-series",
				nowShowing: 1,
				programId: 2,
				programName: "test-program-2",
				recordedCount: 0,
				expectedCount: 0
			},
			{
				seriesName: "test-series",
				nowShowing: 1,
				programId: 3,
				programName: "test-program-3",
				recordedCount: 0,
				expectedCount: 0
			},
			{
				seriesName: "test-series",
				nowShowing: null,
				programId: 1,
				programName: "test-program-1",
				recordedCount: 0,
				expectedCount: 0
			},
			{
				seriesName: "test-series",
				nowShowing: null,
				programId: 1,
				programName: "test-program-1",
				recordedCount: 0,
				expectedCount: 0
			}
		];

		scheduleList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		scheduleController = new ScheduleController();
	});

	describe("object constructor", () => {
		it("should return a ScheduleController instance", () => scheduleController.should.be.an.instanceOf(ScheduleController));
	});

	describe("view", () => {
		it("should return the schedule view", () => scheduleController.view.should.equal(ScheduleView));
	});

	describe("setup", () => {
		beforeEach(() => {
			sinon.stub(scheduleController, "viewItem");
			sinon.stub(scheduleController, "editItem");
			sinon.stub(scheduleController, "viewUnscheduled");
			sinon.stub(scheduleController, "viewPrograms");
			sinon.stub(scheduleController, "activate");
			scheduleController.setup();
		});

		it("should set the header label", () => scheduleController.header.label.should.equal("Schedule"));

		it("should attach a header left button event handler", () => {
			scheduleController.header.leftButton.eventHandler();
			scheduleController.viewUnscheduled.should.have.been.called;
		});

		it("should set the header left button label", () => scheduleController.header.leftButton.label.should.equal("Unscheduled"));

		it("should attach a header right button event handler", () => {
			scheduleController.header.rightButton.eventHandler();
			scheduleController.viewPrograms.should.have.been.called;
		});

		it("should set the header right button label", () => scheduleController.header.rightButton.label.should.equal("Programs"));

		it("should attach a view event handler to the schedule list", () => {
			scheduleController.scheduleList.viewEventHandler();
			scheduleController.viewItem.should.have.been.called;
		});

		it("should attach an edit event handler to the programs list", () => {
			scheduleController.scheduleList.editEventHandler();
			scheduleController.editItem.should.have.been.called;
		});

		it("should activate the controller", () => scheduleController.activate.should.have.been.called);
	});

	describe("activate", () => {
		describe("from launch", () => {
			beforeEach(() => {
				sinon.stub(scheduleController, "listRetrieved");
				Series.series = items;
				scheduleController.activate();
			});

			it("should get the list of scheduled series", () => {
				Series.listByNowShowing.should.have.been.calledWith(sinon.match.func);
				scheduleController.listRetrieved.should.have.been.calledWith(items);
			});
		});

		describe("from episodes view", () => {
			let listItem;

			beforeEach(() => {
				sinon.stub(scheduleController, "viewItems");

				scheduleController.scheduleList = {
					items: items.slice(0),
					refresh: sinon.stub()
				};
			});

			describe("not scheduled", () => {
				beforeEach(() => {
					listItem = {
						listIndex: 0,
						series: {
							nowShowing: null,
							recordedCount: 0,
							expectedCount: 0
						}
					};
					scheduleController.activate(listItem);
				});

				it("should remove the item from the schedule list", () => scheduleController.scheduleList.items.should.deep.equal(items.slice(1)));
				it("should refresh the list", () => scheduleController.scheduleList.refresh.should.have.been.called);
				it("should set the list to view mode", () => scheduleController.viewItems.should.have.been.called);
			});

			describe("scheduled", () => {
				const testParams = [
					{
						description: "program edited",
						programId: 4,
						programName: "test-program-4",
						newIndex: 1
					},
					{
						description: "now showing edited",
						nowShowing: 2,
						newIndex: 1
					},
					{
						description: "recorded count edited",
						recordedCount: 1,
						newIndex: 0
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => {
							listItem = {
								listIndex: 0,
								series: {
									seriesName: items[0].seriesName,
									nowShowing: params.nowShowing || items[0].nowShowing,
									programId: params.programId || items[0].programId,
									programName: params.programName || items[0].programName,
									recordedCount: params.recordedCount || items[0].recordedCount,
									expectedCount: items[0].expectedCount
								}
							};

							items = items.slice(1);
							items.splice(params.newIndex, 0, listItem.series);
							scheduleController.origProgramId = items[0].programId;
							scheduleController.origNowShowing = items[0].nowShowing;
							scheduleController.activate(listItem);
						});

						it("should update the schedule list", () => scheduleController.scheduleList.items.should.deep.equal(items));
						it("should refresh the list", () => scheduleController.scheduleList.refresh.should.have.been.called);
						it("should set the list to view mode", () => scheduleController.viewItems.should.have.been.called);
					});
				});
			});
		});
	});

	describe("listRetrieved", () => {
		beforeEach(() => {
			sinon.stub(scheduleController, "viewItems");
			scheduleController.scheduleList = {refresh: sinon.stub()};
			scheduleController.listRetrieved(items);
		});

		it("should set the schedule list items", () => scheduleController.scheduleList.items.should.deep.equal(items));
		it("should refresh the list", () => scheduleController.scheduleList.refresh.should.have.been.called);
		it("should set the list to view mode", () => scheduleController.viewItems.should.have.been.called);
	});

	describe("viewItem", () => {
		it("should push the episodes view for the selected item", () => {
			const index = 0;

			scheduleController.scheduleList = {items};
			scheduleController.viewItem(index);
			appController.pushView.should.have.been.calledWith("episodes", {
				source: "Schedule",
				listIndex: index,
				series: items[index]
			});
		});
	});

	describe("viewUnscheduled", () => {
		it("should push the unscheduled view", () => {
			scheduleController.viewUnscheduled();
			appController.pushView.should.have.been.calledWithExactly("unscheduled");
		});
	});

	describe("viewPrograms", () => {
		it("should push the programs view", () => {
			scheduleController.viewPrograms();
			appController.pushView.should.have.been.calledWithExactly("programs");
		});
	});

	describe("viewSettings", () => {
		it("should push the settings view", () => {
			scheduleController.viewSettings();
			appController.pushView.should.have.been.calledWithExactly("settings");
		});
	});

	describe("editItem", () => {
		let index;

		beforeEach(() => {
			index = 0;
			scheduleController.scheduleList = {items};
			scheduleController.editItem(index);
		});

		it("should save the original program id", () => scheduleController.origProgramId.should.equal(items[index].programId));
		it("should save the original now showing", () => scheduleController.origNowShowing.should.equal(items[index].nowShowing));
		it("should push the series view for the selected item", () => appController.pushView.should.have.been.calledWith("series", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("editItems", () => {
		beforeEach(() => {
			sinon.stub(scheduleController, "activate");
			sinon.stub(scheduleController, "viewItems");
			scheduleController.setup();
			scheduleController.editItems();
		});

		it("should set the list to edit mode", () => scheduleController.scheduleList.action.should.equal("edit"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);
		it("should set the list item icons", () => scheduleList.hasClass("edit").should.be.true);
		it("should set the footer label", () => scheduleController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			scheduleController.footer.leftButton.eventHandler();
			scheduleController.viewItems.should.have.been.called;
		});

		it("should set the footer left button style", () => scheduleController.footer.leftButton.style.should.equal("confirmButton"));
		it("should set the footer left button label", () => scheduleController.footer.leftButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", () => {
		beforeEach(() => {
			sinon.stub(scheduleController, "activate");
			sinon.stub(scheduleController, "editItems");
			sinon.stub(scheduleController, "viewSettings");
			scheduleController.setup();
			scheduleController.viewItems();
		});

		it("should set the list to view mode", () => scheduleController.scheduleList.action.should.equal("view"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);
		it("should set the list item icons", () => scheduleList.hasClass("edit").should.be.false);
		it("should set the footer label", () => scheduleController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			scheduleController.footer.leftButton.eventHandler();
			scheduleController.editItems.should.have.been.called;
		});

		it("should set the footer left button label", () => scheduleController.footer.leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", () => {
			scheduleController.footer.rightButton.eventHandler();
			scheduleController.viewSettings.should.have.been.called;
		});

		it("should set the footer right button label", () => scheduleController.footer.rightButton.label.should.equal("Settings"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	afterEach(() => scheduleList.remove());
});