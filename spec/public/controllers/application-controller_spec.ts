import {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	Notice,
	View,
	ViewControllerArgs
} from "controllers";
import sinon, {
	SinonFakeTimers,
	SinonSpy,
	SinonStub
} from "sinon";
import $ from "jquery";
import ApplicationController from "../../../src/controllers/application-controller";
import SettingMock from "mocks/setting-model-mock";
import SpinningWheelMock from "mocks/spinningwheel-mock";
import TestController from "mocks/test-controller";
import WindowMock from "mocks/window-mock";

describe("ApplicationController", (): void => {
	let contentWrapper: JQuery,
			content: JQuery,
			abc: JQuery,
			applicationController: ApplicationController;

	beforeEach((): void => {
		contentWrapper = $("<div>")
			.attr("id", "contentWrapper")
			.appendTo(document.body);

		content = $("<div>")
			.attr("id", "content")
			.appendTo(contentWrapper);

		abc = $("<ul>")
			.attr("id", "abc")
			.hide()
			.appendTo(document.body);

		sinon.spy(ApplicationController.prototype, "contentShown" as keyof ApplicationController);
		ApplicationController["singletonInstance"] = undefined;
		applicationController = new ApplicationController();
	});

	describe("object constructor", (): void => {
		it("should return an ApplicationController instance", (): Chai.Assertion => applicationController.should.be.an.instanceOf(ApplicationController));
		it("should make the instance a singleton", (): Chai.Assertion => applicationController.should.equal(ApplicationController["singletonInstance"]));
		it("should initialise the view stack", (): Chai.Assertion => applicationController.viewStack.should.deep.equal([]));
		it("should initialise the notice stack", (): Chai.Assertion => applicationController["noticeStack"].should.deep.equal({ height: 0, notice: [] }));
		it("should set the max data age days", (): Chai.Assertion => applicationController["maxDataAgeDays"].should.equal(7));

		it("should attach a transition end event handler", (): void => {
			contentWrapper.trigger("transitionend");
			applicationController["contentShown"].should.have.been.called;
		});

		it("should set the SpinningWheel cell height", (): Chai.Assertion => SpinningWheelMock.cellHeight.should.equal(45));
		it("should create a scroll helper", (): Chai.Assertion => applicationController.abc["element"].should.deep.equal(abc.get(0)));
		it("should associate the scroll helper with the content", (): Chai.Assertion => applicationController.abc["scrollElement"].should.deep.equal($("#content")));
		it("should wrap the scroll helper in a touch event proxy", (): Chai.Assertion => applicationController.abctoucheventproxy["element"].should.deep.equal(abc.get(0)));

		describe("instance already exists", (): void => {
			let anotherApplicationController: ApplicationController;

			beforeEach((): ApplicationController => (anotherApplicationController = new ApplicationController()));

			it("should return an ApplicationController instance", (): Chai.Assertion => anotherApplicationController.should.be.an.instanceOf(ApplicationController));
			it("should be the same instance", (): Chai.Assertion => anotherApplicationController.should.equal(applicationController));
		});
	});

	describe("start", (): void => {
		const lastSyncTime: SettingMock = new SettingMock("LastSyncTime", "1 Jan 2010");

		beforeEach(async (): Promise<void> => {
			sinon.stub(applicationController, "pushView");
			sinon.stub(applicationController, "gotLastSyncTime" as keyof ApplicationController);
			SettingMock.get.reset();
			SettingMock.get.withArgs("LastSyncTime").returns(lastSyncTime);
			await applicationController.start();
		});

		it("should load all view controllers", (): Chai.Assertion => Object.keys(applicationController["viewControllers"]).length.should.equal(13));
		it("should display the schedule view", (): Chai.Assertion => applicationController.pushView.should.have.been.calledWith("schedule"));
		it("should get the last sync time", (): Chai.Assertion => applicationController["gotLastSyncTime"].should.have.been.calledWith(lastSyncTime));
	});

	describe("popView", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(applicationController, "clearHeader" as keyof ApplicationController);
			sinon.stub(applicationController, "viewPopped" as keyof ApplicationController);
			sinon.stub(applicationController, "show" as keyof ApplicationController).yields({});
			applicationController["viewStack"] = [{ controller: new TestController(), scrollPos: 0 }];
			await applicationController.popView({} as ViewControllerArgs);
		});

		it("should clear the footer", (): Chai.Assertion => applicationController.clearFooter.should.have.been.called);
		it("should clear the header", (): Chai.Assertion => applicationController["clearHeader"].should.have.been.called);
		it("should pop the view off the view stack", (): Chai.Assertion => applicationController.viewStack.should.be.empty);
		it("should display the previous view", (): void => {
			applicationController["show"].should.have.been.calledWith(sinon.match.func, {});
			applicationController["viewPopped"].should.have.been.calledWith({});
		});
	});

	describe("getScrollPosition", (): void => {
		it("should save the current scroll position of the active view", (): void => {
			$("<div>")
				.height(50)
				.css("overflow-y", "scroll")
				.append($("<div>").height(100))
				.appendTo(content)
				.scrollTop(10);

			applicationController.viewStack.push({ controller: new TestController(), scrollPos: 0 });
			applicationController.getScrollPosition();
			(applicationController.viewStack.pop() as View).scrollPos.should.equal(10);
		});
	});

	describe("setScrollPosition", (): void => {
		let scrollingElement: JQuery;

		beforeEach((): void => {
			scrollingElement = $("<div>")
				.height(50)
				.css("overflow-y", "scroll")
				.append($("<div>").height(100))
				.append($("<div>").height(100))
				.appendTo(content);
		});

		describe("scroll position is -1", (): void => {
			it("should scroll to the bottom", (): void => {
				applicationController.viewStack.push({ controller: new TestController(), scrollPos: -1 });
				applicationController.setScrollPosition();
				Number(scrollingElement.scrollTop()).should.equal(100 + scrollingElement.position().top);
			});
		});

		describe("scoll position is not -1", (): void => {
			it("should restore the saved scroll position of the active view", (): void => {
				applicationController.viewStack.push({ controller: new TestController(), scrollPos: 20 });
				applicationController.setScrollPosition();
				Number(scrollingElement.scrollTop()).should.equal(20);
			});
		});
	});

	describe("setFooter", (): void => {
		let controller: TestController,
				leftButton: JQuery,
				rightButton: JQuery,
				label: JQuery;

		beforeEach((): void => {
			controller = new TestController();

			leftButton = $("<a>")
				.attr("id", "footerLeftButton")
				.hide()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "footerRightButton")
				.hide()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "footerLabel")
				.hide()
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.setFooter();
			});

			it("should not show the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should not update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.not.have.been.called);
		});

		describe("with footer", (): void => {
			let footer: HeaderFooter,
					leftButtonEventHandler: NavButtonEventHandler,
					rightButtonEventHandler: NavButtonEventHandler;

			beforeEach((): void => {
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				footer = controller.footer as HeaderFooter;
				leftButtonEventHandler = (footer.leftButton as NavButton).eventHandler as NavButtonEventHandler;
				rightButtonEventHandler = (footer.rightButton as NavButton).eventHandler as NavButtonEventHandler;
			});

			describe("with left button", (): void => {
				describe("with event handler", (): void => {
					beforeEach((): void => applicationController.setFooter());

					it("should attach a click event handler", (): void => {
						leftButton.trigger("click");
						leftButtonEventHandler.should.have.been.called;
					});

					it("should style the button", (): void => {
						leftButton.hasClass("button").should.be.true;
						leftButton.hasClass("footer").should.be.true;
						leftButton.hasClass("left").should.be.true;
						leftButton.hasClass("backButton").should.be.true;
					});

					it("should set the button label", (): Chai.Assertion => leftButton.text().should.equal("left-button"));
					it("should show the button", (): Chai.Assertion => leftButton.css("display").should.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
					it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
				});

				describe("without event handler", (): void => {
					beforeEach((): void => {
						(footer.leftButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
					});

					it("should not attach a click event handler", (): void => {
						leftButton.trigger("click");
						leftButtonEventHandler.should.not.have.been.called;
					});
				});
			});

			describe("without left button", (): void => {
				beforeEach((): void => {
					footer.leftButton = undefined;
					applicationController.setFooter();
				});

				it("should not attach a click event handler", (): void => {
					leftButton.trigger("click");
					leftButtonEventHandler.should.not.have.been.called;
				});

				it("should not style the button", (): void => {
					leftButton.hasClass("button").should.be.false;
					leftButton.hasClass("footer").should.be.false;
					leftButton.hasClass("left").should.be.false;
					leftButton.hasClass("backButton").should.be.false;
				});

				it("should not set the button label", (): Chai.Assertion => leftButton.text().should.equal(""));
				it("should not show the button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
				it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with footer label", (): void => {
				beforeEach((): void => applicationController.setFooter());

				it("should set the footer label", (): Chai.Assertion => label.text().should.equal("test-footer"));
				it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without footer label", (): void => {
				beforeEach((): void => {
					footer.label = undefined;
					applicationController.setFooter();
				});

				it("should not set the footer label", (): Chai.Assertion => label.text().should.equal(""));
				it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with right button", (): void => {
				describe("with event handler", (): void => {
					beforeEach((): void => applicationController.setFooter());

					it("should attach a click event handler", (): void => {
						rightButton.trigger("click");
						rightButtonEventHandler.should.have.been.called;
					});

					it("should style the button", (): void => {
						rightButton.hasClass("button").should.be.true;
						rightButton.hasClass("footer").should.be.true;
						rightButton.hasClass("right").should.be.true;
						rightButton.hasClass("confirmButton").should.be.true;
					});

					it("should set the button label", (): Chai.Assertion => rightButton.text().should.equal("right-button"));
					it("should show the button", (): Chai.Assertion => rightButton.css("display").should.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
					it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
				});

				describe("without event handler", (): void => {
					beforeEach((): void => {
						(footer.rightButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
					});

					it("should not attach a click event handler", (): void => {
						rightButton.trigger("click");
						rightButtonEventHandler.should.not.have.been.called;
					});
				});
			});

			describe("without right button", (): void => {
				beforeEach((): void => {
					footer.rightButton = undefined;
					applicationController.setFooter();
				});

				it("should not attach a click event handler", (): void => {
					rightButton.trigger("click");
					rightButtonEventHandler.should.not.have.been.called;
				});

				it("should not style the button", (): void => {
					rightButton.hasClass("button").should.be.false;
					rightButton.hasClass("footer").should.be.false;
					rightButton.hasClass("right").should.be.false;
					rightButton.hasClass("confirmButton").should.be.false;
				});

				it("should not set the button label", (): Chai.Assertion => rightButton.text().should.equal(""));
				it("should not show the button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
				it("should show the footer label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("showScrollHelper", (): void => {
		it("should show the scroll helper", (): void => {
			applicationController.showScrollHelper();
			abc.css("display").should.not.equal("none");
		});
	});

	describe("hideScrollHelper", (): void => {
		it("should hide the scroll helper", (): void => {
			abc.css("display", "block");
			applicationController.hideScrollHelper();
			abc.css("display").should.equal("none");
		});
	});

	describe("pushView", (): void => {
		interface Scenario {
			description: string;
			viewStack: View[];
		}

		const scenarios: Scenario[] = [
			{
				description: "initial view",
				viewStack: []
			},
			{
				description: "subsequent view",
				viewStack: [{ controller: new TestController(), scrollPos: 0 }]
			}
		];

		beforeEach((): void => {
			sinon.stub(applicationController, "getScrollPosition");
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(applicationController, "clearHeader" as keyof ApplicationController);
			sinon.stub(applicationController, "viewPushed" as keyof ApplicationController);
			sinon.stub(applicationController, "show" as keyof ApplicationController).yields();
			applicationController["viewControllers"] = { test: TestController };
		});

		let view: View;

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					applicationController.viewStack = scenario.viewStack;
					await applicationController.pushView("test", {} as ViewControllerArgs);
					view = applicationController.viewStack.pop() as View;
				});

				if (scenario.viewStack.length > 0) {
					it("should get the scroll position", (): Chai.Assertion => applicationController.getScrollPosition.should.have.been.called);
					it("should clear the footer", (): Chai.Assertion => applicationController.clearFooter.should.have.been.called);
					it("should clear the header", (): Chai.Assertion => applicationController["clearHeader"].should.have.been.called);
				} else {
					it("should not get the scroll position", (): Chai.Assertion => applicationController.getScrollPosition.should.not.have.been.called);
					it("should not clear the footer", (): Chai.Assertion => applicationController.clearFooter.should.not.have.been.called);
					it("should not clear the header", (): Chai.Assertion => applicationController["clearHeader"].should.not.have.been.called);
				}

				it("should push the view onto the view stack", (): void => {
					view.controller.should.be.an.instanceOf(TestController);
					view.scrollPos.should.equal(0);
				});

				it("should instantiate the view controller", (): Chai.Assertion => ((view.controller as TestController).args as ViewControllerArgs).should.deep.equal({}));

				it("should display the view", (): void => {
					applicationController["show"].should.have.been.called;
					applicationController["viewPushed"].should.have.been.called;
				});
			});
		});
	});

	describe("showNotice", (): void => {
		let notices: JQuery,
				notice: Notice,
				buttonConfig: NavButton,
				eventHandler: SinonStub,
				noticeContainer: JQuery,
				button: JQuery;

		beforeEach((): void => {
			notices = $("<div>")
				.attr("id", "notices")
				.css("position", "absolute")
				.css("visibility", "hidden")
				.css("top", "0px")
				.appendTo(document.body);

			buttonConfig = {
				style: "confirmButton",
				label: "Test button"
			};

			sinon.stub(applicationController, "noticesMoved" as keyof ApplicationController);
			sinon.stub(applicationController, "hideNotice" as keyof ApplicationController);
			notice = { label: "<b>test-notice</b>" };
			eventHandler = sinon.stub();
			applicationController["noticeStack"].height = 0;
			applicationController["noticeStack"].notice = [];
			WindowMock.innerHeight = 1;
			$.fx.off = true;
		});

		it("should create a new notice", (): void => {
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");

			noticeContainer.length.should.equal(1);
			noticeContainer.html().should.equal("<a></a><p><b>test-notice</b></p><a></a>");
		});

		describe("with left button", (): void => {
			beforeEach((): NavButton => (notice.leftButton = buttonConfig));

			describe("with custom event handler", (): void => {
				beforeEach((): void => {
					buttonConfig.eventHandler = eventHandler;
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:first");
					button.trigger("click");
				});

				it("should attach a custom click event handler", (): Chai.Assertion => eventHandler.should.have.been.called);
				it("should attach a hide click event handler", (): Chai.Assertion => applicationController["hideNotice"].should.have.been.calledWith(sinon.match((element: JQuery): boolean => element[0] === noticeContainer[0])));

				it("should style the button", (): void => {
					button.hasClass("button").should.be.true;
					button.hasClass("left").should.be.true;
					button.hasClass("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => button.text().should.equal("Test button"));
			});

			describe("without custom event handler", (): void => {
				beforeEach((): void => {
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:first");
					button.trigger("click");
				});

				it("should not attach a custom click event handler", (): Chai.Assertion => eventHandler.should.not.have.been.called);
				it("should attach a hide click event handler", (): Chai.Assertion => applicationController["hideNotice"].should.have.been.calledWith(sinon.match((element: JQuery): boolean => element[0] === noticeContainer[0])));

				it("should style the button", (): void => {
					button.hasClass("button").should.be.true;
					button.hasClass("left").should.be.true;
					button.hasClass("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => button.text().should.equal("Test button"));
			});
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				applicationController.showNotice(notice);
				noticeContainer = notices.children("div");
				button = noticeContainer.children("a:first");
				button.trigger("click");
			});

			it("should not attach a hide click event handler", (): Chai.Assertion => applicationController["hideNotice"].should.not.have.been.called);

			it("should not style the button", (): void => {
				button.hasClass("button").should.be.false;
				button.hasClass("left").should.be.false;
				button.hasClass("confirmButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => button.text().should.equal(""));
		});

		describe("with notice id", (): void => {
			it("should set the notice id", (): void => {
				notice.id = "test-notice";
				applicationController.showNotice(notice);
				notices.find("div p#test-notice").length.should.equal(1);
			});
		});

		describe("without notice id", (): void => {
			it("should not set the notice id", (): void => {
				applicationController.showNotice(notice);
				notices.find("div p#test-notice").length.should.equal(0);
			});
		});

		describe("with right button", (): void => {
			beforeEach((): NavButton => (notice.rightButton = buttonConfig));

			describe("with custom event handler", (): void => {
				beforeEach((): void => {
					buttonConfig.eventHandler = eventHandler;
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:last");
					button.trigger("click");
				});

				it("should attach a custom click event handler", (): Chai.Assertion => eventHandler.should.have.been.called);

				it("should style the button", (): void => {
					button.hasClass("button").should.be.true;
					button.hasClass("right").should.be.true;
					button.hasClass("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => button.text().should.equal("Test button"));
			});

			describe("without custom event handler", (): void => {
				beforeEach((): void => {
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:last");
					button.trigger("click");
				});

				it("should not attach a custom click event handler", (): Chai.Assertion => eventHandler.should.not.have.been.called);

				it("should style the button", (): void => {
					button.hasClass("button").should.be.true;
					button.hasClass("right").should.be.true;
					button.hasClass("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => button.text().should.equal("Test button"));
			});
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				applicationController.showNotice(notice);
				noticeContainer = notices.children("div");
				button = noticeContainer.children("a:last");
				button.trigger("click");
			});

			it("should not style the button", (): void => {
				button.hasClass("button").should.be.false;
				button.hasClass("right").should.be.false;
				button.hasClass("confirmButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => button.text().should.equal(""));
		});

		describe("initial notice", (): void => {
			beforeEach((): void => {
				sinon.stub($.fn, "animate");
				applicationController.showNotice(notice);
			});

			it("should position the notice stack off screen", (): Chai.Assertion => notices.css("top").should.equal("1px"));
			it("should make the notice stack visible", (): Chai.Assertion => notices.css("visibility").should.equal("visible"));

			afterEach((): void => ($.fn.animate as SinonStub).restore());
		});

		describe("subsequent notice", (): void => {
			beforeEach((): void => {
				sinon.stub($.fn, "animate");
				applicationController["noticeStack"].notice.push($("<div>"));
				applicationController.showNotice(notice);
			});

			it("should not position the notice stack off screen", (): Chai.Assertion => notices.css("top").should.equal("0px"));
			it("should make the notice stack visible", (): Chai.Assertion => notices.css("visibility").should.equal("hidden"));

			afterEach((): void => ($.fn.animate as SinonStub).restore());
		});

		it("should update the height of the notice stack to accomodate the new notice", (): void => {
			applicationController["noticeStack"].height = 0;
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");
			applicationController["noticeStack"].height.should.equal(-Number(noticeContainer.height()));
		});

		it("should push the notice onto the stack", (): void => {
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");
			(applicationController["noticeStack"].notice.pop() as JQuery)[0].should.equal(noticeContainer[0]);
		});

		describe("animation", (): void => {
			let windowHeight: number;

			beforeEach((done: Mocha.Done): void => {
				(applicationController["noticesMoved"] as SinonStub).callsFake((): void => done());
				sinon.spy($.fn, "animate");
				applicationController["noticeStack"].height = 0;
				windowHeight = Number($(window).height());
				applicationController.showNotice(notice);
			});

			it("should slide up the notices container to reveal the notice", (): void => {
				noticeContainer = notices.children("div");
				$.fn.animate.should.have.been.calledWith({ top: windowHeight - Number(noticeContainer.height()) });
			});

			it("should invoke the completed callback", (): Chai.Assertion => applicationController["noticesMoved"].should.have.been.called);

			afterEach((): void => ($.fn.animate as SinonSpy).restore());
		});

		afterEach((): void => {
			notices.remove();
			$.fx.off = false;
		});
	});

	describe("clearFooter", (): void => {
		let controller: TestController,
				footer: HeaderFooter,
				leftButtonEventHandler: (event: JQueryEventObject) => void,
				rightButtonEventHandler: (event: JQueryEventObject) => void,
				leftButton: JQuery,
				rightButton: JQuery,
				label: JQuery;

		beforeEach((): void => {
			controller = new TestController();
			footer = controller.footer as HeaderFooter;
			leftButtonEventHandler = (footer.leftButton as NavButton).eventHandler as (event: JQueryEventObject) => void;
			rightButtonEventHandler = (footer.rightButton as NavButton).eventHandler as (event: JQueryEventObject) => void;

			leftButton = $("<a>")
				.attr("id", "footerLeftButton")
				.on("click", leftButtonEventHandler)
				.show()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "footerRightButton")
				.on("click", rightButtonEventHandler)
				.show()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "footerLabel")
				.show()
				.val("Test footer")
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.clearFooter();
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should clear the footer label", (): Chai.Assertion => String(label.val()).should.equal(""));
			it("should hide the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with footer", (): void => {
			beforeEach((): number => applicationController.viewStack.push({ controller, scrollPos: 0 }));

			describe("with left button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					leftButton.trigger("click");
					leftButtonEventHandler.should.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.val()).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without left button", (): void => {
				beforeEach((): void => {
					(applicationController["currentView"].controller.footer as HeaderFooter).leftButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					leftButton.trigger("click");
					leftButtonEventHandler.should.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.val()).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with right button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					rightButton.trigger("click");
					rightButtonEventHandler.should.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.val()).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without right button", (): void => {
				beforeEach((): void => {
					(applicationController["currentView"].controller.footer as HeaderFooter).rightButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					rightButton.trigger("click");
					rightButtonEventHandler.should.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.val()).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.css("display").should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("currentView", (): void => {
		it("should return the view on the top of the stack", (): void => {
			const view: View = { controller: new TestController(), scrollPos: 0 };

			applicationController["viewStack"] = [view];
			applicationController["currentView"].should.deep.equal(view);
		});
	});

	describe("viewPushed", (): void => {
		let controller: TestController;

		beforeEach(async (): Promise<void> => {
			controller = new TestController();
			applicationController.viewStack.push({ controller, scrollPos: 0 });
			await applicationController["viewPushed"]();
		});

		it("should setup the view controller", (): Chai.Assertion => controller.setup.should.have.been.called);
		it("should indicate that the view has loaded after 1s", (): Chai.Assertion => applicationController["contentShown"].should.have.been.called);
	});

	describe("viewPopped", (): void => {
		let controller: TestController,
				activate: SinonStub;

		beforeEach((): void => {
			controller = new TestController();
			activate = sinon.stub();
		});

		describe("without activate", (): void => {
			beforeEach(async (): Promise<void> => {
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				await applicationController["viewPopped"]({} as ViewControllerArgs);
			});

			it("should not activate the view controller", (): Chai.Assertion => activate.should.not.have.been.called);
			it("should indicate that the view has loaded after 1s", (): Chai.Assertion => applicationController["contentShown"].should.have.been.called);
		});

		describe("with activate", (): void => {
			beforeEach(async (): Promise<void> => {
				Object.defineProperty(controller, "activate", { value: activate });
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				await applicationController["viewPopped"]({} as ViewControllerArgs);
			});

			it("should activate the view controller", (): Chai.Assertion => activate.should.have.been.calledWith({}));
			it("should indicate that the view has loaded after 1s", (): Chai.Assertion => applicationController["contentShown"].should.have.been.called);
		});
	});

	describe("show", (): void => {
		let nowLoading: JQuery,
				callback: SinonSpy;

		beforeEach(async (): Promise<void> => {
			nowLoading = $("<div>")
				.attr("id", "nowLoading")
				.appendTo(document.body);

			sinon.stub(applicationController, "hideScrollHelper");
			sinon.stub(applicationController, "setHeader" as keyof ApplicationController);
			applicationController.viewStack.push({ controller: new TestController(), scrollPos: 0 });
			callback = sinon.spy();
			await applicationController["show"](callback, {} as ViewControllerArgs);
		});

		it("should hide the scroll helper", (): Chai.Assertion => applicationController.hideScrollHelper.should.have.been.called);
		it("should show the now loading indicator", (): Chai.Assertion => nowLoading.hasClass("loading").should.be.true);
		it("should load the view template", (): Chai.Assertion => content.html().should.equal("<div></div>"));
		it("should slide the new view in from the right", (): Chai.Assertion => contentWrapper.hasClass("loading").should.be.true);
		it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith({}));
		it("should set the header", (): Chai.Assertion => applicationController["setHeader"].should.have.been.called);

		afterEach((): JQuery => nowLoading.remove());
	});

	describe("contentShown", (): void => {
		let nowLoading: JQuery;

		beforeEach((): void => {
			nowLoading = $("<div>")
				.attr("id", "nowLoading")
				.addClass("loading")
				.appendTo(document.body);
		});

		describe("loading", (): void => {
			beforeEach((): void => {
				contentWrapper.addClass("loading");
				applicationController["contentShown"]();
			});

			it("should unmark the content wrapper as loading", (): Chai.Assertion => contentWrapper.hasClass("loading").should.be.false);
			it("should mark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.hasClass("loaded").should.be.true);
			it("should hide the now loading indicator", (): Chai.Assertion => nowLoading.hasClass("loading").should.be.false);
		});

		describe("loaded", (): void => {
			let controller: TestController,
					contentShown: SinonStub;

			beforeEach((): void => {
				controller = new TestController();
				contentShown = sinon.stub();
				contentWrapper.addClass("loaded");
			});

			describe("without content shown", (): void => {
				beforeEach((): void => {
					applicationController.viewStack.push({ controller, scrollPos: 0 });
					applicationController["contentShown"]();
				});

				it("should unmark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.hasClass("loaded").should.be.false);
				it("should not call contentShown on the view controller", (): Chai.Assertion => contentShown.should.not.have.been.called);
			});

			describe("with content shown", (): void => {
				beforeEach((): void => {
					Object.defineProperty(controller, "contentShown", { value: contentShown });
					applicationController.viewStack.push({ controller, scrollPos: 0 });
					applicationController["contentShown"]();
				});

				it("should unmark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.hasClass("loaded").should.be.false);
				it("should call contentShown on the view controller", (): Chai.Assertion => contentShown.should.have.been.called);
			});
		});

		describe("unknown state", (): void => {
			it("should do nothing", (): void => {
				applicationController["contentShown"]();
				contentWrapper.hasClass("loading").should.be.false;
				contentWrapper.hasClass("loaded").should.be.false;
				nowLoading.hasClass("loading").should.be.true;
			});
		});

		afterEach((): JQuery => nowLoading.remove());
	});

	describe("setHeader", (): void => {
		let controller: TestController,
				header: HeaderFooter,
				leftButtonEventHandler: NavButtonEventHandler,
				rightButtonEventHandler: NavButtonEventHandler,
				leftButton: JQuery,
				rightButton: JQuery,
				label: JQuery;

		beforeEach((): void => {
			controller = new TestController();
			({ header } = controller);
			leftButtonEventHandler = (header.leftButton as NavButton).eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (header.rightButton as NavButton).eventHandler as NavButtonEventHandler;

			leftButton = $("<a>")
				.attr("id", "headerLeftButton")
				.hide()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "headerRightButton")
				.hide()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "headerLabel")
				.hide()
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					leftButton.trigger("click");
					leftButtonEventHandler.should.have.been.called;
				});

				it("should style the button", (): void => {
					leftButton.hasClass("button").should.be.true;
					leftButton.hasClass("header").should.be.true;
					leftButton.hasClass("left").should.be.true;
					leftButton.hasClass("backButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => leftButton.text().should.equal("left-button"));
				it("should show the button", (): Chai.Assertion => leftButton.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.leftButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					leftButton.trigger("click");
					leftButtonEventHandler.should.not.have.been.called;
				});
			});
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				header.leftButton = undefined;
				applicationController["setHeader"]();
			});

			it("should not attach a click event handler", (): void => {
				leftButton.trigger("click");
				leftButtonEventHandler.should.not.have.been.called;
			});

			it("should not style the button", (): void => {
				leftButton.hasClass("button").should.be.false;
				leftButton.hasClass("header").should.be.false;
				leftButton.hasClass("left").should.be.false;
				leftButton.hasClass("backButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => leftButton.text().should.equal(""));
			it("should not show the button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with header label", (): void => {
			beforeEach((): void => applicationController["setHeader"]());

			it("should set the header label", (): Chai.Assertion => label.text().should.equal("test-header"));
			it("should show the header label", (): Chai.Assertion => label.css("display").should.not.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without header label", (): void => {
			beforeEach((): void => {
				header.label = undefined;
				applicationController["setHeader"]();
			});

			it("should not set the header label", (): Chai.Assertion => label.text().should.equal(""));
			it("should not show the header label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with right button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					rightButton.trigger("click");
					rightButtonEventHandler.should.have.been.called;
				});

				it("should style the button", (): void => {
					rightButton.hasClass("button").should.be.true;
					rightButton.hasClass("header").should.be.true;
					rightButton.hasClass("right").should.be.true;
					rightButton.hasClass("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => rightButton.text().should.equal("right-button"));
				it("should show the button", (): Chai.Assertion => rightButton.css("display").should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.rightButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					rightButton.trigger("click");
					rightButtonEventHandler.should.not.have.been.called;
				});
			});
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				header.rightButton = undefined;
				applicationController["setHeader"]();
			});

			it("should not attach a click event handler", (): void => {
				rightButton.trigger("click");
				rightButtonEventHandler.should.not.have.been.called;
			});

			it("should not style the button", (): void => {
				rightButton.hasClass("button").should.be.false;
				rightButton.hasClass("header").should.be.false;
				rightButton.hasClass("right").should.be.false;
				rightButton.hasClass("confirmButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => rightButton.text().should.equal(""));
			it("should not show the button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("clearHeader", (): void => {
		let controller: TestController,
				header: HeaderFooter,
				leftButtonEventHandler: (event: JQueryEventObject) => void,
				rightButtonEventHandler: (event: JQueryEventObject) => void,
				leftButton: JQuery,
				rightButton: JQuery,
				label: JQuery;

		beforeEach((): void => {
			controller = new TestController();
			({ header } = controller);
			leftButtonEventHandler = (header.leftButton as NavButton).eventHandler as (event: JQueryEventObject) => void;
			rightButtonEventHandler = (header.rightButton as NavButton).eventHandler as (event: JQueryEventObject) => void;

			leftButton = $("<a>")
				.attr("id", "headerLeftButton")
				.on("click", leftButtonEventHandler)
				.show()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "headerRightButton")
				.on("click", rightButtonEventHandler)
				.show()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "headerLabel")
				.show()
				.val("Test header")
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				leftButton.trigger("click");
				leftButtonEventHandler.should.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.leftButton = undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				leftButton.trigger("click");
				leftButtonEventHandler.should.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with right button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				rightButton.trigger("click");
				rightButtonEventHandler.should.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.rightButton = undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				rightButton.trigger("click");
				rightButtonEventHandler.should.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.css("display").should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.css("display").should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.css("display").should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("setContentHeight", (): void => {
		it("should set the height of the content area minus the header and footer", (): void => {
			const header: JQuery = $("<div>")
							.attr("id", "header")
							.appendTo(document.body)
							.outerHeight(20),
						footer: JQuery = $("<div>")
							.attr("id", "footer")
							.appendTo(document.body)
							.outerHeight(10),
						scrollingElement: JQuery = $("<div>")
							.appendTo(content);

			WindowMock.innerHeight = 50;
			applicationController["setContentHeight"]();
			Number(scrollingElement.outerHeight()).should.equal(20);
			header.remove();
			footer.remove();
		});
	});

	describe("hideNotice", (): void => {
		let notice: JQuery;

		beforeEach((): void => {
			sinon.stub(applicationController, "noticeHidden" as keyof ApplicationController);
			applicationController["noticeStack"].height = 5;
			applicationController["noticeStack"].notice = [];
			notice = $("<div>");
			sinon.stub(notice, "height").returns(10);
			sinon.stub(notice, "data");
			sinon.stub(notice, "animate").yields();
			applicationController["hideNotice"](notice);
		});

		it("should update the height of the notice stack to reclaim the space for the notice", (): Chai.Assertion => applicationController["noticeStack"].height.should.equal(15));
		it("should mark the notice as acknowledged", (): Chai.Assertion => notice.data.should.have.been.calledWith("acknowledged", true));
		it("should slide down the notice to hide it", (): Chai.Assertion => notice.animate.should.have.been.calledWith({ height: 0 }, sinon.match.func));
		it("should invoke the completed callback", (): Chai.Assertion => applicationController["noticeHidden"].should.have.been.called);
	});

	describe("noticeHidden", (): void => {
		let notices: JQuery;

		beforeEach((done: Mocha.Done): void => {
			notices = $("<div>")
				.attr("id", "notices")
				.appendTo(document.body);

			sinon.stub(applicationController, "noticesMoved" as keyof ApplicationController).callsFake((): void => done());
			sinon.spy($.fn, "animate");
			$.fx.off = true;
			applicationController["noticeStack"].height = 10;
			applicationController["noticeHidden"]();
		});

		it("should slide down the notices container to the height of the notice stack", (): Chai.Assertion => $.fn.animate.should.have.been.calledWith({ top: "-=10" }));

		it("should invoke the completed callback", (): Chai.Assertion => applicationController["noticesMoved"].should.have.been.called);

		afterEach((): void => {
			($.fn.animate as SinonSpy).restore();
			notices.remove();
			$.fx.off = false;
		});
	});

	describe("noticesMoved", (): void => {
		interface Scenario {
			description: string;
			noticeAcknowledgements: boolean[];
			containerVisibility: "hidden" | "visible";
		}

		const scenarios: Scenario[] = [
			{
				description: "all notices acknowledged",
				noticeAcknowledgements: [true, true, true],
				containerVisibility: "hidden"
			},
			{
				description: "some notices acknowledged",
				noticeAcknowledgements: [true, false, true],
				containerVisibility: "visible"
			}
		];

		let	notice: JQuery,
				remove: SinonStub,
				notices: JQuery,
				acknowledged: boolean[],
				unacknowledged: boolean[];

		beforeEach((): void => {
			notices = $("<div>")
				.attr("id", "notices")
				.css("visibility", "visible")
				.appendTo(document.body);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					remove = sinon.stub();

					scenario.noticeAcknowledgements.forEach((noticeAcknowledged: boolean): void => {
						notice = $("<div>").data("acknowledged", noticeAcknowledged);
						sinon.stub(notice, "remove").callsFake(remove);
						applicationController["noticeStack"].notice.push(notice);
					});

					acknowledged = scenario.noticeAcknowledgements.filter((noticeAcknowledged: boolean): boolean => noticeAcknowledged);
					unacknowledged = scenario.noticeAcknowledgements.filter((noticeAcknowledged: boolean): boolean => !noticeAcknowledged);
					applicationController["noticesMoved"]();
				});

				it("should remove any acknowledged notices from the DOM", (): Chai.Assertion => remove.callCount.should.equal(acknowledged.length));
				it("should remove any acknowledged notices from the notice stack", (): Chai.Assertion => applicationController["noticeStack"].notice.length.should.equal(unacknowledged.length));
				it(`should ${"hidden" === scenario.containerVisibility ? "hide" : "not hide"} the notices container`, (): Chai.Assertion => notices.css("visibility").should.equal(scenario.containerVisibility));
			});
		});

		afterEach((): JQuery => notices.remove());
	});

	describe("gotLastSyncTime", (): void => {
		beforeEach((): SinonStub => sinon.stub(applicationController, "showNotice" as keyof ApplicationController));

		describe("without last sync time", (): void => {
			it("should do nothing", (): void => {
				applicationController["gotLastSyncTime"](new SettingMock());
				applicationController.showNotice.should.not.have.been.called;
			});
		});

		describe("with last sync time", (): void => {
			let clock: SinonFakeTimers,
					settingValue: Date;

			beforeEach((): SinonFakeTimers => (clock = sinon.useFakeTimers(new Date().valueOf())));

			describe("younger than max data data age days", (): void => {
				it("should do nothing", (): void => {
					settingValue = new Date(new Date().valueOf() - (7 * 24 * 60 * 60 * 1000));
					applicationController["gotLastSyncTime"](new SettingMock(undefined, String(settingValue)));
					applicationController.showNotice.should.not.have.been.called;
				});
			});

			describe("older than max data age days", (): void => {
				it("should display a sync notice", (): void => {
					settingValue = new Date(new Date().valueOf() - (9 * 24 * 60 * 60 * 1000));
					applicationController["gotLastSyncTime"](new SettingMock(undefined, String(settingValue)));
					applicationController.showNotice.should.have.been.calledWith({
						label: "The last data sync was over 7 days ago",
						leftButton: {
							style: "cautionButton",
							label: "OK"
						}
					});
				});
			});

			afterEach((): void => clock.restore());
		});
	});

	afterEach((): void => {
		contentWrapper.remove();
		abc.remove();
		(ApplicationController.prototype["contentShown"] as SinonSpy).restore();
	});
});