import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import EpisodeController from "controllers/episode-controller";
import EpisodeView from "views/episode-view.html";
import SpinningWheel from "framework/sw/spinningwheel";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("EpisodeController", () => {
	let listItem,
			episodeController;

	beforeEach(() => {
		listItem = {
			listIndex: 0,
			episode: {
				episodeName: "test-episode",
				status: "Watched",
				statusDate: "01-Jan",
				unverified: false,
				unscheduled: false,
				save: sinon.stub().yields(),
				setStatus: sinon.stub(),
				setStatusDate: sinon.stub(),
				setUnverified: sinon.stub()
			}
		};

		episodeController = new EpisodeController(listItem);
	});

	describe("object constructor", () => {
		describe("update", () => {
			it("should return a EpisodeController instance", () => episodeController.should.be.an.instanceOf(EpisodeController));
			it("should set the list item", () => episodeController.listItem.should.deep.equal(listItem));
			it("should save the original status", () => episodeController.originalStatus.should.equal(listItem.episode.status));
			it("should save the original status date", () => episodeController.originalStatusDate.should.equal(listItem.episode.statusDate));
		});

		describe("add", () => {
			beforeEach(() => {
				listItem = {
					sequence: 1,
					series: {id: 1}
				};
				episodeController = new EpisodeController(listItem);
			});

			it("should return a EpisodeController instance", () => episodeController.should.be.an.instanceOf(EpisodeController));

			it("should create a list item", () => {
				episodeController.listItem.episode.sequence.should.equal(listItem.sequence);
				episodeController.listItem.episode.seriesId.should.equal(listItem.series.id);
			});
		});
	});

	describe("view", () => {
		it("should return the episode view", () => episodeController.view.should.equal(EpisodeView));
	});

	describe("setup", () => {
		let episodeName,
				unverified,
				unscheduled,
				watched,
				recorded,
				expected,
				missed,
				statusDate;

		beforeEach(() => {
			sinon.stub(episodeController, "cancel");
			sinon.stub(episodeController, "save");
			sinon.stub(episodeController, "setStatus");
			sinon.stub(episodeController, "getStatusDate");
			sinon.stub(episodeController, "toggleStatusDateRow");

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

			episodeController.setup();
		});

		it("should set the header label", () => episodeController.header.label.should.equal("Add/Edit Episode"));

		it("should attach a header left button event handler", () => {
			episodeController.header.leftButton.eventHandler();
			episodeController.cancel.should.have.been.called;
		});

		it("should set the header left button label", () => episodeController.header.leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", () => {
			episodeController.header.rightButton.eventHandler();
			episodeController.save.should.have.been.called;
		});

		it("should set the header right button style", () => episodeController.header.rightButton.style.should.equal("confirmButton"));
		it("should set the header right button label", () => episodeController.header.rightButton.label.should.equal("Save"));
		it("should set the episode name", () => episodeName.val().should.equal(listItem.episode.episodeName));
		it("should set the unverified toggle", () => unverified.prop("checked").should.equal(listItem.episode.unverified));
		it("should set the unscheduled toggle", () => unscheduled.prop("checked").should.equal(listItem.episode.unscheduled));

		it("should attach a watched click event handler", () => {
			watched.trigger("click");
			episodeController.setStatus.should.have.been.calledWith("Watched");
		});

		it("should attach a recorded click event handler", () => {
			recorded.trigger("click");
			episodeController.setStatus.should.have.been.calledWith("Recorded");
		});

		it("should attach an expected click event handler", () => {
			expected.trigger("click");
			episodeController.setStatus.should.have.been.calledWith("Expected");
		});

		it("should attach a missed click event handler", () => {
			missed.trigger("click");
			episodeController.setStatus.should.have.been.calledWith("Missed");
		});

		it("should attach a status date click event handler", () => {
			statusDate.trigger("click");
			episodeController.getStatusDate.should.have.been.called;
		});

		it("should attach an unscheduled click event handler", () => {
			unscheduled.trigger("click");
			episodeController.toggleStatusDateRow.should.have.been.called;
		});

		it("should toggle the current status", () => {
			listItem.episode.setStatus.should.have.been.calledWith("");
			episodeController.setStatus.should.have.been.calledWith(listItem.episode.status);
		});

		it("should set the status date", () => statusDate.val().should.equal(listItem.episode.statusDate));

		afterEach(() => {
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

	describe("save", () => {
		const testParams = [
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

		let episodeName,
				episodeNameInput,
				unverified,
				unscheduled;

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
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
						{scrollPos: 0},
						{scrollPos: 0}
					];
					episodeController.listItem.listIndex = params.listIndex;
					episodeController.save();
				});

				it("should get the episode name", () => episodeController.listItem.episode.episodeName.should.equal(episodeName));
				it("should get the unverified toggle", () => episodeController.listItem.episode.setUnverified.should.have.been.calledWith(true));
				it("should get the unscheduled toggle", () => episodeController.listItem.episode.unscheduled.should.be.true);
				it("should save the episode", () => listItem.episode.save.should.have.been.called);
				it("should set the series list view scroll position", () => appController.viewStack[0].scrollPos.should.equal(params.scrollPos));
				it("should pop the view", () => appController.popView.should.have.been.called);

				afterEach(() => {
					episodeNameInput.remove();
					unverified.remove();
					unscheduled.remove();
				});
			});
		});
	});

	describe("cancel", () => {
		beforeEach(() => {
			episodeController.listItem.episode.status = "Recorded";
			episodeController.listItem.episode.statusDate = "02-Jan";
			episodeController.cancel();
		});

		it("should revert any changes", () => {
			episodeController.listItem.episode.status.should.equal("Watched");
			episodeController.listItem.episode.statusDate.should.equal("01-Jan");
		});

		it("should pop the view", () => appController.popView.should.have.been.called);
	});

	describe("setStatus", () => {
		beforeEach(() => sinon.stub(episodeController, "toggleStatusDateRow"));

		describe("in progress", () => {
			it("should do nothing", () => {
				episodeController.settingStatus = true;
				episodeController.setStatus();
				episodeController.toggleStatusDateRow.should.not.have.been.called;
				episodeController.settingStatus.should.be.true;
			});
		});

		describe("not in progress", () => {
			const testParams = [
				{
					description: "no change",
					previousStatus: "Watched",
					newStatus: "Watched",
					expected: "",
					highlight: "watched",
					unverifiedRowHidden: true
				},
				{
					description: "watched",
					previousStatus: "",
					newStatus: "Watched",
					expected: "Watched",
					highlight: "watched",
					unverifiedRowHidden: true
				},
				{
					description: "recorded",
					previousStatus: "Watched",
					newStatus: "Recorded",
					expected: "Recorded",
					highlight: "recorded",
					unverifiedRowHidden: false
				},
				{
					description: "expected",
					previousStatus: "Watched",
					newStatus: "Expected",
					expected: "Expected",
					highlight: "expected",
					unverifiedRowHidden: false
				},
				{
					description: "missed",
					previousStatus: "Watched",
					newStatus: "Missed",
					expected: "Missed",
					highlight: "missed",
					unverifiedRowHidden: false
				}
			];

			let watched,
					recorded,
					expected,
					missed,
					unverifiedRow;

			beforeEach(() => {
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

			testParams.forEach(params => {
				describe(params.description, () => {
					beforeEach(() => {
						listItem.episode.status = params.previousStatus;
						episodeController.setStatus(params.newStatus);
					});

					it("should set the episode status", () => listItem.episode.setStatus.should.have.been.calledWith(params.expected));

					it("should toggle the status", () => {
						watched.hasClass("status").should.equal("Watched" === params.expected);
						recorded.hasClass("status").should.equal("Recorded" === params.expected);
						expected.hasClass("status").should.equal("Expected" === params.expected);
						missed.hasClass("status").should.equal("Missed" === params.expected);
					});

					it("should toggle the unverified row", () => ("none" === unverifiedRow.css("display")).should.equal(params.unverifiedRowHidden));
					it("should toggle the status date row", () => episodeController.toggleStatusDateRow.should.have.been.called);
					it("should clear the semaphore", () => episodeController.settingStatus.should.be.false);
				});
			});

			afterEach(() => {
				watched.remove();
				recorded.remove();
				expected.remove();
				missed.remove();
				unverifiedRow.remove();
			});
		});
	});

	describe("getStatusDate", () => {
		const testParams = [
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

		let swWrapper,
				clock;

		beforeEach(() => {
			sinon.stub(episodeController, "setStatusDate");
			clock = sinon.useFakeTimers();
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
					episodeController.listItem.episode.statusDate = params.statusDate;
					episodeController.getStatusDate();
				});

				it("should initialise the SpinningWheel", () => {
					SpinningWheel.addSlot.should.have.been.calledWith(sinon.match.object, "right", params.expectedDay);
					SpinningWheel.addSlot.should.have.been.calledWith(sinon.match.object, null, params.expectedMonth);
				});

				it("should attach a done callback to the SpinningWheel", () => {
					SpinningWheel.setDoneAction.should.have.been.called;
					episodeController.setStatusDate.should.have.been.called;
				});

				it("should open the SpinningWheel", () => SpinningWheel.open.should.have.been.called);
				it("should wrap the SpinningWheel in a touch event proxy", () => episodeController.swtoucheventproxy.element.should.deep.equal(swWrapper.get(0)));
			});
		});

		afterEach(() => {
			swWrapper.remove();
			clock.restore();
		});
	});

	describe("setStatusDate", () => {
		let statusDate;

		beforeEach(() => {
			SpinningWheel.getSelectedValues.reset();
			SpinningWheel.getSelectedValues.returns({
				keys: [2, "Feb"],
				values: ["02", "Feb"]
			});

			episodeController.swtoucheventproxy = {};

			statusDate = $("<input>")
				.attr("id", "statusDate")
				.appendTo(document.body);

			listItem.episode.statusDate = "02-Feb";
			episodeController.setStatusDate();
		});

		it("should get the selected value from the SpinningWheel", () => listItem.episode.setStatusDate.should.have.been.calledWith(listItem.episode.statusDate));
		it("should update the view", () => statusDate.val().should.equal(listItem.episode.statusDate));
		it("should remove the touch event proxy", () => (null === episodeController.swtoucheventproxy).should.be.true);

		afterEach(() => statusDate.remove());
	});

	describe("toggleStatusDateRow", () => {
		const testParams = [
			{
				description: "hidden",
				hidden: true
			},
			{
				description: "unscheduled",
				unscheduled: true
			},
			{
				description: "recorded",
				status: "Recorded"
			},
			{
				description: "expected",
				status: "Expected"
			},
			{
				description: "missed",
				status: "Missed"
			},
			{
				description: "no date specified",
				unscheduled: true,
				noDate: true
			}
		];

		let statusDateRow,
				unscheduled;

		beforeEach(() => {
			sinon.stub(episodeController, "getStatusDate");
			statusDateRow = $("<div>")
				.attr("id", "statusDateRow")
				.appendTo(document.body);

			unscheduled = $("<input type='checkbox'>")
				.attr("id", "unscheduled")
				.appendTo(document.body);
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					unscheduled.prop("checked", params.unscheduled);
					listItem.episode.status = params.status;
					listItem.episode.statusDate = params.noDate ? "" : listItem.episode.statusDate;
					episodeController.toggleStatusDateRow();
				});

				it(`should ${params.hidden ? "hide" : "show"} the status date`, () => ("none" === statusDateRow.css("display")).should.equal(Boolean(params.hidden)));

				if (params.noDate) {
					it("should prompt for a date", () => episodeController.getStatusDate.should.have.been.called);
				}
			});
		});

		afterEach(() => {
			statusDateRow.remove();
			unscheduled.remove();
		});
	});
});