import {
	NavButton,
	ProgramListItem,
	SeriesListItem
} from "controllers";
import sinon, { SinonStub } from "sinon";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ProgramMock from "mocks/program-model-mock";
import SeriesController from "controllers/series-controller";
import SeriesMock from "mocks/series-model-mock";
import SeriesView from "views/series-view.html";
import SpinningWheelMock from "mocks/spinningwheel-mock";
import TouchEventProxy from "components/toucheventproxy";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("SeriesController", (): void => {
	let listItem: SeriesListItem,
			seriesController: SeriesController;

	beforeEach((): void => {
		listItem = {
			listIndex: 0,
			series: new SeriesMock(null, "test-series", 1, "1")
		};

		seriesController = new SeriesController(listItem);
	});

	describe("object constructor", (): void => {
		describe("update", (): void => {
			it("should return a SeriesController instance", (): Chai.Assertion => seriesController.should.be.an.instanceOf(SeriesController));
			it("should set the list item", (): Chai.Assertion => seriesController["listItem"].should.deep.equal(listItem));
			it("should save the original now showing", (): Chai.Assertion => Number(seriesController["originalNowShowing"]).should.equal(listItem.series.nowShowing));
			it("should save the original program id", (): Chai.Assertion => String(seriesController["originalProgramId"]).should.equal(listItem.series.programId));
		});

		describe("add", (): void => {
			let programListItem: ProgramListItem;

			beforeEach((): void => {
				programListItem = { program: new ProgramMock("1", "test-program") };
				seriesController = new SeriesController(programListItem);
			});

			it("should return a SeriesController instance", (): Chai.Assertion => seriesController.should.be.an.instanceOf(SeriesController));

			it("should create a list item", (): void => {
				String(seriesController["listItem"].series.programId).should.equal(programListItem.program.id);
				String(seriesController["listItem"].series.programName).should.equal(programListItem.program.programName);
			});
		});
	});

	describe("view", (): void => {
		it("should return the series view", (): Chai.Assertion => seriesController.view.should.equal(SeriesView));
	});

	describe("setup", (): void => {
		let seriesName: JQuery<HTMLElement>,
				nowShowing: JQuery<HTMLElement>,
				moveTo: JQuery<HTMLElement>,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(seriesController, "cancel" as keyof SeriesController);
			sinon.stub(seriesController, "save" as keyof SeriesController);
			sinon.stub(seriesController, "getNowShowing" as keyof SeriesController);
			sinon.stub(seriesController, "getProgramId" as keyof SeriesController);

			seriesName = $("<input>")
				.attr("id", "seriesName")
				.appendTo(document.body);

			nowShowing = $("<input>")
				.attr("id", "nowShowing")
				.appendTo(document.body);

			moveTo = $("<input>")
				.attr("id", "moveTo")
				.appendTo(document.body);

			seriesController.setup();
			leftButton = seriesController.header.leftButton as NavButton;
			rightButton = seriesController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(seriesController.header.label).should.equal("Add/Edit Series"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			seriesController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			seriesController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));
		it("should set the series name", (): Chai.Assertion => String(seriesName.val()).should.equal(listItem.series.seriesName));
		it("should set the now showing", (): Chai.Assertion => String(nowShowing.val()).should.equal(listItem.series.nowShowingDisplay));

		it("should attach a now showing click event handler", (): void => {
			nowShowing.trigger("click");
			seriesController["getNowShowing"].should.have.been.called;
		});

		it("should attach a move to click event handler", (): void => {
			moveTo.trigger("click");
			seriesController["getProgramId"].should.have.been.called;
		});

		afterEach((): void => {
			seriesName.remove();
			nowShowing.remove();
			moveTo.remove();
		});
	});

	describe("save", (): void => {
		let seriesName: string,
				seriesNameInput: JQuery<HTMLElement>;

		beforeEach((): void => {
			seriesName = "test-series-2";

			seriesNameInput = $("<input>")
				.attr("id", "seriesName")
				.val(seriesName)
				.appendTo(document.body);

			seriesController["save"]();
		});

		it("should get the series name", (): Chai.Assertion => String(seriesController["listItem"].series.seriesName).should.equal(seriesName));
		it("should save the series", (): Chai.Assertion => listItem.series.save.should.have.been.called);
		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);

		afterEach((): JQuery<HTMLElement> => seriesNameInput.remove());
	});

	describe("cancel", (): void => {
		beforeEach((): void => {
			seriesController["listItem"].series.programId = "2";
			seriesController["cancel"]();
		});

		it("should revert any changes", (): void => {
			seriesController["listItem"].series.setNowShowing.should.have.been.calledWith(1);
			String(seriesController["listItem"].series.programId).should.equal("1");
		});

		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
	});

	describe("getNowShowing", (): void => {
		describe("in progress", (): void => {
			it("should do nothing", (): void => {
				seriesController["gettingNowShowing"] = true;
				seriesController["getNowShowing"]();
				seriesController["gettingNowShowing"].should.be.true;
			});
		});

		describe("not in progress", (): void => {
			interface Scenario {
				description: string;
				nowShowing: number | null;
				expected: number;
			}

			const scenarios: Scenario[] = [
				{
					description: "showing",
					nowShowing: 1,
					expected: 1
				},
				{
					description: "not showing",
					nowShowing: null,
					expected: 0
				}
			];

			let swWrapper: JQuery<HTMLElement>;

			beforeEach((): void => {
				sinon.stub(seriesController, "setNowShowing" as keyof SeriesController);
				(SpinningWheelMock.addSlot as SinonStub).reset();
				SpinningWheelMock.setDoneAction.resetHistory();
				SpinningWheelMock.open.reset();

				swWrapper = $("<div>")
					.attr("id", "sw-wrapper")
					.appendTo(document.body);
			});

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					beforeEach((): void => {
						seriesController["listItem"].series.nowShowing = scenario.nowShowing;
						seriesController["getNowShowing"]();
					});

					it("should initialise the SpinningWheel", (): Chai.Assertion => SpinningWheelMock.addSlot.should.have.been.calledWith(SeriesMock.NOW_SHOWING, "left", scenario.expected));

					it("should attach a done callback to the SpinningWheel", (): void => {
						SpinningWheelMock.setDoneAction.should.have.been.called;
						seriesController["setNowShowing"].should.have.been.called;
					});

					it("should open the SpinningWheel", (): Chai.Assertion => SpinningWheelMock.open.should.have.been.called);
					it("should wrap the SpinningWheel in a touch event proxy", (): Chai.Assertion => (seriesController.swtoucheventproxy as TouchEventProxy)["element"].should.deep.equal(swWrapper.get(0)));
					it("should clear the semaphore", (): Chai.Assertion => seriesController["gettingNowShowing"].should.be.false);
				});
			});

			afterEach((): JQuery<HTMLElement> => swWrapper.remove());
		});
	});

	describe("setNowShowing", (): void => {
		let nowShowing: JQuery<HTMLElement>;

		beforeEach((): void => {
			(SpinningWheelMock.getSelectedValues as SinonStub).reset();
			(SpinningWheelMock.getSelectedValues as SinonStub).returns({
				keys: [1],
				values: ["Mondays"]
			});

			seriesController.swtoucheventproxy = {} as TouchEventProxy;
			seriesController["listItem"].series.nowShowingDisplay = "Mondays";

			nowShowing = $("<input>")
				.attr("id", "nowShowing")
				.appendTo(document.body);

			seriesController["setNowShowing"]();
		});

		it("should get the selected value from the SpinningWheel", (): Chai.Assertion => listItem.series.setNowShowing.should.have.been.calledWith(1));
		it("should update the view", (): Chai.Assertion => String(nowShowing.val()).should.equal("Mondays"));
		it("should remove the touch event proxy", (): Chai.Assertion => (null === seriesController.swtoucheventproxy).should.be.true);

		afterEach((): JQuery<HTMLElement> => nowShowing.remove());
	});

	describe("getProgramId", (): void => {
		beforeEach((): SinonStub => sinon.stub(seriesController, "listRetrieved" as keyof SeriesController));

		describe("in progress", (): void => {
			it("should do nothing", (): void => {
				seriesController["gettingProgramId"] = true;
				seriesController["getProgramId"]();
				seriesController["listRetrieved"].should.not.have.been.called;
			});
		});

		describe("not in progress", (): void => {
			let programs: ProgramMock[];

			beforeEach((): void => {
				programs = [
					new ProgramMock(null, "program 1"),
					new ProgramMock(null, "program 2")
				];
				ProgramMock.programs = programs;
				seriesController["getProgramId"]();
			});

			it("should set the semaphore", (): Chai.Assertion => seriesController["gettingProgramId"].should.be.true);
			it("should get the list of programs", (): Chai.Assertion => seriesController["listRetrieved"].should.have.been.calledWith(programs));
		});
	});

	describe("listRetrieved", (): void => {
		let swWrapper: JQuery<HTMLElement>,
				programs: {[key: string]: string;};

		beforeEach((): void => {
			sinon.stub(seriesController, "setProgramId" as keyof SeriesController);
			(SpinningWheelMock.addSlot as SinonStub).reset();
			SpinningWheelMock.setDoneAction.resetHistory();
			SpinningWheelMock.open.reset();

			swWrapper = $("<div>")
				.attr("id", "sw-wrapper")
				.appendTo(document.body);

			programs = {
				1: "program 1",
				2: "program 2"
			};

			seriesController["gettingProgramId"] = true;
			seriesController["listRetrieved"]([
				new ProgramMock("1", "program 1"),
				new ProgramMock("2", "program 2")
			]);
		});

		it("should initialise the SpinningWheel", (): Chai.Assertion => SpinningWheelMock.addSlot.should.have.been.calledWith(programs, "left", listItem.series.programId));

		it("should attach a done callback to the SpinningWheel", (): void => {
			SpinningWheelMock.setDoneAction.should.have.been.called;
			seriesController["setProgramId"].should.have.been.called;
		});

		it("should open the SpinningWheel", (): Chai.Assertion => SpinningWheelMock.open.should.have.been.called);
		it("should wrap the SpinningWheel in a touch event proxy", (): Chai.Assertion => (null !== seriesController.swtoucheventproxy).should.be.true);
		it("should clear the semaphore", (): Chai.Assertion => seriesController["gettingProgramId"].should.be.false);

		afterEach((): JQuery<HTMLElement> => swWrapper.remove());
	});

	describe("setProgramId", (): void => {
		let moveTo: JQuery<HTMLElement>;

		beforeEach((): void => {
			(SpinningWheelMock.getSelectedValues as SinonStub).reset();
			(SpinningWheelMock.getSelectedValues as SinonStub).returns({
				keys: [2],
				values: ["program 2"]
			});

			seriesController.swtoucheventproxy = {} as TouchEventProxy;

			moveTo = $("<input>")
				.attr("id", "moveTo")
				.appendTo(document.body);

			seriesController["setProgramId"]();
		});

		it("should get the selected value from the SpinningWheel", (): void => {
			String(listItem.series.programId).should.equal("2");
			String(listItem.series.programName).should.equal("program 2");
		});

		it("should update the view", (): Chai.Assertion => String(moveTo.val()).should.equal("program 2"));
		it("should remove the touch event proxy", (): Chai.Assertion => (null === seriesController.swtoucheventproxy).should.be.true);

		afterEach((): JQuery<HTMLElement> => moveTo.remove());
	});
});