import {
	EpisodeListItem,
	NavButton
} from "controllers";
import sinon, {
	SinonFakeTimers,
	SinonStub
} from "sinon";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeController from "controllers/episode-controller";
import EpisodeMock from "mocks/episode-model-mock";
import { EpisodeStatus } from "models";
import EpisodeView from "views/episode-view.html";
import SeriesMock from "mocks/series-model-mock";
import SpinningWheelMock from "mocks/spinningwheel-mock";
import TestController from "mocks/test-controller";
import TouchEventProxy from "components/toucheventproxy";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("EpisodeController", (): void => {
	let listItem: EpisodeListItem,
			episodeController: EpisodeController;

	beforeEach((): void => {
		listItem = {
			listIndex: 0,
			episode: new EpisodeMock(null, "test-episode", "Watched", "01-Jan", false, false)
		};

		episodeController = new EpisodeController(listItem);
	});

	describe("object constructor", (): void => {
		describe("update", (): void => {
			it("should return a EpisodeController instance", (): Chai.Assertion => episodeController.should.be.an.instanceOf(EpisodeController));
			it("should set the list item", (): Chai.Assertion => episodeController["listItem"].should.deep.equal(listItem));
			it("should save the original status", (): Chai.Assertion => episodeController["originalStatus"].should.equal(listItem.episode.status));
			it("should save the original status date", (): Chai.Assertion => episodeController["originalStatusDate"].should.equal(listItem.episode.statusDate));
		});

		describe("add", (): void => {
			beforeEach((): void => {
				listItem = {
					episode: new EpisodeMock(null, null, "", ""),
					sequence: 1,
					series: new SeriesMock("1", null, null, null)
				};
				episodeController = new EpisodeController(listItem);
			});

			it("should return a EpisodeController instance", (): Chai.Assertion => episodeController.should.be.an.instanceOf(EpisodeController));

			it("should create a list item", (): void => {
				episodeController["listItem"].episode.sequence.should.equal(listItem.sequence);
				String((episodeController["listItem"].episode as EpisodeMock).seriesId).should.equal((listItem.series as SeriesMock).id);
			});
		});
	});

	describe("view", (): void => {
		it("should return the episode view", (): Chai.Assertion => episodeController.view.should.equal(EpisodeView));
	});

	describe("setup", (): void => {
		let episodeName: JQuery,
				unverified: JQuery,
				unscheduled: JQuery,
				watched: JQuery,
				recorded: JQuery,
				expected: JQuery,
				missed: JQuery,
				statusDate: JQuery,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodeController, "cancel" as keyof EpisodeController);
			sinon.stub(episodeController, "save" as keyof EpisodeController);
			sinon.stub(episodeController, "setStatus" as keyof EpisodeController);
			sinon.stub(episodeController, "getStatusDate" as keyof EpisodeController);
			sinon.stub(episodeController, "toggleStatusDateRow" as keyof EpisodeController);

			episodeName = $("<input>")
				.attr("id", "episodeName")
				.appendTo(document.body);

			unverified = $("<input type='checkbox'>")
				.attr("id", "unverified")
				.appendTo(document.body);

			unscheduled = $("<input type='checkbox'>")
				.attr("id", "unscheduled")
				.appendTo(document.body);

			watched = $("<div>")
				.attr("id", "watched")
				.appendTo(document.body);

			recorded = $("<div>")
				.attr("id", "recorded")
				.appendTo(document.body);

			expected = $("<div>")
				.attr("id", "expected")
				.appendTo(document.body);

			missed = $("<div>")
				.attr("id", "missed")
				.appendTo(document.body);

			statusDate = $("<input>")
				.attr("id", "statusDate")
				.appendTo(document.body);

			await episodeController.setup();
			leftButton = episodeController.header.leftButton as NavButton;
			rightButton = episodeController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(episodeController.header.label).should.equal("Add/Edit Episode"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			episodeController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			episodeController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));
		it("should set the episode name", (): Chai.Assertion => String(episodeName.val()).should.equal(listItem.episode.episodeName));
		it("should set the unverified toggle", (): Chai.Assertion => unverified.prop("checked").should.equal(listItem.episode.unverified));
		it("should set the unscheduled toggle", (): Chai.Assertion => unscheduled.prop("checked").should.equal(listItem.episode.unscheduled));

		it("should attach a watched click event handler", (): void => {
			watched.trigger("click");
			episodeController["setStatus"].should.have.been.calledWith("Watched");
		});

		it("should attach a recorded click event handler", (): void => {
			recorded.trigger("click");
			episodeController["setStatus"].should.have.been.calledWith("Recorded");
		});

		it("should attach an expected click event handler", (): void => {
			expected.trigger("click");
			episodeController["setStatus"].should.have.been.calledWith("Expected");
		});

		it("should attach a missed click event handler", (): void => {
			missed.trigger("click");
			episodeController["setStatus"].should.have.been.calledWith("Missed");
		});

		it("should attach a status date click event handler", (): void => {
			statusDate.trigger("click");
			episodeController["getStatusDate"].should.have.been.called;
		});

		it("should attach an unscheduled click event handler", (): void => {
			unscheduled.trigger("click");
			episodeController["toggleStatusDateRow"].should.have.been.called;
		});

		it("should toggle the current status", (): void => {
			listItem.episode.setStatus.should.have.been.calledWith("");
			episodeController["setStatus"].should.have.been.calledWith(listItem.episode.status);
		});

		it("should set the status date", (): Chai.Assertion => String(statusDate.val()).should.equal(listItem.episode.statusDate));

		afterEach((): void => {
			episodeName.remove();
			unverified.remove();
			unscheduled.remove();
			watched.remove();
			recorded.remove();
			expected.remove();
			missed.remove();
			statusDate.remove();
		});
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			listIndex: number;
			scrollPos: number;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				listIndex: 0,
				scrollPos: 0
			},
			{
				description: "insert",
				listIndex: -1,
				scrollPos: -1
			}
		];

		let episodeName: string,
				episodeNameInput: JQuery,
				unverified: JQuery,
				unscheduled: JQuery;

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					episodeName = "test-episode-2";

					episodeNameInput = $("<input>")
						.attr("id", "episodeName")
						.val(episodeName)
						.appendTo(document.body);

					unverified = $("<input type='checkbox'>")
						.attr("id", "unverified")
						.prop("checked", true)
						.appendTo(document.body);

					unscheduled = $("<input type='checkbox'>")
						.attr("id", "unscheduled")
						.prop("checked", true)
						.appendTo(document.body);

					appController.viewStack = [
						{ controller: new TestController(), scrollPos: 0 },
						{ controller: new TestController(), scrollPos: 0 }
					];
					episodeController["listItem"].listIndex = scenario.listIndex;
					await episodeController["save"]();
				});

				it("should get the episode name", (): Chai.Assertion => String(episodeController["listItem"].episode.episodeName).should.equal(episodeName));
				it("should get the unverified toggle", (): Chai.Assertion => episodeController["listItem"].episode.setUnverified.should.have.been.calledWith(true));
				it("should get the unscheduled toggle", (): Chai.Assertion => episodeController["listItem"].episode.unscheduled.should.be.true);
				it("should save the episode", (): Chai.Assertion => listItem.episode.save.should.have.been.called);
				it("should set the series list view scroll position", (): Chai.Assertion => appController.viewStack[0].scrollPos.should.equal(scenario.scrollPos));
				it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);

				afterEach((): void => {
					episodeNameInput.remove();
					unverified.remove();
					unscheduled.remove();
				});
			});
		});
	});

	describe("cancel", (): void => {
		beforeEach(async (): Promise<void> => {
			episodeController["listItem"].episode.status = "Recorded";
			episodeController["listItem"].episode.statusDate = "02-Jan";
			await episodeController["cancel"]();
		});

		it("should revert any changes", (): void => {
			episodeController["listItem"].episode.status.should.equal("Watched");
			episodeController["listItem"].episode.statusDate.should.equal("01-Jan");
		});

		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
	});

	describe("setStatus", (): void => {
		beforeEach((): SinonStub => sinon.stub(episodeController, "toggleStatusDateRow" as keyof EpisodeController));

		describe("in progress", (): void => {
			it("should do nothing", (): void => {
				episodeController["settingStatus"] = true;
				episodeController["setStatus"]("");
				episodeController["toggleStatusDateRow"].should.not.have.been.called;
				episodeController["settingStatus"].should.be.true;
			});
		});

		describe("not in progress", (): void => {
			interface Scenario {
				description: string;
				previousStatus: EpisodeStatus;
				newStatus: EpisodeStatus;
				expectedStatus: EpisodeStatus;
				highlight: string;
				unverifiedRowHidden: boolean;
			}

			const scenarios: Scenario[] = [
				{
					description: "no change",
					previousStatus: "Watched",
					newStatus: "Watched",
					expectedStatus: "",
					highlight: "watched",
					unverifiedRowHidden: true
				},
				{
					description: "watched",
					previousStatus: "",
					newStatus: "Watched",
					expectedStatus: "Watched",
					highlight: "watched",
					unverifiedRowHidden: true
				},
				{
					description: "recorded",
					previousStatus: "Watched",
					newStatus: "Recorded",
					expectedStatus: "Recorded",
					highlight: "recorded",
					unverifiedRowHidden: false
				},
				{
					description: "expected",
					previousStatus: "Watched",
					newStatus: "Expected",
					expectedStatus: "Expected",
					highlight: "expected",
					unverifiedRowHidden: false
				},
				{
					description: "missed",
					previousStatus: "Watched",
					newStatus: "Missed",
					expectedStatus: "Missed",
					highlight: "missed",
					unverifiedRowHidden: false
				}
			];

			let watched: JQuery,
					recorded: JQuery,
					expected: JQuery,
					missed: JQuery,
					unverifiedRow: JQuery;

			beforeEach((): void => {
				watched = $("<div>")
					.attr("id", "watched")
					.appendTo(document.body);

				recorded = $("<div>")
					.attr("id", "recorded")
					.appendTo(document.body);

				expected = $("<div>")
					.attr("id", "expected")
					.appendTo(document.body);

				missed = $("<div>")
					.attr("id", "missed")
					.appendTo(document.body);

				unverifiedRow = $("<div>")
					.attr("id", "unverifiedRow")
					.appendTo(document.body);
			});

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					beforeEach((): void => {
						listItem.episode.status = scenario.previousStatus;
						episodeController["setStatus"](scenario.newStatus);
					});

					it("should set the episode status", (): Chai.Assertion => listItem.episode.setStatus.should.have.been.calledWith(scenario.expectedStatus));

					it("should toggle the status", (): void => {
						watched.hasClass("status").should.equal("Watched" === scenario.expectedStatus);
						recorded.hasClass("status").should.equal("Recorded" === scenario.expectedStatus);
						expected.hasClass("status").should.equal("Expected" === scenario.expectedStatus);
						missed.hasClass("status").should.equal("Missed" === scenario.expectedStatus);
					});

					it("should toggle the unverified row", (): Chai.Assertion => ("none" === unverifiedRow.css("display")).should.equal(scenario.unverifiedRowHidden));
					it("should toggle the status date row", (): Chai.Assertion => episodeController["toggleStatusDateRow"].should.have.been.called);
					it("should clear the semaphore", (): Chai.Assertion => episodeController["settingStatus"].should.be.false);
				});
			});

			afterEach((): void => {
				watched.remove();
				recorded.remove();
				expected.remove();
				missed.remove();
				unverifiedRow.remove();
			});
		});
	});

	describe("getStatusDate", (): void => {
		interface Scenario {
			description: string;
			statusDate: string;
			expectedDay: number;
			expectedMonth: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "without date",
				statusDate: "",
				expectedDay: 1,
				expectedMonth: "Jan"
			},
			{
				description: "with date",
				statusDate: "02-Feb",
				expectedDay: 2,
				expectedMonth: "Feb"
			}
		];

		let swWrapper: JQuery,
				clock: SinonFakeTimers;

		beforeEach((): void => {
			sinon.stub(episodeController, "setStatusDate" as keyof EpisodeController);
			clock = sinon.useFakeTimers();
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
					episodeController["listItem"].episode.statusDate = scenario.statusDate;
					episodeController["getStatusDate"]();
				});

				it("should initialise the SpinningWheel", (): void => {
					SpinningWheelMock.addSlot.should.have.been.calledWith(sinon.match.object, "right", scenario.expectedDay);
					SpinningWheelMock.addSlot.should.have.been.calledWith(sinon.match.object, null, scenario.expectedMonth);
				});

				it("should attach a done callback to the SpinningWheel", (): void => {
					SpinningWheelMock.setDoneAction.should.have.been.called;
					episodeController["setStatusDate"].should.have.been.called;
				});

				it("should open the SpinningWheel", (): Chai.Assertion => SpinningWheelMock.open.should.have.been.called);
				it("should wrap the SpinningWheel in a touch event proxy", (): Chai.Assertion => (episodeController.swtoucheventproxy as TouchEventProxy)["element"].should.deep.equal(swWrapper.get(0)));
			});
		});

		afterEach((): void => {
			swWrapper.remove();
			clock.restore();
		});
	});

	describe("setStatusDate", (): void => {
		let statusDate: JQuery;

		beforeEach((): void => {
			(SpinningWheelMock.getSelectedValues as SinonStub).reset();
			(SpinningWheelMock.getSelectedValues as SinonStub).returns({
				keys: [2, "Feb"],
				values: ["02", "Feb"]
			});

			episodeController.swtoucheventproxy = {} as TouchEventProxy;

			statusDate = $("<input>")
				.attr("id", "statusDate")
				.appendTo(document.body);

			listItem.episode.statusDate = "02-Feb";
			episodeController["setStatusDate"]();
		});

		it("should get the selected value from the SpinningWheel", (): Chai.Assertion => listItem.episode.setStatusDate.should.have.been.calledWith(listItem.episode.statusDate));
		it("should update the view", (): Chai.Assertion => String(statusDate.val()).should.equal(listItem.episode.statusDate));
		it("should remove the touch event proxy", (): Chai.Assertion => (null === episodeController.swtoucheventproxy).should.be.true);

		afterEach((): JQuery => statusDate.remove());
	});

	describe("toggleStatusDateRow", (): void => {
		interface Scenario {
			description: string;
			isHidden: boolean;
			isUnscheduled: boolean;
			status: EpisodeStatus;
			noDate: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "hidden",
				isHidden: true,
				isUnscheduled: false,
				status: "",
				noDate: false
			},
			{
				description: "unscheduled",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: false
			},
			{
				description: "recorded",
				isHidden: false,
				isUnscheduled: false,
				status: "Recorded",
				noDate: false
			},
			{
				description: "expected",
				isHidden: false,
				isUnscheduled: false,
				status: "Expected",
				noDate: false
			},
			{
				description: "missed",
				isHidden: false,
				isUnscheduled: false,
				status: "Missed",
				noDate: false
			},
			{
				description: "no date specified",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: true
			}
		];

		let statusDateRow: JQuery,
				unscheduled: JQuery;

		beforeEach((): void => {
			sinon.stub(episodeController, "getStatusDate" as keyof EpisodeController);
			statusDateRow = $("<div>")
				.attr("id", "statusDateRow")
				.appendTo(document.body);

			unscheduled = $("<input type='checkbox'>")
				.attr("id", "unscheduled")
				.appendTo(document.body);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					unscheduled.prop("checked", scenario.isUnscheduled);
					listItem.episode.status = scenario.status;
					listItem.episode.statusDate = scenario.noDate ? "" : listItem.episode.statusDate;
					episodeController["toggleStatusDateRow"]();
				});

				it(`should ${scenario.isHidden ? "hide" : "show"} the status date`, (): Chai.Assertion => ("none" === statusDateRow.css("display")).should.equal(Boolean(scenario.isHidden)));

				if (scenario.noDate) {
					it("should prompt for a date", (): Chai.Assertion => episodeController["getStatusDate"].should.have.been.called);
				}
			});
		});

		afterEach((): void => {
			statusDateRow.remove();
			unscheduled.remove();
		});
	});
});