import {
	HeaderFooter,
	NavButton,
	SeriesListItem
} from "controllers";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ListMock from "mocks/list-mock";
import ScheduleController from "controllers/schedule-controller";
import ScheduleView from "views/schedule-view.html";
import SeriesMock from "mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("ScheduleController", (): void => {
	let items: SeriesMock[],
			scheduleList: JQuery<HTMLElement>,
			scheduleController: ScheduleController;

	beforeEach((): void => {
		items = [
			new SeriesMock(null, "test-series", 1, "2", "test-program-2"),
			new SeriesMock(null, "test-series", 1, "3", "test-program-3"),
			new SeriesMock(null, "test-series", null, "1", "test-program-1"),
			new SeriesMock(null, "test-series", null, "1", "test-program-1")
		];

		scheduleList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		scheduleController = new ScheduleController();
	});

	describe("object constructor", (): void => {
		it("should return a ScheduleController instance", (): Chai.Assertion => scheduleController.should.be.an.instanceOf(ScheduleController));
	});

	describe("view", (): void => {
		it("should return the schedule view", (): Chai.Assertion => scheduleController.view.should.equal(ScheduleView));
	});

	describe("setup", (): void => {
		let	leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(scheduleController, "viewItem" as keyof ScheduleController);
			sinon.stub(scheduleController, "editItem" as keyof ScheduleController);
			sinon.stub(scheduleController, "viewUnscheduled" as keyof ScheduleController);
			sinon.stub(scheduleController, "viewPrograms" as keyof ScheduleController);
			sinon.stub(scheduleController, "activate");
			await scheduleController.setup();
			leftButton = scheduleController.header.leftButton as NavButton;
			rightButton = scheduleController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(scheduleController.header.label).should.equal("Schedule"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			scheduleController["viewUnscheduled"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Unscheduled"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			scheduleController["viewPrograms"].should.have.been.called;
		});

		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Programs"));

		it("should attach a view event handler to the schedule list", (): void => {
			(scheduleController["scheduleList"] as ListMock).viewEventHandler(0);
			scheduleController["viewItem"].should.have.been.calledWith(0);
		});

		it("should attach an edit event handler to the programs list", (): void => {
			((scheduleController["scheduleList"] as ListMock).editEventHandler as Function)(0);
			scheduleController["editItem"].should.have.been.calledWith(0);
		});

		it("should activate the controller", (): Chai.Assertion => scheduleController.activate.should.have.been.called);
	});

	describe("activate", (): void => {
		describe("from launch", (): void => {
			beforeEach(async (): Promise<void> => {
				sinon.stub(scheduleController, "listRetrieved" as keyof ScheduleController);
				SeriesMock.series = items;
				await scheduleController.activate();
			});

			it("should get the list of scheduled series", (): void => {
				SeriesMock.listByNowShowing.should.have.been.called;
				scheduleController["listRetrieved"].should.have.been.calledWith(items);
			});
		});

		describe("from episodes view", (): void => {
			let listItem: SeriesListItem;

			beforeEach((): void => {
				sinon.stub(scheduleController, "viewItems" as keyof ScheduleController);

				scheduleController["scheduleList"] = new ListMock("", "", "", items.slice(0));
			});

			describe("not scheduled", (): void => {
				beforeEach(async (): Promise<void> => {
					listItem = {
						listIndex: 0,
						series: new SeriesMock("", "", null, null)
					};
					await scheduleController.activate(listItem);
				});

				it("should remove the item from the schedule list", (): Chai.Assertion => scheduleController["scheduleList"].items.should.deep.equal(items.slice(1)));
				it("should refresh the list", (): Chai.Assertion => scheduleController["scheduleList"].refresh.should.have.been.called);
				it("should set the list to view mode", (): Chai.Assertion => scheduleController["viewItems"].should.have.been.called);
			});

			describe("scheduled", (): void => {
				interface Scenario {
					description: string;
					programId?: string;
					programName?: string;
					nowShowing?: number;
					recordedCount?: number;
					newIndex: number;
				}

				const scenarios: Scenario[] = [
					{
						description: "program edited",
						programId: "4",
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

				scenarios.forEach((scenario: Scenario): void => {
					describe(scenario.description, (): void => {
						beforeEach(async (): Promise<void> => {
							const [{ seriesName, nowShowing, programId, programName, recordedCount, expectedCount }] = items,
										item = { ...{ seriesName, nowShowing, programId, programName, recordedCount, expectedCount }, ...scenario };

							listItem = {
								listIndex: 0,
								series: new SeriesMock(null, item.seriesName, item.nowShowing, item.programId, item.programName, 0, 0, item.recordedCount, item.expectedCount)
							};

							items = items.slice(1);
							items.splice(scenario.newIndex, 0, listItem.series as SeriesMock);
							scheduleController["origProgramId"] = items[0].programId;
							scheduleController["origNowShowing"] = items[0].nowShowing;
							await scheduleController.activate(listItem);
						});

						it("should update the schedule list", (): Chai.Assertion => scheduleController["scheduleList"].items.should.deep.equal(items));
						it("should refresh the list", (): Chai.Assertion => scheduleController["scheduleList"].refresh.should.have.been.called);
						it("should set the list to view mode", (): Chai.Assertion => scheduleController["viewItems"].should.have.been.called);
					});
				});
			});
		});
	});

	describe("listRetrieved", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(scheduleController, "viewItems" as keyof ScheduleController);
			scheduleController["scheduleList"] = new ListMock("", "", "", []);
			await scheduleController["listRetrieved"](items);
		});

		it("should set the schedule list items", (): Chai.Assertion => scheduleController["scheduleList"].items.should.deep.equal(items));
		it("should refresh the list", (): Chai.Assertion => scheduleController["scheduleList"].refresh.should.have.been.called);
		it("should set the list to view mode", (): Chai.Assertion => scheduleController["viewItems"].should.have.been.called);
	});

	describe("viewItem", (): void => {
		it("should push the episodes view for the selected item", async (): Promise<void> => {
			const index = 0;

			scheduleController["scheduleList"] = new ListMock("", "", "", items);
			await scheduleController["viewItem"](index);
			appController.pushView.should.have.been.calledWith("episodes", {
				source: "Schedule",
				listIndex: index,
				series: items[index]
			});
		});
	});

	describe("viewUnscheduled", (): void => {
		it("should push the unscheduled view", async (): Promise<void> => {
			await scheduleController["viewUnscheduled"]();
			appController.pushView.should.have.been.calledWithExactly("unscheduled");
		});
	});

	describe("viewPrograms", (): void => {
		it("should push the programs view", async (): Promise<void> => {
			await scheduleController["viewPrograms"]();
			appController.pushView.should.have.been.calledWithExactly("programs");
		});
	});

	describe("viewSettings", (): void => {
		it("should push the settings view", async (): Promise<void> => {
			await scheduleController["viewSettings"]();
			appController.pushView.should.have.been.calledWithExactly("settings");
		});
	});

	describe("editItem", (): void => {
		let index: number;

		beforeEach(async (): Promise<void> => {
			index = 0;
			scheduleController["scheduleList"] = new ListMock("", "", "", items);
			await scheduleController["editItem"](index);
		});

		it("should save the original program id", (): Chai.Assertion => String(scheduleController["origProgramId"]).should.equal(items[index].programId));
		it("should save the original now showing", (): Chai.Assertion => Number(scheduleController["origNowShowing"]).should.equal(items[index].nowShowing));
		it("should push the series view for the selected item", (): Chai.Assertion => appController.pushView.should.have.been.calledWith("series", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("editItems", (): void => {
		let footer: HeaderFooter,
				leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(scheduleController, "activate");
			sinon.stub(scheduleController, "viewItems" as keyof ScheduleController);
			await scheduleController.setup();
			await scheduleController["editItems"]();
			footer = scheduleController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
		});

		it("should set the list to edit mode", (): Chai.Assertion => (scheduleController["scheduleList"] as ListMock).action.should.equal("edit"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);
		it("should set the list item icons", (): Chai.Assertion => scheduleList.hasClass("edit").should.be.true);
		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			scheduleController["viewItems"].should.have.been.called;
		});

		it("should set the footer left button style", (): Chai.Assertion => String(leftButton.style).should.equal("confirmButton"));
		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Done"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", (): void => {
		let	footer: HeaderFooter,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(scheduleController, "activate");
			sinon.stub(scheduleController, "editItems" as keyof ScheduleController);
			sinon.stub(scheduleController, "viewSettings" as keyof ScheduleController);
			await scheduleController.setup();
			await scheduleController["viewItems"]();
			footer = scheduleController.footer as HeaderFooter;
			leftButton = footer.leftButton as NavButton;
			rightButton = footer.rightButton as NavButton;
		});

		it("should set the list to view mode", (): Chai.Assertion => (scheduleController["scheduleList"] as ListMock).action.should.equal("view"));
		it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);
		it("should set the list item icons", (): Chai.Assertion => scheduleList.hasClass("edit").should.be.false);
		it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1"));

		it("should attach a footer left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			scheduleController["editItems"].should.have.been.called;
		});

		it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			scheduleController["viewSettings"].should.have.been.called;
		});

		it("should set the footer right button label", (): Chai.Assertion => rightButton.label.should.equal("Settings"));
		it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);
	});

	afterEach((): JQuery<HTMLElement> => scheduleList.remove());
});