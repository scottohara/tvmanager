import type {
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
	Notice,
	View,
	ViewControllerArgs,
} from "~/controllers";
import sinon, { type SinonSpy, type SinonStub } from "sinon";
import ApplicationController from "./application-controller";
import Login from "~/models/login-model";
import TestController from "~/mocks/test-controller";
import WindowMock from "~/mocks/window-mock";

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

		sinon.spy(
			ApplicationController.prototype,
			"contentShown" as keyof ApplicationController,
		);
		ApplicationController["singletonInstance"] = undefined;
		applicationController = new ApplicationController();
	});

	describe("object constructor", (): void => {
		it("should return an ApplicationController instance", (): Chai.Assertion =>
			expect(applicationController).to.be.an.instanceOf(ApplicationController));
		it("should make the instance a singleton", (): Chai.Assertion =>
			expect(applicationController).to.equal(
				ApplicationController["singletonInstance"],
			));
		it("should initialise the view stack", (): Chai.Assertion =>
			expect(applicationController.viewStack).to.deep.equal([]));
		it("should initialise the notice stack", (): Chai.Assertion =>
			expect(applicationController["noticeStack"]).to.deep.equal({
				height: -20,
				notice: [],
			}));
		it("should attach a transition end event handler", (): void => {
			contentWrapper.dispatchEvent(new Event("transitionend"));
			expect(applicationController["contentShown"]).to.have.been.called;
		});

		describe("instance already exists", (): void => {
			let anotherApplicationController: ApplicationController;

			beforeEach(
				(): ApplicationController =>
					(anotherApplicationController = new ApplicationController()),
			);

			it("should return an ApplicationController instance", (): Chai.Assertion =>
				expect(anotherApplicationController).to.be.an.instanceOf(
					ApplicationController,
				));
			it("should be the same instance", (): Chai.Assertion =>
				expect(anotherApplicationController).to.equal(applicationController));
		});
	});

	describe("start", (): void => {
		let fakeIsAuthenticated: SinonStub;

		beforeEach((): void => {
			sinon.stub(applicationController, "pushView");
			fakeIsAuthenticated = sinon.stub(Login, "isAuthenticated");
		});

		it("should load all view controllers", async (): Promise<void> => {
			await applicationController.start();

			expect(
				Object.keys(applicationController["viewControllers"]).length,
			).to.equal(12);
		});

		it("should display the schedule view if authenticated", async (): Promise<void> => {
			fakeIsAuthenticated.get((): boolean => true);

			await applicationController.start();

			expect(applicationController["pushView"]).to.have.been.calledWith(
				"schedule",
			);
		});

		it("should display the login view if unauthenticated", async (): Promise<void> => {
			fakeIsAuthenticated.get((): boolean => false);

			await applicationController.start();

			expect(applicationController["pushView"]).to.have.been.calledWith(
				"login",
			);
		});

		afterEach((): void => fakeIsAuthenticated.restore());
	});

	describe("popView", (): void => {
		beforeEach(async (): Promise<void> => {
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(
				applicationController,
				"clearHeader" as keyof ApplicationController,
			);
			sinon.stub(
				applicationController,
				"pushView" as keyof ApplicationController,
			);
			sinon.stub(
				applicationController,
				"viewPopped" as keyof ApplicationController,
			);
			sinon
				.stub(applicationController, "show" as keyof ApplicationController)
				.yields({});
			applicationController["viewStack"] = [
				{ controller: new TestController(), scrollPos: 0 },
				{ controller: new TestController(), scrollPos: 0 },
			];
			await applicationController.popView({} as ViewControllerArgs);
		});

		it("should clear the footer", (): Chai.Assertion =>
			expect(applicationController["clearFooter"]).to.have.been.called);
		it("should clear the header", (): Chai.Assertion =>
			expect(applicationController["clearHeader"]).to.have.been.called);
		it("should pop the view off the view stack", (): Chai.Assertion =>
			expect(applicationController.viewStack.length).to.equal(1));
		it("should display the previous view", (): void => {
			expect(applicationController["show"]).to.have.been.calledWith(
				sinon.match.func,
				{},
			);
			expect(applicationController["viewPopped"]).to.have.been.calledWith({});
		});
		it("should push the schedule view if the view stack is empty", async (): Promise<void> => {
			await applicationController.popView({} as ViewControllerArgs);

			expect(applicationController["pushView"]).to.have.been.calledWith(
				"schedule",
			);
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

			applicationController.viewStack.push({
				controller: new TestController(),
				scrollPos: 0,
			});
			applicationController.getScrollPosition();
			expect(
				(applicationController.viewStack.pop() as View).scrollPos,
			).to.equal(10);
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
				applicationController.viewStack.push({
					controller: new TestController(),
					scrollPos: -1,
				});
				applicationController.setScrollPosition();
				expect(scrollingElement.scrollTop).to.equal(
					100 + scrollingElement.offsetTop,
				);
			});
		});

		describe("scoll position is not -1", (): void => {
			it("should restore the saved scroll position of the active view", (): void => {
				applicationController.viewStack.push({
					controller: new TestController(),
					scrollPos: 20,
				});
				applicationController.setScrollPosition();
				expect(scrollingElement.scrollTop).to.equal(20);
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

			sinon.stub(
				applicationController,
				"setContentHeight" as keyof ApplicationController,
			);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.setFooter();
			});

			it("should not show the footer label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should not update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.not.have.been
					.called);
		});

		describe("with footer", (): void => {
			let footer: HeaderFooter,
				leftButtonEventHandler: NavButtonEventHandler,
				rightButtonEventHandler: NavButtonEventHandler;

			beforeEach((): void => {
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				footer = controller.footer as HeaderFooter;
				leftButtonEventHandler = (footer.leftButton as NavButton)
					.eventHandler as NavButtonEventHandler;
				rightButtonEventHandler = (footer.rightButton as NavButton)
					.eventHandler as NavButtonEventHandler;
			});

			describe("with left button", (): void => {
				describe("with event handler", (): void => {
					beforeEach((): void => applicationController.setFooter());

					it("should attach a click event handler", (): void => {
						leftButton.dispatchEvent(new MouseEvent("click"));
						expect(leftButtonEventHandler).to.have.been.called;
					});

					it("should style the button", (): void => {
						expect(leftButton.classList.contains("button")).to.be.true;
						expect(leftButton.classList.contains("footer")).to.be.true;
						expect(leftButton.classList.contains("left")).to.be.true;
						expect(leftButton.classList.contains("backButton")).to.be.true;
					});

					it("should set the button label", (): Chai.Assertion =>
						expect(leftButton.textContent).to.equal("left-button"));
					it("should show the button", (): Chai.Assertion =>
						expect(leftButton.style.display).to.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion =>
						expect(label.style.display).to.not.equal("none"));
					it("should update the content height", (): Chai.Assertion =>
						expect(applicationController["setContentHeight"]).to.have.been
							.called);
				});

				describe("without event handler", (): void => {
					it("should not attach a click event handler", (): void => {
						(footer.leftButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
						leftButton.dispatchEvent(new MouseEvent("click"));
						expect(leftButtonEventHandler).to.not.have.been.called;
					});
				});

				describe("without button style", (): void => {
					it("should not style the button", (): void => {
						(footer.leftButton as NavButton).style = undefined;
						applicationController.setFooter();
						expect(leftButton.classList.contains("backButton")).to.be.false;
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
					expect(leftButtonEventHandler).to.not.have.been.called;
				});

				it("should not style the button", (): void => {
					expect(leftButton.classList.contains("button")).to.be.false;
					expect(leftButton.classList.contains("footer")).to.be.false;
					expect(leftButton.classList.contains("left")).to.be.false;
					expect(leftButton.classList.contains("backButton")).to.be.false;
				});

				it("should not set the button label", (): Chai.Assertion =>
					expect(leftButton.textContent).to.equal(""));
				it("should not show the button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.equal("none"));
				it("should show the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("with footer label", (): void => {
				beforeEach((): void => applicationController.setFooter());

				it("should set the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal("test-footer"));
				it("should show the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("without footer label", (): void => {
				beforeEach((): void => {
					footer.label = undefined;
					applicationController.setFooter();
				});

				it("should not set the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal(""));
				it("should show the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("with right button", (): void => {
				describe("with event handler", (): void => {
					beforeEach((): void => applicationController.setFooter());

					it("should attach a click event handler", (): void => {
						rightButton.dispatchEvent(new MouseEvent("click"));
						expect(rightButtonEventHandler).to.have.been.called;
					});

					it("should style the button", (): void => {
						expect(rightButton.classList.contains("button")).to.be.true;
						expect(rightButton.classList.contains("footer")).to.be.true;
						expect(rightButton.classList.contains("right")).to.be.true;
						expect(rightButton.classList.contains("confirmButton")).to.be.true;
					});

					it("should set the button label", (): Chai.Assertion =>
						expect(rightButton.textContent).to.equal("right-button"));
					it("should show the button", (): Chai.Assertion =>
						expect(rightButton.style.display).to.not.equal("none"));
					it("should show the footer label", (): Chai.Assertion =>
						expect(label.style.display).to.not.equal("none"));
					it("should update the content height", (): Chai.Assertion =>
						expect(applicationController["setContentHeight"]).to.have.been
							.called);
				});

				describe("without event handler", (): void => {
					it("should not attach a click event handler", (): void => {
						(footer.rightButton as NavButton).eventHandler = undefined;
						applicationController.setFooter();
						rightButton.dispatchEvent(new MouseEvent("click"));
						expect(rightButtonEventHandler).to.not.have.been.called;
					});
				});

				describe("without button style", (): void => {
					it("should not style the button", (): void => {
						(footer.rightButton as NavButton).style = undefined;
						applicationController.setFooter();
						expect(rightButton.classList.contains("confirmButton")).to.be.false;
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
					expect(rightButtonEventHandler).to.not.have.been.called;
				});

				it("should not style the button", (): void => {
					expect(rightButton.classList.contains("button")).to.be.false;
					expect(rightButton.classList.contains("footer")).to.be.false;
					expect(rightButton.classList.contains("right")).to.be.false;
					expect(rightButton.classList.contains("confirmButton")).to.be.false;
				});

				it("should not set the button label", (): Chai.Assertion =>
					expect(rightButton.textContent).to.equal(""));
				it("should not show the button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.equal("none"));
				it("should show the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
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
				viewStack: [],
			},
			{
				description: "subsequent view",
				viewStack: [{ controller: new TestController(), scrollPos: 0 }],
			},
		];

		beforeEach((): void => {
			sinon.stub(applicationController, "getScrollPosition");
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(
				applicationController,
				"clearHeader" as keyof ApplicationController,
			);
			sinon.stub(
				applicationController,
				"viewPushed" as keyof ApplicationController,
			);
			sinon
				.stub(applicationController, "show" as keyof ApplicationController)
				.yields();
			applicationController["viewControllers"] = { test: TestController };
		});

		let view: View;

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					applicationController.viewStack = scenario.viewStack;
					await applicationController.pushView(
						"test",
						{} as ViewControllerArgs,
					);
					view = applicationController.viewStack.pop() as View;
				});

				if (scenario.viewStack.length > 0) {
					it("should get the scroll position", (): Chai.Assertion =>
						expect(applicationController["getScrollPosition"]).to.have.been
							.called);
					it("should clear the footer", (): Chai.Assertion =>
						expect(applicationController["clearFooter"]).to.have.been.called);
					it("should clear the header", (): Chai.Assertion =>
						expect(applicationController["clearHeader"]).to.have.been.called);
				} else {
					it("should not get the scroll position", (): Chai.Assertion =>
						expect(applicationController["getScrollPosition"]).to.not.have.been
							.called);
					it("should not clear the footer", (): Chai.Assertion =>
						expect(applicationController["clearFooter"]).to.not.have.been
							.called);
					it("should not clear the header", (): Chai.Assertion =>
						expect(applicationController["clearHeader"]).to.not.have.been
							.called);
				}

				it("should push the view onto the view stack", (): void => {
					expect(view.controller).to.be.an.instanceOf(TestController);
					expect(view.scrollPos).to.equal(0);
				});

				it("should instantiate the view controller", (): Chai.Assertion =>
					expect(
						(view.controller as TestController).args as ViewControllerArgs,
					).to.deep.equal({}));

				it("should display the view", (): void => {
					expect(applicationController["show"]).to.have.been.called;
					expect(applicationController["viewPushed"]).to.have.been.called;
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

			sinon.stub(
				applicationController,
				"noticesMoved" as keyof ApplicationController,
			);
			sinon.stub(
				applicationController,
				"hideNotice" as keyof ApplicationController,
			);
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
				expect(noticeContainer.innerHTML).to.equal(
					'<a class="button left cautionButton">OK</a><p><b>test-notice</b></p>',
				);
			});

			it("should attach a hide click event handler", (): Chai.Assertion =>
				expect(applicationController["hideNotice"]).to.have.been.calledWith(
					sinon.match(
						(element: HTMLDivElement): boolean => element === noticeContainer,
					),
				));
		});

		describe("with notice id", (): void => {
			it("should set the notice id", (): void => {
				notice.id = "test-notice";
				applicationController.showNotice(notice);
				expect(notices.querySelector("div p#test-notice")).to.not.be.null;
			});
		});

		describe("without notice id", (): void => {
			it("should not set the notice id", (): void => {
				applicationController.showNotice(notice);
				expect(notices.querySelector("div p#test-notice")).to.be.null;
			});
		});

		describe("initial notice", (): void => {
			beforeEach((): void => applicationController.showNotice(notice));

			it("should position the notice stack off screen", (): Chai.Assertion =>
				expect(notices.style.top).to.equal("50px"));
			it("should make the notice stack visible", (): Chai.Assertion =>
				expect(notices.style.visibility).to.equal("visible"));
		});

		describe("subsequent notice", (): void => {
			beforeEach((): void => {
				applicationController["noticeStack"].notice.push(
					document.createElement("div"),
				);
				applicationController.showNotice(notice);
			});

			it("should not position the notice stack off screen", (): Chai.Assertion =>
				expect(notices.style.top).to.equal("0px"));
			it("should make the notice stack visible", (): Chai.Assertion =>
				expect(notices.style.visibility).to.equal("hidden"));
		});

		it("should update the height of the notice stack to accomodate the new notice", (): void => {
			applicationController["noticeStack"].height = 0;
			applicationController.showNotice(notice);
			noticeContainer = notices.querySelector("div") as HTMLDivElement;
			expect(applicationController["noticeStack"].height).to.equal(
				-noticeContainer.offsetHeight,
			);
		});

		it("should push the notice onto the stack", (): void => {
			applicationController.showNotice(notice);
			noticeContainer = notices.querySelector("div") as HTMLDivElement;
			expect(
				applicationController["noticeStack"].notice.pop() as HTMLDivElement,
			).to.equal(noticeContainer);
		});

		describe("animation", (): void => {
			beforeEach((done: Mocha.Done): void => {
				(applicationController["noticesMoved"] as SinonStub).callsFake(
					(): void => done(),
				);
				sinon.spy(notices, "animate");
				applicationController["noticeStack"].height = 0;
				applicationController.showNotice(notice);
				notices
					.getAnimations()
					.forEach((animation: Animation): void => animation.finish());
			});

			it("should slide up the notices container to reveal the notice", (): void => {
				noticeContainer = notices.querySelector("div") as HTMLDivElement;
				expect(notices["animate"]).to.have.been.calledWith({
					transform: `translateY(-${noticeContainer.offsetHeight}px)`,
				});
			});

			it("should invoke the completed callback", (): Chai.Assertion =>
				expect(applicationController["noticesMoved"]).to.have.been.called);

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
			leftButtonEventHandler = (footer.leftButton as NavButton)
				.eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (footer.rightButton as NavButton)
				.eventHandler as NavButtonEventHandler;

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

			sinon.stub(
				applicationController,
				"setContentHeight" as keyof ApplicationController,
			);
		});

		describe("without footer", (): void => {
			beforeEach((): void => {
				controller.footer = undefined;
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				applicationController.clearFooter();
			});

			it("should hide the left button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should clear the footer label", (): Chai.Assertion =>
				expect(label.textContent).to.equal(""));
			it("should hide the footer label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should hide the right button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("with footer", (): void => {
			beforeEach((): number =>
				applicationController.viewStack.push({ controller, scrollPos: 0 }),
			);

			describe("with left button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					expect(leftButtonEventHandler).to.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.equal("none"));
				it("should clear the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal(""));
				it("should hide the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.equal("none"));
				it("should hide the right button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("without left button", (): void => {
				beforeEach((): void => {
					(
						applicationController["currentView"].controller
							.footer as HeaderFooter
					).leftButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					expect(leftButtonEventHandler).to.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.equal("none"));
				it("should clear the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal(""));
				it("should hide the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.equal("none"));
				it("should hide the right button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("with right button", (): void => {
				beforeEach((): void => applicationController.clearFooter());

				it("should detach the click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					expect(rightButtonEventHandler).to.not.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.equal("none"));
				it("should clear the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal(""));
				it("should hide the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.equal("none"));
				it("should hide the right button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("without right button", (): void => {
				beforeEach((): void => {
					(
						applicationController["currentView"].controller
							.footer as HeaderFooter
					).rightButton = undefined;
					applicationController.clearFooter();
				});

				it("should not detach the click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					expect(rightButtonEventHandler).to.have.been.called;
				});

				it("should hide the left button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.equal("none"));
				it("should clear the footer label", (): Chai.Assertion =>
					expect(label.textContent).to.equal(""));
				it("should hide the footer label", (): Chai.Assertion =>
					expect(label.style.display).to.equal("none"));
				it("should hide the right button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
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
			expect(applicationController["currentView"]).to.deep.equal(view);
		});
	});

	describe("viewPushed", (): void => {
		let controller: TestController;

		beforeEach(async (): Promise<void> => {
			controller = new TestController();
			applicationController.viewStack.push({ controller, scrollPos: 0 });
			await applicationController["viewPushed"]();
		});

		it("should setup the view controller", (): Chai.Assertion =>
			expect(controller.setup).to.have.been.called);
	});

	describe("viewPopped", (): void => {
		let controller: TestController, activate: SinonStub;

		beforeEach((): void => {
			controller = new TestController();
			activate = sinon.stub();
		});

		describe("without activate", (): void => {
			beforeEach(async (): Promise<void> => {
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				await applicationController["viewPopped"]({} as ViewControllerArgs);
			});

			it("should not activate the view controller", (): Chai.Assertion =>
				expect(activate).to.not.have.been.called);
		});

		describe("with activate", (): void => {
			beforeEach(async (): Promise<void> => {
				Object.defineProperty(controller, "activate", { value: activate });
				applicationController.viewStack.push({ controller, scrollPos: 0 });
				await applicationController["viewPopped"]({} as ViewControllerArgs);
			});

			it("should activate the view controller", (): Chai.Assertion =>
				expect(activate).to.have.been.calledWith({}));
		});
	});

	describe("show", (): void => {
		let nowLoading: HTMLDivElement, callback: SinonSpy;

		beforeEach(async (): Promise<void> => {
			nowLoading = document.createElement("div");
			nowLoading.id = "nowLoading";
			document.body.append(nowLoading);

			sinon.stub(
				applicationController,
				"setHeader" as keyof ApplicationController,
			);
			applicationController.viewStack.push({
				controller: new TestController(),
				scrollPos: 0,
			});
			callback = sinon.spy();
			await applicationController["show"](callback, {} as ViewControllerArgs);
		});

		it("should show the now loading indicator", (): Chai.Assertion =>
			expect(nowLoading.classList.contains("loading")).to.be.true);
		it("should load the view template", (): Chai.Assertion =>
			expect(content.innerHTML).to.equal("<div></div>\n"));
		it("should invoke the callback", (): Chai.Assertion =>
			expect(callback).to.have.been.calledWith({}));
		it("should slide the new view in from the right", (): Chai.Assertion =>
			expect(contentWrapper.classList.contains("loading")).to.be.true);
		it("should set the header", (): Chai.Assertion =>
			expect(applicationController["setHeader"]).to.have.been.called);

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

			it("should unmark the content wrapper as loading", (): Chai.Assertion =>
				expect(contentWrapper.classList.contains("loading")).to.be.false);
			it("should mark the content wrapper as loaded", (): Chai.Assertion =>
				expect(contentWrapper.classList.contains("loaded")).to.be.true);
			it("should hide the now loading indicator", (): Chai.Assertion =>
				expect(nowLoading.classList.contains("loading")).to.be.false);
		});

		describe("loaded", (): void => {
			let controller: TestController, contentShown: SinonStub;

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

				it("should unmark the content wrapper as loaded", (): Chai.Assertion =>
					expect(contentWrapper.classList.contains("loaded")).to.be.false);
				it("should not call contentShown on the view controller", (): Chai.Assertion =>
					expect(contentShown).to.not.have.been.called);
			});

			describe("with content shown", (): void => {
				beforeEach((): void => {
					Object.defineProperty(controller, "contentShown", {
						value: contentShown,
					});
					applicationController.viewStack.push({ controller, scrollPos: 0 });
					applicationController["contentShown"]();
				});

				it("should unmark the content wrapper as loaded", (): Chai.Assertion =>
					expect(contentWrapper.classList.contains("loaded")).to.be.false);
				it("should call contentShown on the view controller", (): Chai.Assertion =>
					expect(contentShown).to.have.been.called);
			});
		});

		describe("unknown state", (): void => {
			it("should do nothing", (): void => {
				applicationController["contentShown"]();
				expect(contentWrapper.classList.contains("loading")).to.be.false;
				expect(contentWrapper.classList.contains("loaded")).to.be.false;
				expect(nowLoading.classList.contains("loading")).to.be.true;
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
			leftButtonEventHandler = (header.leftButton as NavButton)
				.eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (header.rightButton as NavButton)
				.eventHandler as NavButtonEventHandler;

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

			sinon.stub(
				applicationController,
				"setContentHeight" as keyof ApplicationController,
			);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					expect(leftButtonEventHandler).to.have.been.called;
				});

				it("should style the button", (): void => {
					expect(leftButton.classList.contains("button")).to.be.true;
					expect(leftButton.classList.contains("header")).to.be.true;
					expect(leftButton.classList.contains("left")).to.be.true;
					expect(leftButton.classList.contains("backButton")).to.be.true;
				});

				it("should set the button label", (): Chai.Assertion =>
					expect(leftButton.textContent).to.equal("left-button"));
				it("should show the button", (): Chai.Assertion =>
					expect(leftButton.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.leftButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					leftButton.dispatchEvent(new MouseEvent("click"));
					expect(leftButtonEventHandler).to.not.have.been.called;
				});
			});

			describe("without button style", (): void => {
				it("should not style the button", (): void => {
					(header.leftButton as NavButton).style = undefined;
					applicationController["setHeader"]();
					expect(leftButton.classList.contains("backButton")).to.be.false;
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
				expect(leftButtonEventHandler).to.not.have.been.called;
			});

			it("should not style the button", (): void => {
				expect(leftButton.classList.contains("button")).to.be.false;
				expect(leftButton.classList.contains("header")).to.be.false;
				expect(leftButton.classList.contains("left")).to.be.false;
				expect(leftButton.classList.contains("backButton")).to.be.false;
			});

			it("should not set the button label", (): Chai.Assertion =>
				expect(leftButton.textContent).to.equal(""));
			it("should not show the button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("with header label", (): void => {
			beforeEach((): void => applicationController["setHeader"]());

			it("should set the header label", (): Chai.Assertion =>
				expect(label.textContent).to.equal("test-header"));
			it("should show the header label", (): Chai.Assertion =>
				expect(label.style.display).to.not.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("without header label", (): void => {
			beforeEach((): void => {
				header.label = undefined;
				applicationController["setHeader"]();
			});

			it("should not set the header label", (): Chai.Assertion =>
				expect(label.textContent).to.equal(""));
			it("should not show the header label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("with right button", (): void => {
			describe("with event handler", (): void => {
				beforeEach((): void => applicationController["setHeader"]());

				it("should attach a click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					expect(rightButtonEventHandler).to.have.been.called;
				});

				it("should style the button", (): void => {
					expect(rightButton.classList.contains("button")).to.be.true;
					expect(rightButton.classList.contains("header")).to.be.true;
					expect(rightButton.classList.contains("right")).to.be.true;
					expect(rightButton.classList.contains("confirmButton")).to.be.true;
				});

				it("should set the button label", (): Chai.Assertion =>
					expect(rightButton.textContent).to.equal("right-button"));
				it("should show the button", (): Chai.Assertion =>
					expect(rightButton.style.display).to.not.equal("none"));
				it("should update the content height", (): Chai.Assertion =>
					expect(applicationController["setContentHeight"]).to.have.been
						.called);
			});

			describe("without event handler", (): void => {
				beforeEach((): void => {
					(header.rightButton as NavButton).eventHandler = undefined;
					applicationController["setHeader"]();
				});

				it("should not attach a click event handler", (): void => {
					rightButton.dispatchEvent(new MouseEvent("click"));
					expect(rightButtonEventHandler).to.not.have.been.called;
				});
			});

			describe("without button style", (): void => {
				it("should not style the button", (): void => {
					(header.rightButton as NavButton).style = undefined;
					applicationController["setHeader"]();
					expect(rightButton.classList.contains("confirmButton")).to.be.false;
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
				expect(rightButtonEventHandler).to.not.have.been.called;
			});

			it("should not style the button", (): void => {
				expect(rightButton.classList.contains("button")).to.be.false;
				expect(rightButton.classList.contains("header")).to.be.false;
				expect(rightButton.classList.contains("right")).to.be.false;
				expect(rightButton.classList.contains("confirmButton")).to.be.false;
			});

			it("should not set the button label", (): Chai.Assertion =>
				expect(rightButton.textContent).to.equal(""));
			it("should not show the button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
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
			leftButtonEventHandler = (header.leftButton as NavButton)
				.eventHandler as NavButtonEventHandler;
			rightButtonEventHandler = (header.rightButton as NavButton)
				.eventHandler as NavButtonEventHandler;

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

			sinon.stub(
				applicationController,
				"setContentHeight" as keyof ApplicationController,
			);
			applicationController.viewStack.push({ controller, scrollPos: 0 });
		});

		describe("with left button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				leftButton.dispatchEvent(new MouseEvent("click"));
				expect(leftButtonEventHandler).to.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should hide the header label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should hide the right button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("without left button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.leftButton =
					undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				leftButton.dispatchEvent(new MouseEvent("click"));
				expect(leftButtonEventHandler).to.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should hide the header label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should hide the right button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("with right button", (): void => {
			beforeEach((): void => applicationController["clearHeader"]());

			it("should detach the click event handler", (): void => {
				rightButton.dispatchEvent(new MouseEvent("click"));
				expect(rightButtonEventHandler).to.not.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should hide the header label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should hide the right button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
		});

		describe("without right button", (): void => {
			beforeEach((): void => {
				applicationController["currentView"].controller.header.rightButton =
					undefined;
				applicationController["clearHeader"]();
			});

			it("should not detach the click event handler", (): void => {
				rightButton.dispatchEvent(new MouseEvent("click"));
				expect(rightButtonEventHandler).to.have.been.called;
			});

			it("should hide the left button", (): Chai.Assertion =>
				expect(leftButton.style.display).to.equal("none"));
			it("should hide the header label", (): Chai.Assertion =>
				expect(label.style.display).to.equal("none"));
			it("should hide the right button", (): Chai.Assertion =>
				expect(rightButton.style.display).to.equal("none"));
			it("should update the content height", (): Chai.Assertion =>
				expect(applicationController["setContentHeight"]).to.have.been.called);
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
				expect(scrollingElement.offsetHeight).to.equal(17);
			});
		});

		describe("when the header label wraps", (): void => {
			it("should set the height of the content area minus the header label and footer", (): void => {
				headerLabel.style.height = "25px";
				applicationController["setContentHeight"]();
				expect(scrollingElement.offsetHeight).to.equal(12);
			});
		});

		describe("when the footer label wraps", (): void => {
			it("should set the height of the content area minus the header and footer label", (): void => {
				footerLabel.style.height = "25px";
				applicationController["setContentHeight"]();
				expect(scrollingElement.offsetHeight).to.equal(12);
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
			sinon
				.stub(
					applicationController,
					"noticesMoved" as keyof ApplicationController,
				)
				.callsFake((): void => done());

			applicationController["hideNotice"](notice);
			notice
				.getAnimations()
				.forEach((animation: Animation): void => animation.finish());
			notices
				.getAnimations()
				.forEach((animation: Animation): void => animation.finish());
		});

		it("should update the height of the notice stack to reclaim the space for the notice", (): Chai.Assertion =>
			expect(applicationController["noticeStack"].height).to.equal(-10));
		it("should slide out the notice to hide it", (): Chai.Assertion =>
			expect(notice["animate"]).to.have.been.calledWith(
				{ transform: "translateX(100%)" },
				{ duration: 300, easing: "ease-in", fill: "forwards" },
			));
		it("should remove the notice from the DOM", (): Chai.Assertion =>
			expect(notices.children.length).to.equal(1));
		it("should remove the notice from the notice stack", (): Chai.Assertion =>
			expect(applicationController["noticeStack"].notice).to.not.include(
				notice,
			));
		it("should slide down the notices container to the height of the notice stack", (): Chai.Assertion =>
			expect(notices["animate"]).to.have.been.calledWith(
				{ transform: "translateY(-10px)" },
				{ duration: 500, delay: 300, easing: "ease", fill: "forwards" },
			));
		it("should invoke the completed callback", (): Chai.Assertion =>
			expect(applicationController["noticesMoved"]).to.have.been.called);

		afterEach((): void => notices.remove());
	});

	describe("noticesMoved", (): void => {
		let notices: HTMLDivElement;

		beforeEach((): void => {
			notices = document.createElement("div");
			notices.id = "notices";
			notices.style.visibility = "visible";
			document.body.append(notices);
		});

		it("should hide the notices container if there are no notices", (): void => {
			applicationController["noticesMoved"]();
			expect(notices.style.visibility).to.equal("hidden");
		});

		it("should not hide the notices container if there are notices", (): void => {
			const notice = document.createElement("div");

			applicationController["noticeStack"].notice.push(notice);
			applicationController["noticesMoved"]();
			expect(notices.style.visibility).to.equal("visible");
		});

		afterEach((): void => notices.remove());
	});

	afterEach((): void => {
		contentWrapper.remove();
		(ApplicationController.prototype["contentShown"] as SinonSpy).restore();
	});
});
