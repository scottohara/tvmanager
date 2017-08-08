define(
	[
		"models/series-model",
		"framework/sw/spinningwheel",
		"controllers/series-controller",
		"controllers/application-controller",
		"models/program-model",
		"framework/jquery"
	],

	(Series, SpinningWheel, SeriesController, ApplicationController, Program, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("SeriesController", () => {
			let listItem,
					seriesController;

			beforeEach(() => {
				listItem = {
					listIndex: 0,
					series: {
						seriesName: "test-series",
						nowShowing: 1,
						nowShowingDisplay: "Not Showing",
						programId: 1,
						save: sinon.stub(),
						setNowShowing: sinon.stub()
					}
				};

				seriesController = new SeriesController(listItem);
			});

			describe("object constructor", () => {
				describe("update", () => {
					it("should return a SeriesController instance", () => seriesController.should.be.an.instanceOf(SeriesController));
					it("should set the list item", () => seriesController.listItem.should.deep.equal(listItem));
					it("should save the original now showing", () => seriesController.originalNowShowing.should.equal(listItem.series.nowShowing));
					it("should save the original program id", () => seriesController.originalProgramId.should.equal(listItem.series.programId));
				});

				describe("add", () => {
					beforeEach(() => {
						listItem = {
							program: {
								id: 1,
								programName: "test-program"
							}
						};
						seriesController = new SeriesController(listItem);
					});

					it("should return a SeriesController instance", () => seriesController.should.be.an.instanceOf(SeriesController));

					it("should create a list item", () => {
						seriesController.listItem.series.programId.should.equal(listItem.program.id);
						seriesController.listItem.series.programName.should.equal(listItem.program.programName);
					});
				});
			});

			describe("setup", () => {
				let seriesName,
						nowShowing,
						moveTo;

				beforeEach(() => {
					sinon.stub(seriesController, "cancel");
					sinon.stub(seriesController, "save");
					sinon.stub(seriesController, "getNowShowing");
					sinon.stub(seriesController, "getProgramId");

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
				});

				it("should set the header label", () => seriesController.header.label.should.equal("Add/Edit Series"));

				it("should attach a header left button event handler", () => {
					seriesController.header.leftButton.eventHandler();
					seriesController.cancel.should.have.been.called;
				});

				it("should set the header left button label", () => seriesController.header.leftButton.label.should.equal("Cancel"));

				it("should attach a header right button event handler", () => {
					seriesController.header.rightButton.eventHandler();
					seriesController.save.should.have.been.called;
				});

				it("should set the header right button style", () => seriesController.header.rightButton.style.should.equal("confirmButton"));
				it("should set the header right button label", () => seriesController.header.rightButton.label.should.equal("Save"));
				it("should set the series name", () => seriesName.val().should.equal(listItem.series.seriesName));
				it("should set the now showing", () => nowShowing.val().should.equal(listItem.series.nowShowingDisplay));

				it("should attach a now showing click event handler", () => {
					nowShowing.trigger("click");
					seriesController.getNowShowing.should.have.been.called;
				});

				it("should attach a move to click event handler", () => {
					moveTo.trigger("click");
					seriesController.getProgramId.should.have.been.called;
				});

				afterEach(() => {
					seriesName.remove();
					nowShowing.remove();
					moveTo.remove();
				});
			});

			describe("save", () => {
				let seriesName,
						seriesNameInput;

				beforeEach(() => {
					seriesName = "test-series-2";

					seriesNameInput = $("<input>")
						.attr("id", "seriesName")
						.val(seriesName)
						.appendTo(document.body);

					seriesController.save();
				});

				it("should get the series name", () => seriesController.listItem.series.seriesName.should.equal(seriesName));
				it("should save the series", () => listItem.series.save.should.have.been.called);
				it("should pop the view", () => appController.popView.should.have.been.called);

				afterEach(() => seriesNameInput.remove());
			});

			describe("cancel", () => {
				beforeEach(() => {
					seriesController.listItem.series.programId = 2;
					seriesController.cancel();
				});

				it("should revert any changes", () => {
					seriesController.listItem.series.setNowShowing.should.have.been.calledWith(1);
					seriesController.listItem.series.programId.should.equal(1);
				});

				it("should pop the view", () => appController.popView.should.have.been.called);
			});

			describe("getNowShowing", () => {
				describe("in progress", () => {
					it("should do nothing", () => {
						seriesController.gettingNowShowing = true;
						seriesController.getNowShowing();
						seriesController.gettingNowShowing.should.be.true;
					});
				});

				describe("not in progress", () => {
					const testParams = [
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

					let swWrapper;

					beforeEach(() => {
						sinon.stub(seriesController, "setNowShowing");
						SpinningWheel.addSlot.reset();
						SpinningWheel.setDoneAction.resetHistory();
						SpinningWheel.open.reset();

						swWrapper = $("<div>")
							.attr("id", "sw-wrapper")
							.appendTo(document.body);
					});

					testParams.forEach(params => {
						describe(params.description, () => {
							beforeEach(() => {
								seriesController.listItem.series.nowShowing = params.nowShowing;
								seriesController.getNowShowing();
							});

							it("should initialise the SpinningWheel", () => SpinningWheel.addSlot.should.have.been.calledWith(Series.NOW_SHOWING, "left", params.expected));

							it("should attach a done callback to the SpinningWheel", () => {
								SpinningWheel.setDoneAction.should.have.been.called;
								seriesController.setNowShowing.should.have.been.called;
							});

							it("should open the SpinningWheel", () => SpinningWheel.open.should.have.been.called);
							it("should wrap the SpinningWheel in a touch event proxy", () => seriesController.swtoucheventproxy.element.should.deep.equal(swWrapper.get(0)));
							it("should clear the semaphore", () => seriesController.gettingNowShowing.should.be.false);
						});
					});

					afterEach(() => swWrapper.remove());
				});
			});

			describe("setNowShowing", () => {
				let nowShowing;

				beforeEach(() => {
					SpinningWheel.getSelectedValues.reset();
					SpinningWheel.getSelectedValues.returns({
						keys: [1],
						values: ["Mondays"]
					});

					seriesController.swtoucheventproxy = {};
					seriesController.listItem.series.nowShowingDisplay = "Mondays";

					nowShowing = $("<input>")
						.attr("id", "nowShowing")
						.appendTo(document.body);

					seriesController.setNowShowing();
				});

				it("should get the selected value from the SpinningWheel", () => listItem.series.setNowShowing.should.have.been.calledWith(1));
				it("should update the view", () => nowShowing.val().should.equal("Mondays"));
				it("should remove the touch event proxy", () => (null === seriesController.swtoucheventproxy).should.be.true);

				afterEach(() => nowShowing.remove());
			});

			describe("getProgramId", () => {
				beforeEach(() => sinon.stub(seriesController, "listRetrieved"));

				describe("in progress", () => {
					it("should do nothing", () => {
						seriesController.gettingProgramId = true;
						seriesController.getProgramId();
						seriesController.listRetrieved.should.not.have.been.called;
					});
				});

				describe("not in progress", () => {
					let programs;

					beforeEach(() => {
						programs = ["program 1", "program 2"];
						Program.programs = programs;
						seriesController.getProgramId();
					});

					it("should set the semaphore", () => seriesController.gettingProgramId.should.be.true);
					it("should get the list of programs", () => seriesController.listRetrieved.should.have.been.calledWith(programs));
				});
			});

			describe("listRetrieved", () => {
				let swWrapper,
						programs;

				beforeEach(() => {
					sinon.stub(seriesController, "setProgramId");
					SpinningWheel.addSlot.reset();
					SpinningWheel.setDoneAction.resetHistory();
					SpinningWheel.open.reset();

					swWrapper = $("<div>")
						.attr("id", "sw-wrapper")
						.appendTo(document.body);

					programs = {
						1: "program 1",
						2: "program 2"
					};

					seriesController.gettingProgramId = true;
					seriesController.listRetrieved([
						{id: 1, programName: "program 1"},
						{id: 2, programName: "program 2"}
					]);
				});

				it("should initialise the SpinningWheel", () => SpinningWheel.addSlot.should.have.been.calledWith(programs, "left", listItem.series.programId));

				it("should attach a done callback to the SpinningWheel", () => {
					SpinningWheel.setDoneAction.should.have.been.called;
					seriesController.setProgramId.should.have.been.called;
				});

				it("should open the SpinningWheel", () => SpinningWheel.open.should.have.been.called);
				it("should wrap the SpinningWheel in a touch event proxy", () => (null !== seriesController.swtoucheventproxy).should.be.true);
				it("should clear the semaphore", () => seriesController.gettingProgramId.should.be.false);

				afterEach(() => swWrapper.remove());
			});

			describe("setProgramId", () => {
				let moveTo;

				beforeEach(() => {
					SpinningWheel.getSelectedValues.reset();
					SpinningWheel.getSelectedValues.returns({
						keys: [2],
						values: ["program 2"]
					});

					seriesController.swtoucheventproxy = {};

					moveTo = $("<input>")
						.attr("id", "moveTo")
						.appendTo(document.body);

					seriesController.setProgramId();
				});

				it("should get the selected value from the SpinningWheel", () => {
					listItem.series.programId.should.equal(2);
					listItem.series.programName.should.equal("program 2");
				});

				it("should update the view", () => moveTo.val().should.equal("program 2"));
				it("should remove the touch event proxy", () => (null === seriesController.swtoucheventproxy).should.be.true);

				afterEach(() => moveTo.remove());
			});
		});
	}
);