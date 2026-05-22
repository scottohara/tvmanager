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
	let content: HTMLDivElement, applicationController: ApplicationController;

	beforeEach((): void => {
		content = document.createElement("div");
		content.id = "content";
		document.body.append(content);

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
				"pop",
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
			button: HTMLAnchorElement,
			startViewTransition: SinonStub;

		beforeEach((): void => {
			notices = document.createElement("div");
			notices.id = "notices";
			document.body.append(notices);

			sinon.stub(
				applicationController,
				"hideNotice" as keyof ApplicationController,
			);
			notice = { label: "<b>test-notice</b>" };

			startViewTransition = sinon
				.stub(document, "startViewTransition")
				.callsFake(
					(update: ViewTransitionUpdateCallback): ViewTransition =>
						({
							ready: Promise.resolve(),
							finished: Promise.resolve(update()),
						}) as unknown as ViewTransition,
				);
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

			it("should append the notice and show the notice container", (): void => {
				expect(startViewTransition).to.have.been.called;
				expect(noticeContainer.parentElement).to.equal(notices);
			});

			it("should mark the new notice as entering", (): Chai.Assertion =>
				expect(noticeContainer.classList.contains("entering")).to.be.true);
		});

		describe("with a previously entering notice", (): void => {
			let previousNotice: HTMLDivElement;

			beforeEach((): void => {
				previousNotice = document.createElement("div");
				previousNotice.classList.add("notice", "entering");
				notices.append(previousNotice);
				applicationController.showNotice(notice);
			});

			it("should strip entering from the previous notice", (): Chai.Assertion =>
				expect(previousNotice.classList.contains("entering")).to.be.false);
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

		describe("when the view transition is skipped", (): void => {
			let unhandledRejection: SinonSpy;

			beforeEach(async (): Promise<void> => {
				unhandledRejection = sinon.spy();
				window.addEventListener("unhandledrejection", unhandledRejection);
				startViewTransition.callsFake(
					(): ViewTransition =>
						({
							ready: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
							finished: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
						}) as unknown as ViewTransition,
				);
				applicationController.showNotice(notice);
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			afterEach((): void =>
				window.removeEventListener("unhandledrejection", unhandledRejection),
			);

			it("should ignore skipped transitions", (): Chai.Assertion =>
				expect(unhandledRejection).to.not.have.been.called);
		});

		afterEach((): void => {
			notices.remove();
			startViewTransition.restore();
		});
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
		let nowLoading: HTMLDivElement,
			callback: SinonSpy,
			startViewTransition: SinonStub,
			controller: TestController,
			viewContentShown: SinonStub;

		beforeEach((): void => {
			nowLoading = document.createElement("div");
			nowLoading.id = "nowLoading";
			document.body.append(nowLoading);

			sinon.stub(
				applicationController,
				"setHeader" as keyof ApplicationController,
			);

			controller = new TestController();
			viewContentShown = sinon.stub();
			Object.defineProperty(controller, "contentShown", {
				value: viewContentShown,
			});
			applicationController.viewStack.push({ controller, scrollPos: 0 });

			startViewTransition = sinon
				.stub(document, "startViewTransition")
				.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.resolve(),
							finished: Promise.resolve(update?.()),
						}) as unknown as ViewTransition,
				);

			callback = sinon.spy();
		});

		describe("push", (): void => {
			beforeEach(
				async (): Promise<void> =>
					applicationController["show"](callback, {} as ViewControllerArgs),
			);

			it("should call startViewTransition with the push type", (): Chai.Assertion =>
				expect(startViewTransition).to.have.been.calledWithMatch({
					types: ["push"],
				}));
			it("should load the view template", (): Chai.Assertion =>
				expect(content.innerHTML).to.equal("<div></div>\n"));
			it("should invoke the callback", (): Chai.Assertion =>
				expect(callback).to.have.been.calledWith({}));
			it("should set the header", (): Chai.Assertion =>
				expect(applicationController["setHeader"]).to.have.been.called);
			it("should hide the now loading indicator", (): Chai.Assertion =>
				expect(nowLoading.classList.contains("loading")).to.be.false);
			it("should call contentShown on the view controller", (): Chai.Assertion =>
				expect(viewContentShown).to.have.been.called);
		});

		describe("pop", (): void => {
			beforeEach(
				async (): Promise<void> =>
					applicationController["show"](
						callback,
						{} as ViewControllerArgs,
						"pop",
					),
			);

			it("should call startViewTransition with the pop type", (): Chai.Assertion =>
				expect(startViewTransition).to.have.been.calledWithMatch({
					types: ["pop"],
				}));
		});

		describe("when the view transition's ready promise is skipped", (): void => {
			let unhandledRejection: SinonSpy;

			beforeEach(async (): Promise<void> => {
				unhandledRejection = sinon.spy();
				window.addEventListener("unhandledrejection", unhandledRejection);
				startViewTransition.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
							finished: Promise.resolve(update?.()),
						}) as unknown as ViewTransition,
				);

				await applicationController["show"](callback, {} as ViewControllerArgs);
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			afterEach((): void =>
				window.removeEventListener("unhandledrejection", unhandledRejection),
			);

			it("should ignore skipped transitions", (): Chai.Assertion =>
				expect(unhandledRejection).to.not.have.been.called);
		});

		describe("when the view transition's finished promise is skipped", (): void => {
			let unhandledRejection: SinonSpy;

			beforeEach(async (): Promise<void> => {
				unhandledRejection = sinon.spy();
				window.addEventListener("unhandledrejection", unhandledRejection);
				startViewTransition.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.resolve(update?.()),
							finished: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
						}) as unknown as ViewTransition,
				);

				await applicationController["show"](callback, {} as ViewControllerArgs);
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			afterEach((): void =>
				window.removeEventListener("unhandledrejection", unhandledRejection),
			);

			it("should ignore skipped transitions", (): Chai.Assertion =>
				expect(unhandledRejection).to.not.have.been.called);
			it("should call contentShown on the view controller", (): Chai.Assertion =>
				expect(viewContentShown).to.have.been.called);
		});

		describe("when the view transition's finished promise rejects with a non-AbortError DOMException", (): void => {
			let error: Error;

			beforeEach(async (): Promise<void> => {
				startViewTransition.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.resolve(update?.()),
							finished: Promise.reject(
								new DOMException("Invalid state", "InvalidStateError"),
							),
						}) as unknown as ViewTransition,
				);

				await applicationController["show"](
					callback,
					{} as ViewControllerArgs,
				).catch((e: unknown): Error => (error = e as Error));
			});

			it("should throw the error", (): void => {
				expect(error).to.be.an.instanceOf(DOMException);
				expect((error as DOMException).name).to.equal("InvalidStateError");
			});
			it("should not call contentShown on the view controller", (): Chai.Assertion =>
				expect(viewContentShown).to.not.have.been.called);
		});

		describe("when the view transition's finished promise rejects with a non-DOMException error", (): void => {
			let error: Error;

			beforeEach(async (): Promise<void> => {
				startViewTransition.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.resolve(update?.()),
							finished: Promise.reject(new Error("transition failed")),
						}) as unknown as ViewTransition,
				);

				await applicationController["show"](
					callback,
					{} as ViewControllerArgs,
				).catch((e: unknown): Error => (error = e as Error));
			});

			it("should throw the error", (): void => {
				expect(error).to.be.an.instanceOf(Error);
				expect(error.message).to.equal("transition failed");
			});
			it("should not call contentShown on the view controller", (): Chai.Assertion =>
				expect(viewContentShown).to.not.have.been.called);
		});

		describe("when the view update fails", (): void => {
			let error: Error;

			beforeEach(async (): Promise<void> => {
				callback = sinon.stub().rejects(new Error("view transition failed"));

				await applicationController["show"](
					callback,
					{} as ViewControllerArgs,
				).catch((e: unknown): Error => (error = e as Error));
			});

			it("should hide the now loading indicator", (): Chai.Assertion =>
				expect(nowLoading.classList.contains("loading")).to.be.false);
			it("should throw an error", (): void => {
				expect(error).to.be.an.instanceOf(Error);
				expect(error.message).to.equal("view transition failed");
			});
			it("should not call contentShown on the view controller", (): Chai.Assertion =>
				expect(viewContentShown).to.not.have.been.called);
		});

		afterEach((): void => {
			nowLoading.remove();
			startViewTransition.restore();
		});
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
			otherNotice: HTMLDivElement,
			startViewTransition: SinonStub;

		beforeEach((): void => {
			notices = document.createElement("div");
			notices.id = "notices";

			notice = document.createElement("div");
			otherNotice = document.createElement("div");
			otherNotice.classList.add("notice", "entering");

			notices.append(notice, otherNotice);
			document.body.append(notices);

			startViewTransition = sinon
				.stub(document, "startViewTransition")
				.callsFake(
					({ update }: StartViewTransitionOptions): ViewTransition =>
						({
							ready: Promise.resolve(update?.()),
							finished: Promise.resolve(),
						}) as unknown as ViewTransition,
				);

			applicationController["hideNotice"](notice);
		});

		it("should mark the notice as leaving", (): Chai.Assertion =>
			expect(notice.classList.contains("leaving")).to.be.true);
		it("should start a view transition of type hide-notice", (): Chai.Assertion =>
			expect(startViewTransition).to.have.been.calledWithMatch({
				types: ["hide-notice"],
			}));
		it("should remove the notice from the DOM", (): Chai.Assertion =>
			expect(notices.children.length).to.equal(1));
		it("should keep the other notice in the DOM", (): Chai.Assertion =>
			expect(notices.firstElementChild).to.equal(otherNotice));
		it("should strip entering from the remaining notice", (): Chai.Assertion =>
			expect(otherNotice.classList.contains("entering")).to.be.false);

		describe("when the view transition is skipped", (): void => {
			let unhandledRejection: SinonSpy;

			beforeEach(async (): Promise<void> => {
				unhandledRejection = sinon.spy();
				window.addEventListener("unhandledrejection", unhandledRejection);
				startViewTransition.callsFake(
					(): ViewTransition =>
						({
							ready: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
							finished: Promise.reject(
								new DOMException("Transition was skipped", "AbortError"),
							),
						}) as unknown as ViewTransition,
				);
				applicationController["hideNotice"](notice);
				await new Promise<void>((resolve): void => {
					window.setTimeout(resolve, 0);
				});
			});

			afterEach((): void =>
				window.removeEventListener("unhandledrejection", unhandledRejection),
			);

			it("should ignore skipped transitions", (): Chai.Assertion =>
				expect(unhandledRejection).to.not.have.been.called);
		});

		afterEach((): void => {
			notices.remove();
			startViewTransition.restore();
		});
	});

	afterEach((): void => content.remove());
});
