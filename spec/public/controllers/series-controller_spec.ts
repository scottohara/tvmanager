import {
	NavButton,
	NavButtonEventHandler,
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
			let seriesListItem: SeriesListItem;

			beforeEach((): void => {
				seriesListItem = {
					series: new SeriesMock(null, null, null, null),
					sequence: 1,
					program: new ProgramMock("1", "test-program")
				};
				seriesController = new SeriesController(seriesListItem);
			});

			it("should return a SeriesController instance", (): Chai.Assertion => seriesController.should.be.an.instanceOf(SeriesController));

			it("should create a list item", (): void => {
				String(seriesController["listItem"].series.seriesName).should.equal(`Series ${Number(seriesListItem.sequence) + 1}`);
				String(seriesController["listItem"].series.programId).should.equal((seriesListItem.program as ProgramMock).id);
				String(seriesController["listItem"].series.programName).should.equal((seriesListItem.program as ProgramMock).programName);
			});
		});
	});

	describe("view", (): void => {
		it("should return the series view", (): Chai.Assertion => seriesController.view.should.equal(SeriesView));
	});

	describe("setup", (): void => {
		let seriesName: JQuery,
				nowShowing: JQuery,
				moveTo: JQuery,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(seriesController, "cancel" as keyof SeriesController);
			sinon.stub(seriesController, "save" as keyof SeriesController);
			sinon.stub(seriesController, "getProgramId" as keyof SeriesController);

			seriesName = $("<input>")
				.attr("id", "seriesName")
				.appendTo(document.body);

			nowShowing = $("<select>")
				.attr("id", "nowShowing")
				.appendTo(document.body);

			$("<option>")
				.appendTo(nowShowing);

			$("<option>")
				.val(String(listItem.series.nowShowing))
				.appendTo(nowShowing);

			moveTo = $("<input>")
				.attr("id", "moveTo")
				.appendTo(document.body);

			await seriesController.setup();
			leftButton = seriesController.header.leftButton as NavButton;
			rightButton = seriesController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(seriesController.header.label).should.equal("Add/Edit Series"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			seriesController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			seriesController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));
		it("should set the series name", (): Chai.Assertion => String(seriesName.val()).should.equal(listItem.series.seriesName));
		it("should set the now showing", (): Chai.Assertion => Number(nowShowing.val()).should.equal(listItem.series.nowShowing));

		it("should attach a move to click event handler", (): void => {
			moveTo.trigger("click");
			seriesController["getProgramId"].should.have.been.called;
		});

		describe("not showing", (): void => {
			beforeEach(async (): Promise<void> => {
				seriesController["listItem"].series.nowShowing = null;
				await seriesController.setup();
			});

			it("should not set the now showing", (): Chai.Assertion => String(nowShowing.val()).should.equal(""));
		});

		afterEach((): void => {
			seriesName.remove();
			nowShowing.remove();
			moveTo.remove();
		});
	});

	describe("contentShown", (): void => {
		let seriesName: JQuery,
				select: SinonStub;

		beforeEach((): void => {
			seriesName = $("<input>")
				.attr("id", "seriesName")
				.appendTo(document.body);

			select = sinon.stub($.fn, "select");
		});

		describe("adding series", (): void => {
			beforeEach((): void => {
				seriesController["listItem"].listIndex = undefined;
				seriesController.contentShown();
			});

			it("should select the series name text", (): Chai.Assertion => select.should.have.been.called);
		});

		describe("not adding series", (): void => {
			beforeEach((): void => seriesController.contentShown());
			it("should not select the series name text", (): Chai.Assertion => select.should.not.have.been.called);
		});

		afterEach((): void => {
			seriesName.remove();
			select.restore();
		});
	});

	describe("save", (): void => {
		let seriesName: string,
				nowShowing: number,
				seriesNameInput: JQuery,
				nowShowingSelect: JQuery;

		beforeEach((): void => {
			seriesName = "test-series-2";
			nowShowing = 2;

			seriesNameInput = $("<input>")
				.attr("id", "seriesName")
				.val(seriesName)
				.appendTo(document.body);

			nowShowingSelect = $("<select>")
				.attr("id", "nowShowing")
				.val(String(nowShowing))
				.appendTo(document.body);

			$("<option>")
				.val(String(nowShowing))
				.appendTo(nowShowingSelect);
		});

		describe("now showing", (): void => {
			beforeEach(async (): Promise<void> => seriesController["save"]());

			it("should get the series name", (): Chai.Assertion => String(seriesController["listItem"].series.seriesName).should.equal(seriesName));
			it("should get the now showing", (): Chai.Assertion => Number(seriesController["listItem"].series.nowShowing).should.equal(nowShowing));
			it("should save the series", (): Chai.Assertion => listItem.series.save.should.have.been.called);
			it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
		});

		describe("not showing", (): void => {
			beforeEach(async (): Promise<void> => {
				nowShowingSelect.val("");
				await seriesController["save"]();
			});

			it("should get the series name", (): Chai.Assertion => String(seriesController["listItem"].series.seriesName).should.equal(seriesName));
			it("should get the now showing", (): Chai.Assertion => (null === seriesController["listItem"].series.nowShowing).should.be.true);
			it("should save the series", (): Chai.Assertion => listItem.series.save.should.have.been.called);
			it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
		});

		afterEach((): void => {
			seriesNameInput.remove();
			nowShowingSelect.remove();
		});
	});

	describe("cancel", (): void => {
		beforeEach(async (): Promise<void> => {
			seriesController["listItem"].series.nowShowing = 2;
			seriesController["listItem"].series.programId = "2";
			await seriesController["cancel"]();
		});

		it("should revert any changes", (): void => {
			Number(seriesController["listItem"].series.nowShowing).should.equal(1);
			String(seriesController["listItem"].series.programId).should.equal("1");
		});

		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
	});

	describe("getProgramId", (): void => {
		beforeEach((): SinonStub => sinon.stub(seriesController, "listRetrieved" as keyof SeriesController));

		describe("in progress", (): void => {
			it("should do nothing", async (): Promise<void> => {
				seriesController["gettingProgramId"] = true;
				await seriesController["getProgramId"]();
				seriesController["listRetrieved"].should.not.have.been.called;
			});
		});

		describe("not in progress", (): void => {
			let programs: ProgramMock[];

			beforeEach(async (): Promise<void> => {
				programs = [
					new ProgramMock(null, "program 1"),
					new ProgramMock(null, "program 2")
				];
				ProgramMock.programs = programs;
				await seriesController["getProgramId"]();
			});

			it("should set the semaphore", (): Chai.Assertion => seriesController["gettingProgramId"].should.be.true);
			it("should get the list of programs", (): Chai.Assertion => seriesController["listRetrieved"].should.have.been.calledWith(programs));
		});
	});

	describe("listRetrieved", (): void => {
		let swWrapper: JQuery,
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

		afterEach((): JQuery => swWrapper.remove());
	});

	describe("setProgramId", (): void => {
		let moveTo: JQuery;

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

		afterEach((): JQuery => moveTo.remove());
	});
});