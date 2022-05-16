import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	Notice,
	View,
	ViewControllerArgs
} from "controllers";
import type {
	SinonFakeTimers,
	SinonSpy,
	SinonStub
} from "sinon";
import ApplicationController from "../../../src/controllers/application-controller";
import SettingMock from "mocks/setting-model-mock";
import SyncMock from "mocks/sync-model-mock";
import TestController from "mocks/test-controller";
import WindowMock from "mocks/window-mock";
import sinon from "sinon";

describe("ApplicationController", (): void => {
	let contentWrapper: HTMLDivElement,
			content: HTMLDivElement,
			applicationController: ApplicationController;

	beforeEach((): void => {
		contentWrapper = document.createElement("div");
		contentWrapper.id = "contentWrapper";
		document.body.append(contentWrapper);

		content = document.createElement("div");
		content.id = "content";
		contentWrapper.append(content);

		sinon.spy(ApplicationController.prototype, "contentShown" as keyof ApplicationController);
		ApplicationController["singletonInstance"] = undefined;
		applicationController = new ApplicationController();
	});

	describe("object constructor", (): void => {
		it("should return an ApplicationController instance", (): Chai.Assertion => applicationController.should.be.an.instanceOf(ApplicationController));
		it("should make the instance a singleton", (): Chai.Assertion => applicationController.should.equal(ApplicationController["singletonInstance"]));
		it("should initialise the view stack", (): Chai.Assertion => applicationController.viewStack.should.deep.equal([]));
		it("should initialise the notice stack", (): Chai.Assertion => applicationController["noticeStack"].should.deep.equal({ height: -20, notice: [] }));
		it("should set the max data age days", (): Chai.Assertion => applicationController["maxDataAgeDays"].should.equal(7));

		it("should attach a transition end event handler", (): void => {
			contentWrapper.dispatchEvent(new Event("transitionend"));
			applicationController["contentShown"].should.have.been.called;
		});

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
			sinon.stub(applicationController, "showSyncNotice" as keyof ApplicationController);
			SettingMock.get.reset();
			SettingMock.get.withArgs("LastSyncTime").returns(lastSyncTime);
			SyncMock.syncList = [new SyncMock(null, null)];
			await applicationController.start();
		});

		it("should load all view controllers", (): Chai.Assertion => Object.keys(applicationController["viewControllers"]).length.should.equal(13));
		it("should display the schedule view", (): Chai.Assertion => applicationController.pushView.should.have.been.calledWith("schedule"));
		it("should get the last sync time", (): Chai.Assertion => applicationController["showSyncNotice"].should.have.been.calledWith(lastSyncTime, 1));
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
			const scrollingElement = document.createElement("div"),
						item = document.createElement("div");

			item.style.height = "100px";
			scrollingElement.style.height = "50px";
			scrollingElement.style.overflowY = "scroll";
			scrollingElement.append(item);

			content.append(scrollingElement);
			scrollingElement.scrollTop = 10;

			applicationController.viewStack.push({ controller: new TestController(), scrollPos: 0 });
			applicationController.getScrollPosition();
			(applicationController.viewStack.pop() as View).scrollPos.should.equal(10);
		});
	});

	describe("setScrollPosition", (): void => {
		let scrollingElement: HTMLDivElement;

		beforeEach((): void => {
			const item1 = document.createElement("div"),
						item2 = document.createElement("div");

			item1.style.height = "100px";
			item2.style.height = "100px";

			scrollingElement = document.createElement("div");
			scrollingElement.style.height = "50px";
			scrollingElement.style.overflowY = "scroll";
			scrollingElement.append(item1, item2);

			content.append(scrollingElement);
		});

		describe("scroll position is -1", (): void => {
			it("should scroll to the bottom", (): void => {
				applicationController.viewStack.push({ controller: new TestController(), scrollPos: -1 });
				applicationController.setScrollPosition();
				scrollingElement.scrollTop.should.equal(100 + scrollingElement.offsetTop);
			});
		});

		describe("scoll position is not -1", (): void => {
			it("should restore the saved scroll position of the active view", (): void => {
				applicationController.viewStack.push({ controller: new TestController(), scrollPos: 20 });
				applicationController.setScrollPosition();
				scrollingElement.scrollTop.should.equal(20);
			});
		});
	});

	describe("setFooter", (): void => {
		let controller: TestController,
				leftButton: HTMLAnchorElement,
				rightButton: HTMLAnchorElement,
				label: HTMLElement;

		beforeEach((): void => {
			controller = new TestController();

			leftButton = document.createElement("a");
			leftButton.id = "footerLeftButton";
			leftButton.style.display = "none";

			rightButton = document.createElement("a");
			rightButton.id = "footerRightButton";
			rightButton.style.display = "none";

			label = document.createElement("footer");
			label.id = "footerLabel";
			label.style.display = "none";

			document.body.append(leftButton, label, rightButton);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.setFooter();
			});

			it("should not show the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
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
						leftButton.dispatchEvent(new MouseEvent("click"));
						leftButtonEventHandler.should.have.been.called;
					});

					it("should style the button", (): void => {
						leftButton.classList.contains("button").should.be.true;
						leftButton.classList.contains("footer").should.be.true;
						leftButton.classList.contains("left").should.be.true;
						leftButton.classList.contains("backButton").should.be.true;
					});

					it("should set the button label", (): Chai.Assertion => String(leftButton.textContent).should.equal("left-button"));
					it("should show the button", (): Chai.Assertion => leftButton.style.display.should.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
					it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
				});

				describe("without event handler", (): void => {
					it("should not attach a click event handler", (): void => {
						(footer.leftButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
						leftButton.dispatchEvent(new MouseEvent("click"));
						leftButtonEventHandler.should.not.have.been.called;
					});
				});

				describe("without button style", (): void => {
					it("should not style the button", (): void => {
						(footer.leftButton as NavButton).style = undefined;
						applicationController.setFooter();
						leftButton.classList.contains("backButton").should.be.false;
					});
				});
			});

			describe("without left button", (): void => {
				beforeEach((): void => {
					footer.leftButton = undefined;
					applicationController.setFooter();
				});

				it("should not attach a click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					leftButtonEventHandler.should.not.have.been.called;
				});

				it("should not style the button", (): void => {
					leftButton.classList.contains("button").should.be.false;
					leftButton.classList.contains("footer").should.be.false;
					leftButton.classList.contains("left").should.be.false;
					leftButton.classList.contains("backButton").should.be.false;
				});

				it("should not set the button label", (): Chai.Assertion => String(leftButton.textContent).should.equal(""));
				it("should not show the button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
				it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with footer label", (): void => {
				beforeEach((): void => applicationController.setFooter());

				it("should set the footer label", (): Chai.Assertion => String(label.textContent).should.equal("test-footer"));
				it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without footer label", (): void => {
				beforeEach((): void => {
					footer.label = undefined;
					applicationController.setFooter();
				});

				it("should not set the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
				it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with right button", (): void => {
				describe("with event handler", (): void => {
					beforeEach((): void => applicationController.setFooter());

					it("should attach a click event handler", (): void => {
						rightButton.dispatchEvent(new MouseEvent("click"));
						rightButtonEventHandler.should.have.been.called;
					});

					it("should style the button", (): void => {
						rightButton.classList.contains("button").should.be.true;
						rightButton.classList.contains("footer").should.be.true;
						rightButton.classList.contains("right").should.be.true;
						rightButton.classList.contains("confirmButton").should.be.true;
					});

					it("should set the button label", (): Chai.Assertion => String(rightButton.textContent).should.equal("right-button"));
					it("should show the button", (): Chai.Assertion => rightButton.style.display.should.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
					it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
				});

				describe("without event handler", (): void => {
					it("should not attach a click event handler", (): void => {
						(footer.rightButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
						rightButton.dispatchEvent(new MouseEvent("click"));
						rightButtonEventHandler.should.not.have.been.called;
					});
				});

				describe("without button style", (): void => {
					it("should not style the button", (): void => {
						(footer.rightButton as NavButton).style = undefined;
						applicationController.setFooter();
						rightButton.classList.contains("confirmButton").should.be.false;
					});
				});
			});

			describe("without right button", (): void => {
				beforeEach((): void => {
					footer.rightButton = undefined;
					applicationController.setFooter();
				});

				it("should not attach a click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					rightButtonEventHandler.should.not.have.been.called;
				});

				it("should not style the button", (): void => {
					rightButton.classList.contains("button").should.be.false;
					rightButton.classList.contains("footer").should.be.false;
					rightButton.classList.contains("right").should.be.false;
					rightButton.classList.contains("confirmButton").should.be.false;
				});

				it("should not set the button label", (): Chai.Assertion => String(rightButton.textContent).should.equal(""));
				it("should not show the button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
				it("should show the footer label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
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
		let notices: HTMLDivElement,
				notice: Notice,
				noticeContainer: HTMLDivElement,
				button: HTMLAnchorElement;

		beforeEach((): void => {
			notices = document.createElement("div");
			notices.id = "notices";
			notices.style.position = "absolute";
			notices.style.visibility = "hidden";
			notices.style.top = "0px";
			document.body.append(notices);

			sinon.stub(applicationController, "noticesMoved" as keyof ApplicationController);
			sinon.stub(applicationController, "hideNotice" as keyof ApplicationController);
			notice = { label: "<b>test-notice</b>" };
			applicationController["noticeStack"].height = 0;
			applicationController["noticeStack"].notice = [];
			WindowMock.innerHeight = 50;
		});

		describe("notice", (): void => {
			beforeEach((): void => {
				applicationController.showNotice(notice);
				noticeContainer = notices.querySelector("div") as HTMLDivElement;
				button = noticeContainer.querySelector("a") as HTMLAnchorElement;
				button.dispatchEvent(new MouseEvent("click"));
			});

			it("should create a new notice", (): void => {
				noticeContainer.innerHTML.should.equal("<a class=\"button left cautionButton\">OK</a><p><b>test-notice</b></p>");
			});

			it("should attach a hide click event handler", (): Chai.Assertion => applicationController["hideNotice"].should.have.been.calledWith(sinon.match((element: HTMLDivElement): boolean => element === noticeContainer)));
		});

		describe("with notice id", (): void => {
			it("should set the notice id", (): void => {
				notice.id = "test-notice";
				applicationController.showNotice(notice);
				(null === notices.querySelector("div p#test-notice")).should.be.false;
			});
		});

		describe("without notice id", (): void => {
			it("should not set the notice id", (): void => {
				applicationController.showNotice(notice);
				(null === notices.querySelector("div p#test-notice")).should.be.true;
			});
		});

		describe("initial notice", (): void => {
			beforeEach((): void => applicationController.showNotice(notice));

			it("should position the notice stack off screen", (): Chai.Assertion => notices.style.top.should.equal("50px"));
			it("should make the notice stack visible", (): Chai.Assertion => notices.style.visibility.should.equal("visible"));
		});

		describe("subsequent notice", (): void => {
			beforeEach((): void => {
				applicationController["noticeStack"].notice.push(document.createElement("div"));
				applicationController.showNotice(notice);
			});

			it("should not position the notice stack off screen", (): Chai.Assertion => notices.style.top.should.equal("0px"));
			it("should make the notice stack visible", (): Chai.Assertion => notices.style.visibility.should.equal("hidden"));
		});

		it("should update the height of the notice stack to accomodate the new notice", (): void => {
			applicationController["noticeStack"].height = 0;
			applicationController.showNotice(notice);
			noticeContainer = notices.querySelector("div") as HTMLDivElement;
			applicationController["noticeStack"].height.should.equal(-noticeContainer.offsetHeight);
		});

		it("should push the notice onto the stack", (): void => {
			applicationController.showNotice(notice);
			noticeContainer = notices.querySelector("div") as HTMLDivElement;
			(applicationController["noticeStack"].notice.pop() as HTMLDivElement).should.equal(noticeContainer);
		});

		describe("animation", (): void => {
			beforeEach((done: Mocha.Done): void => {
				(applicationController["noticesMoved"] as SinonStub).callsFake((): void => done());
				sinon.spy(notices, "animate");
				applicationController["noticeStack"].height = 0;
				applicationController.showNotice(notice);
				notices.getAnimations().forEach((animation: Animation): void => animation.finish());
			});

			it("should slide up the notices container to reveal the notice", (): void => {
				noticeContainer = notices.querySelector("div") as HTMLDivElement;
				notices.animate.should.have.been.calledWith({ transform: `translateY(-${noticeContainer.offsetHeight}px)` });
			});

			it("should invoke the completed callback", (): Chai.Assertion => applicationController["noticesMoved"].should.have.been.called);

			afterEach((): void => (notices.animate as SinonSpy).restore());
		});

		afterEach((): void => notices.remove());
	});

	describe("clearFooter", (): void => {
		let controller: TestController,
				footer: HeaderFooter,
				leftButtonEventHandler: NavButtonEventHandler,
				rightButtonEventHandler: NavButtonEventHandler,
				leftButton: HTMLAnchorElement,
				rightButton: HTMLAnchorElement,
				label: HTMLElement;

		beforeEach((): void => {
			controller = new TestController();
			footer = controller.footer as HeaderFooter;
			leftButtonEventHandler = (footer.leftButton as NavButton).eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (footer.rightButton as NavButton).eventHandler as NavButtonEventHandler;

			leftButton = document.createElement("a");
			leftButton.id = "footerLeftButton";
			leftButton.addEventListener("click", leftButtonEventHandler);
			leftButton.style.display = "inline";

			rightButton = document.createElement("a");
			rightButton.id = "footerRightButton";
			rightButton.addEventListener("click", rightButtonEventHandler);
			rightButton.style.display = "inline";

			label = document.createElement("h1");
			label.id = "footerLabel";
			label.style.display = "block";
			label.textContent = "Test footer";

			document.body.append(leftButton, label, rightButton);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.clearFooter();
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should clear the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
			it("should hide the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with footer", (): void => {
			beforeEach((): number => applicationController.viewStack.push({ controller, scrollPos: 0 }));

			describe("with left button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					leftButtonEventHandler.should.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without left button", (): void => {
				beforeEach((): void => {
					(applicationController["currentView"].controller.footer as HeaderFooter).leftButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					leftButtonEventHandler.should.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("with right button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					rightButtonEventHandler.should.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without right button", (): void => {
				beforeEach((): void => {
					(applicationController["currentView"].controller.footer as HeaderFooter).rightButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					rightButtonEventHandler.should.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
				it("should clear the footer label", (): Chai.Assertion => String(label.textContent).should.equal(""));
				it("should hide the footer label", (): Chai.Assertion => label.style.display.should.equal("none"));
				it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
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
		});

		describe("with activate", (): void => {
			beforeEach(async (): Promise<void> => {
				Object.defineProperty(controller, "activate", { value: activate });
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				await applicationController["viewPopped"]({} as ViewControllerArgs);
			});

			it("should activate the view controller", (): Chai.Assertion => activate.should.have.been.calledWith({}));
		});
	});

	describe("show", (): void => {
		let nowLoading: HTMLDivElement,
				callback: SinonSpy;

		beforeEach(async (): Promise<void> => {
			nowLoading = document.createElement("div");
			nowLoading.id = "nowLoading";
			document.body.append(nowLoading);

			sinon.stub(applicationController, "setHeader" as keyof ApplicationController);
			applicationController.viewStack.push({ controller: new TestController(), scrollPos: 0 });
			callback = sinon.spy();
			await applicationController["show"](callback, {} as ViewControllerArgs);
		});

		it("should show the now loading indicator", (): Chai.Assertion => nowLoading.classList.contains("loading").should.be.true);
		it("should load the view template", (): Chai.Assertion => content.innerHTML.should.equal("<div></div>"));
		it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith({}));
		it("should slide the new view in from the right", (): Chai.Assertion => contentWrapper.classList.contains("loading").should.be.true);
		it("should set the header", (): Chai.Assertion => applicationController["setHeader"].should.have.been.called);

		afterEach((): void => nowLoading.remove());
	});

	describe("contentShown", (): void => {
		let nowLoading: HTMLDivElement;

		beforeEach((): void => {
			nowLoading = document.createElement("div");
			nowLoading.id = "nowLoading";
			nowLoading.classList.add("loading");
			document.body.append(nowLoading);
		});

		describe("loading", (): void => {
			beforeEach((): void => {
				contentWrapper.classList.add("loading");
				applicationController["contentShown"]();
			});

			it("should unmark the content wrapper as loading", (): Chai.Assertion => contentWrapper.classList.contains("loading").should.be.false);
			it("should mark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.classList.contains("loaded").should.be.true);
			it("should hide the now loading indicator", (): Chai.Assertion => nowLoading.classList.contains("loading").should.be.false);
		});

		describe("loaded", (): void => {
			let controller: TestController,
					contentShown: SinonStub;

			beforeEach((): void => {
				controller = new TestController();
				contentShown = sinon.stub();
				contentWrapper.classList.add("loaded");
			});

			describe("without content shown", (): void => {
				beforeEach((): void => {
					applicationController.viewStack.push({ controller, scrollPos: 0 });
					applicationController["contentShown"]();
				});

				it("should unmark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.classList.contains("loaded").should.be.false);
				it("should not call contentShown on the view controller", (): Chai.Assertion => contentShown.should.not.have.been.called);
			});

			describe("with content shown", (): void => {
				beforeEach((): void => {
					Object.defineProperty(controller, "contentShown", { value: contentShown });
					applicationController.viewStack.push({ controller, scrollPos: 0 });
					applicationController["contentShown"]();
				});

				it("should unmark the content wrapper as loaded", (): Chai.Assertion => contentWrapper.classList.contains("loaded").should.be.false);
				it("should call contentShown on the view controller", (): Chai.Assertion => contentShown.should.have.been.called);
			});
		});

		describe("unknown state", (): void => {
			it("should do nothing", (): void => {
				applicationController["contentShown"]();
				contentWrapper.classList.contains("loading").should.be.false;
				contentWrapper.classList.contains("loaded").should.be.false;
				nowLoading.classList.contains("loading").should.be.true;
			});
		});

		afterEach((): void => nowLoading.remove());
	});

	describe("setHeader", (): void => {
		let controller: TestController,
				header: HeaderFooter,
				leftButtonEventHandler: NavButtonEventHandler,
				rightButtonEventHandler: NavButtonEventHandler,
				leftButton: HTMLAnchorElement,
				rightButton: HTMLAnchorElement,
				label: HTMLHeadingElement;

		beforeEach((): void => {
			controller = new TestController();
			({ header } = controller);
			leftButtonEventHandler = (header.leftButton as NavButton).eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (header.rightButton as NavButton).eventHandler as NavButtonEventHandler;

			leftButton = document.createElement("a");
			leftButton.id = "headerLeftButton";
			leftButton.style.display = "none";

			rightButton = document.createElement("a");
			rightButton.id = "headerRightButton";
			rightButton.style.display = "none";

			label = document.createElement("h1");
			label.id = "headerLabel";
			label.style.display = "none";

			document.body.append(leftButton, label, rightButton);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					leftButtonEventHandler.should.have.been.called;
				});

				it("should style the button", (): void => {
					leftButton.classList.contains("button").should.be.true;
					leftButton.classList.contains("header").should.be.true;
					leftButton.classList.contains("left").should.be.true;
					leftButton.classList.contains("backButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => String(leftButton.textContent).should.equal("left-button"));
				it("should show the button", (): Chai.Assertion => leftButton.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.leftButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					leftButtonEventHandler.should.not.have.been.called;
				});
			});

			describe("without button style", (): void => {
				it("should not style the button", (): void => {
					(header.leftButton as NavButton).style = undefined;
					applicationController["setHeader"]();
					leftButton.classList.contains("backButton").should.be.false;
				});
			});
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				header.leftButton = undefined;
				applicationController["setHeader"]();
			});

			it("should not attach a click event handler", (): void => {
				leftButton.dispatchEvent(new MouseEvent("click"));
				leftButtonEventHandler.should.not.have.been.called;
			});

			it("should not style the button", (): void => {
				leftButton.classList.contains("button").should.be.false;
				leftButton.classList.contains("header").should.be.false;
				leftButton.classList.contains("left").should.be.false;
				leftButton.classList.contains("backButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => String(leftButton.textContent).should.equal(""));
			it("should not show the button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with header label", (): void => {
			beforeEach((): void => applicationController["setHeader"]());

			it("should set the header label", (): Chai.Assertion => String(label.textContent).should.equal("test-header"));
			it("should show the header label", (): Chai.Assertion => label.style.display.should.not.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without header label", (): void => {
			beforeEach((): void => {
				header.label = undefined;
				applicationController["setHeader"]();
			});

			it("should not set the header label", (): Chai.Assertion => String(label.textContent).should.equal(""));
			it("should not show the header label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with right button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					rightButtonEventHandler.should.have.been.called;
				});

				it("should style the button", (): void => {
					rightButton.classList.contains("button").should.be.true;
					rightButton.classList.contains("header").should.be.true;
					rightButton.classList.contains("right").should.be.true;
					rightButton.classList.contains("confirmButton").should.be.true;
				});

				it("should set the button label", (): Chai.Assertion => String(rightButton.textContent).should.equal("right-button"));
				it("should show the button", (): Chai.Assertion => rightButton.style.display.should.not.equal("none"));
				it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.rightButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					rightButtonEventHandler.should.not.have.been.called;
				});
			});

			describe("without button style", (): void => {
				it("should not style the button", (): void => {
					(header.rightButton as NavButton).style = undefined;
					applicationController["setHeader"]();
					rightButton.classList.contains("confirmButton").should.be.false;
				});
			});
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				header.rightButton = undefined;
				applicationController["setHeader"]();
			});

			it("should not attach a click event handler", (): void => {
				rightButton.dispatchEvent(new MouseEvent("click"));
				rightButtonEventHandler.should.not.have.been.called;
			});

			it("should not style the button", (): void => {
				rightButton.classList.contains("button").should.be.false;
				rightButton.classList.contains("header").should.be.false;
				rightButton.classList.contains("right").should.be.false;
				rightButton.classList.contains("confirmButton").should.be.false;
			});

			it("should not set the button label", (): Chai.Assertion => String(rightButton.textContent).should.equal(""));
			it("should not show the button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
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
				leftButtonEventHandler: NavButtonEventHandler,
				rightButtonEventHandler: NavButtonEventHandler,
				leftButton: HTMLAnchorElement,
				rightButton: HTMLAnchorElement,
				label: HTMLHeadingElement;

		beforeEach((): void => {
			controller = new TestController();
			({ header } = controller);
			leftButtonEventHandler = (header.leftButton as NavButton).eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (header.rightButton as NavButton).eventHandler as NavButtonEventHandler;

			leftButton = document.createElement("a");
			leftButton.id = "headerLeftButton";
			leftButton.addEventListener("click", leftButtonEventHandler);
			leftButton.style.display = "inline";

			rightButton = document.createElement("a");
			rightButton.id = "headerRightButton";
			rightButton.addEventListener("click", rightButtonEventHandler);
			rightButton.style.display = "inline";

			label = document.createElement("h1");
			label.id = "headerLabel";
			label.style.display = "block";
			label.textContent = "Test header";

			document.body.append(leftButton, label, rightButton);

			sinon.stub(applicationController, "setContentHeight" as keyof ApplicationController);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				leftButton.dispatchEvent(new MouseEvent("click"));
				leftButtonEventHandler.should.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.leftButton = undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				leftButton.dispatchEvent(new MouseEvent("click"));
				leftButtonEventHandler.should.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("with right button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				rightButton.dispatchEvent(new MouseEvent("click"));
				rightButtonEventHandler.should.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.rightButton = undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				rightButton.dispatchEvent(new MouseEvent("click"));
				rightButtonEventHandler.should.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion => leftButton.style.display.should.equal("none"));
			it("should hide the header label", (): Chai.Assertion => label.style.display.should.equal("none"));
			it("should hide the right button", (): Chai.Assertion => rightButton.style.display.should.equal("none"));
			it("should update the content height", (): Chai.Assertion => applicationController["setContentHeight"].should.have.been.called);
		});

		afterEach((): void => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("setContentHeight", (): void => {
		let header: HTMLDivElement,
				headerLabel: HTMLHeadingElement,
				footer: HTMLDivElement,
				footerLabel: HTMLElement,
				scrollingElement: HTMLDivElement;

		beforeEach((): void => {
			header = document.createElement("div");
			headerLabel = document.createElement("h1");
			footer = document.createElement("div");
			footerLabel = document.createElement("footer");
			scrollingElement = document.createElement("div");

			header.id = "header";
			header.style.height = "20px";
			headerLabel.id = "headerLabel";
			headerLabel.style.height = "15px";
			header.append(headerLabel);

			footer.id = "footer";
			footer.style.height = "20px";
			footerLabel.id = "footerLabel";
			footerLabel.style.height = "15px";
			footer.append(footerLabel);

			document.body.append(header, footer);

			scrollingElement.style.height = "40px";
			content.append(scrollingElement);

			WindowMock.innerHeight = 70;
		});

		describe("when the header label and footer label don't wrap", (): void => {
			it("should set the height of the content area minus the header and footer", (): void => {
				applicationController["setContentHeight"]();
				scrollingElement.offsetHeight.should.equal(17);
			});
		});

		describe("when the header label wraps", (): void => {
			it("should set the height of the content area minus the header label and footer", (): void => {
				headerLabel.style.height = "25px";
				applicationController["setContentHeight"]();
				scrollingElement.offsetHeight.should.equal(12);
			});
		});

		describe("when the footer label wraps", (): void => {
			it("should set the height of the content area minus the header and footer label", (): void => {
				footerLabel.style.height = "25px";
				applicationController["setContentHeight"]();
				scrollingElement.offsetHeight.should.equal(12);
			});
		});

		afterEach((): void => {
			header.remove();
			footer.remove();
		});
	});

	describe("hideNotice", (): void => {
		let notices: HTMLDivElement,
				notice: HTMLDivElement,
				otherNotice: HTMLDivElement;

		beforeEach((done: Mocha.Done): void => {
			applicationController["noticeStack"].height = -20;

			notices = document.createElement("div");
			notices.id = "notices";

			notice = document.createElement("div");
			notice.style.height = "10px";
			otherNotice = document.createElement("div");
			otherNotice.style.height = "10px";

			applicationController["noticeStack"].notice = [notice, otherNotice];
			notices.append(notice, otherNotice);

			document.body.append(notices);

			sinon.spy(notice, "animate");
			sinon.spy(notices, "animate");
			sinon.stub(applicationController, "noticesMoved" as keyof ApplicationController).callsFake((): void => done());

			applicationController["hideNotice"](notice);
			notice.getAnimations().forEach((animation: Animation): void => animation.finish());
			notices.getAnimations().forEach((animation: Animation): void => animation.finish());
		});

		it("should update the height of the notice stack to reclaim the space for the notice", (): Chai.Assertion => applicationController["noticeStack"].height.should.equal(-10));
		it("should slide out the notice to hide it", (): Chai.Assertion => notice.animate.should.have.been.calledWith({ transform: "translateX(100%)" }, { duration: 300, easing: "ease-in", fill: "forwards" }));
		it("should remove the notice from the DOM", (): Chai.Assertion => notices.children.length.should.equal(1));
		it("should remove the notice from the notice stack", (): Chai.Assertion => applicationController["noticeStack"].notice.should.not.include(notice));
		it("should slide down the notices container to the height of the notice stack", (): Chai.Assertion => notices.animate.should.have.been.calledWith({ transform: "translateY(-10px)" }, { duration: 500, delay: 300, easing: "ease", fill: "forwards" }));
		it("should invoke the completed callback", (): Chai.Assertion => applicationController["noticesMoved"].should.have.been.called);

		afterEach((): void => notices.remove());
	});

	describe("noticesMoved", (): void => {
		let	notices: HTMLDivElement;

		beforeEach((): void => {
			notices = document.createElement("div");
			notices.id = "notices";
			notices.style.visibility = "visible";
			document.body.append(notices);
		});

		it("should hide the notices container if there are no notices", (): void => {
			applicationController["noticesMoved"]();
			notices.style.visibility.should.equal("hidden");
		});

		it("should not hide the notices container if there are notices", (): void => {
			const notice = document.createElement("div");

			applicationController["noticeStack"].notice.push(notice);
			applicationController["noticesMoved"]();
			notices.style.visibility.should.equal("visible");
		});

		afterEach((): void => notices.remove());
	});

	describe("showSyncNotice", (): void => {
		beforeEach((): SinonStub => sinon.stub(applicationController, "showNotice" as keyof ApplicationController));

		describe("without local changes to sync", (): void => {
			it("should do nothing", (): void => {
				const clock: SinonFakeTimers = sinon.useFakeTimers(new Date().valueOf()),
							settingValue: Date = new Date(new Date().valueOf() - (7 * 24 * 60 * 60 * 1000));

				applicationController["showSyncNotice"](new SettingMock(undefined, String(settingValue)), 0);
				applicationController["showSyncNotice"](new SettingMock(), 0);
				applicationController.showNotice.should.not.have.been.called;
				clock.restore();
			});
		});

		describe("without last sync time", (): void => {
			it("should do nothing", (): void => {
				applicationController["showSyncNotice"](new SettingMock(), 1);
				applicationController.showNotice.should.not.have.been.called;
			});
		});

		describe("with last sync time & local changes to sync", (): void => {
			let clock: SinonFakeTimers,
					settingValue: Date;

			beforeEach((): SinonFakeTimers => (clock = sinon.useFakeTimers(new Date().valueOf())));

			describe("younger than max data data age days", (): void => {
				it("should do nothing", (): void => {
					settingValue = new Date(new Date().valueOf() - (7 * 24 * 60 * 60 * 1000));
					applicationController["showSyncNotice"](new SettingMock(undefined, String(settingValue)), 1);
					applicationController.showNotice.should.not.have.been.called;
				});
			});

			describe("older than max data age days", (): void => {
				it("should display a sync notice", (): void => {
					settingValue = new Date(new Date().valueOf() - (9 * 24 * 60 * 60 * 1000));
					applicationController["showSyncNotice"](new SettingMock(undefined, String(settingValue)), 1);
					applicationController.showNotice.should.have.been.calledWith({ label: "The last data sync was over 7 days ago" });
				});
			});

			afterEach((): void => clock.restore());
		});
	});

	afterEach((): void => {
		contentWrapper.remove();
		(ApplicationController.prototype["contentShown"] as SinonSpy).restore();
	});
});