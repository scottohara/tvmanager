import $ from "jquery";
import ApplicationController from "../../../src/controllers/application-controller";
import DatabaseController from "controllers/database-controller";
import Setting from "models/setting-model";
import SpinningWheel from "framework/sw/spinningwheel";
import TestController from "mocks/test-controller";
import sinon from "sinon";
import window from "components/window";

describe("ApplicationController", () => {
	let contentWrapper,
			content,
			abc,
			applicationController;

	beforeEach(() => {
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

		sinon.stub(ApplicationController.prototype, "contentShown");
		ApplicationController.prototype.singletonInstance = null;
		applicationController = new ApplicationController();
	});

	describe("object constructor", () => {
		it("should return an ApplicationController instance", () => applicationController.should.be.an.instanceOf(ApplicationController));
		it("should make the instance a singleton", () => applicationController.should.equal(ApplicationController.prototype.singletonInstance));
		it("should initialise the view stack", () => applicationController.viewStack.should.deep.equal([]));
		it("should initialise the notice stack", () => applicationController.noticeStack.should.deep.equal({height: 0, notice: []}));

		it("should attach a transition end event handler", () => {
			contentWrapper.trigger("transitionend");
			applicationController.contentShown.should.have.been.called;
		});

		it("should set the SpinningWheel cell height", () => SpinningWheel.cellHeight.should.equal(45));
		it("should create a scroll helper", () => applicationController.abc.element.should.deep.equal(abc.get(0)));
		it("should associate the scroll helper with the content", () => applicationController.abc.scrollElement.should.deep.equal($("#content")));
		it("should wrap the scroll helper in a touch event proxy", () => applicationController.abctoucheventproxy.element.should.deep.equal(abc.get(0)));

		describe("instance already exists", () => {
			let anotherApplicationController;

			beforeEach(() => (anotherApplicationController = new ApplicationController()));

			it("should return an ApplicationController instance", () => anotherApplicationController.should.be.an.instanceOf(ApplicationController));
			it("should be the same instance", () => anotherApplicationController.should.equal(applicationController));
		});
	});

	describe("start", () => {
		beforeEach(() => {
			sinon.stub(applicationController, "showNotice");
			sinon.stub(applicationController, "gotLastSyncTime");
			Setting.get.reset();
			Setting.get.withArgs("LastSyncTime").yields("1");
		});

		describe("error opening database", () => {
			beforeEach(() => {
				DatabaseController.mode = "Fail";
				applicationController.start();
			});

			it("should create the database controller", () => applicationController.db.name.should.equal("TVManager"));

			it("should display an error notice", () => applicationController.showNotice.should.have.been.calledWith({
				label: "Error",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should not set the database version", () => (Reflect.undefined === applicationController.db.version).should.be.true);
			it("should not set the max data age days", () => (Reflect.undefined === applicationController.maxDataAgeDays).should.be.true);
			it("should not get the last sync time", () => applicationController.gotLastSyncTime.should.not.have.been.called);
		});

		describe("database upgraded", () => {
			beforeEach(() => {
				DatabaseController.mode = "Upgrade";
				applicationController.start();
			});

			it("should create the database controller", () => applicationController.db.name.should.equal("TVManager"));

			it("should display a restart notice", () => applicationController.showNotice.should.have.been.calledWith({
				label: "Database has been successfully upgraded from version 1.0 to version 1.1. Please restart the application.",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));

			it("should set the database version", () => applicationController.db.version.should.equal("1.1"));
			it("should set the max data age days", () => applicationController.maxDataAgeDays.should.equal(7));
			it("should get the last sync time", () => applicationController.gotLastSyncTime.should.have.been.calledWith("1"));
		});

		describe("database opened", () => {
			beforeEach(() => {
				sinon.stub(applicationController, "pushView");
				DatabaseController.mode = null;
				applicationController.start();
			});

			it("should create the database controller", () => applicationController.db.name.should.equal("TVManager"));
			it("should load all view controllers", () => Object.keys(applicationController.viewControllers).length.should.equal(13));
			it("should display the schedule view", () => applicationController.pushView.should.have.been.calledWith("schedule"));
			it("should not display a notice", () => applicationController.showNotice.should.not.have.been.called);
			it("should set the database version", () => applicationController.db.version.should.equal("1.1"));
			it("should set the max data age days", () => applicationController.maxDataAgeDays.should.equal(7));
			it("should get the last sync time", () => applicationController.gotLastSyncTime.should.have.been.calledWith("1"));
		});
	});

	describe("pushView", () => {
		const testParams = [
			{
				description: "initial view",
				viewStack: []
			},
			{
				description: "subsequent view",
				viewStack: [{}]
			}
		];

		beforeEach(() => {
			sinon.stub(applicationController, "getScrollPosition");
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(applicationController, "clearHeader");
			sinon.stub(applicationController, "viewPushed");
			sinon.stub(applicationController, "show").yields();
			applicationController.viewControllers = {test: TestController};
		});

		let view;

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					applicationController.viewStack = params.viewStack;
					applicationController.pushView("test", {});
					view = applicationController.viewStack.pop();
				});

				if (params.viewStack.length > 0) {
					it("should get the scroll position", () => applicationController.getScrollPosition.should.have.been.called);
					it("should clear the footer", () => applicationController.clearFooter.should.have.been.called);
					it("should clear the header", () => applicationController.clearHeader.should.have.been.called);
				} else {
					it("should not get the scroll position", () => applicationController.getScrollPosition.should.not.have.been.called);
					it("should not clear the footer", () => applicationController.clearFooter.should.not.have.been.called);
					it("should not clear the header", () => applicationController.clearHeader.should.not.have.been.called);
				}

				it("should push the view onto the view stack", () => {
					view.controller.should.be.an.instanceOf(TestController);
					view.scrollPos.should.equal(0);
				});

				it("should instantiate the view controller", () => view.controller.args.should.deep.equal({}));

				it("should display the view", () => {
					applicationController.show.should.have.been.called;
					applicationController.viewPushed.should.have.been.called;
				});
			});
		});
	});

	describe("viewPushed", () => {
		let setup;

		beforeEach(() => {
			setup = sinon.stub();
			sinon.stub(applicationController, "setHeader");
			applicationController.viewStack.push({controller: {setup}});
			applicationController.viewPushed();
		});

		it("should setup the view controller", () => setup.should.have.been.called);
		it("should set the header", () => applicationController.setHeader.should.have.been.called);
		it("should indicate that the view has loaded after 1s", () => applicationController.contentShown.should.have.been.called);
	});

	describe("popView", () => {
		beforeEach(() => {
			sinon.stub(applicationController, "clearFooter");
			sinon.stub(applicationController, "clearHeader");
			sinon.stub(applicationController, "viewPopped");
			sinon.stub(applicationController, "show").yields({});
			applicationController.viewStack = [{}];
			applicationController.popView({});
		});

		it("should clear the footer", () => applicationController.clearFooter.should.have.been.called);
		it("should clear the header", () => applicationController.clearHeader.should.have.been.called);
		it("should pop the view off the view stack", () => applicationController.viewStack.should.be.empty);
		it("should display the previous view", () => {
			applicationController.show.should.have.been.calledWith(sinon.match.func, {});
			applicationController.viewPopped.should.have.been.calledWith({});
		});
	});

	describe("viewPopped", () => {
		let activate;

		beforeEach(() => {
			activate = sinon.stub();
			sinon.stub(applicationController, "setHeader");
			applicationController.viewStack.push({controller: {activate}});
			applicationController.viewPopped({});
		});

		it("should activate the view controller", () => activate.should.have.been.calledWith({}));
		it("should set the header", () => applicationController.setHeader.should.have.been.called);
		it("should indicate that the view has loaded after 1s", () => applicationController.contentShown.should.have.been.called);
	});

	describe("show", () => {
		let nowLoading,
				callback;

		beforeEach(() => {
			nowLoading = $("<div>")
				.attr("id", "nowLoading")
				.appendTo(document.body);

			sinon.stub(applicationController, "hideScrollHelper");
			applicationController.viewStack.push({controller: new TestController()});
			callback = sinon.spy();
			applicationController.show(callback, {});
		});

		it("should hide the scroll helper", () => applicationController.hideScrollHelper.should.have.been.called);
		it("should show the now loading indicator", () => nowLoading.hasClass("loading").should.be.true);
		it("should load the view template", () => content.html().should.equal("<div></div>"));
		it("should slide the new view in from the right", () => contentWrapper.hasClass("loading").should.be.true);
		it("should invoke the callback", () => callback.should.have.been.calledWith({}));

		afterEach(() => nowLoading.remove());
	});

	describe("getScrollPosition", () => {
		it("should save the current scroll position of the active view", () => {
			$("<div>")
				.height(50)
				.css("overflow-y", "scroll")
				.append($("<div>").height(100))
				.appendTo(content)
				.scrollTop(10);

			applicationController.viewStack.push({});
			applicationController.getScrollPosition();
			applicationController.viewStack.pop().scrollPos.should.equal(10);
		});
	});

	describe("setScrollPosition", () => {
		let scrollingElement;

		beforeEach(() => {
			scrollingElement = $("<div>")
				.height(50)
				.css("overflow-y", "scroll")
				.append($("<div>").height(100))
				.append($("<div>").height(100))
				.appendTo(content);
		});

		describe("scroll position is -1", () => {
			it("should scroll to the bottom", () => {
				applicationController.viewStack.push({scrollPos: -1});
				applicationController.setScrollPosition();
				scrollingElement.scrollTop().should.equal(100 + scrollingElement.position().top);
			});
		});

		describe("scoll position is not -1", () => {
			it("should restore the saved scroll position of the active view", () => {
				applicationController.viewStack.push({scrollPos: 20});
				applicationController.setScrollPosition();
				scrollingElement.scrollTop().should.equal(20);
			});
		});
	});

	describe("contentShown", () => {
		let nowLoading;

		beforeEach(() => {
			nowLoading = $("<div>")
				.attr("id", "nowLoading")
				.addClass("loading")
				.appendTo(document.body);

			applicationController.contentShown.restore();
		});

		describe("loading", () => {
			beforeEach(() => {
				contentWrapper.addClass("loading");
				applicationController.contentShown();
			});

			it("should unmark the content wrapper as loading", () => contentWrapper.hasClass("loading").should.be.false);
			it("should mark the content wrapper as loaded", () => contentWrapper.hasClass("loaded").should.be.true);
			it("should hide the now loading indicator", () => nowLoading.hasClass("loading").should.be.false);
		});

		describe("loaded", () => {
			it("should unmark the content wrapper as loaded", () => {
				contentWrapper.addClass("loaded");
				applicationController.contentShown();
				contentWrapper.hasClass("loaded").should.be.false;
			});
		});

		describe("unknown state", () => {
			it("should do nothing", () => {
				applicationController.contentShown();
				contentWrapper.hasClass("loading").should.be.false;
				contentWrapper.hasClass("loaded").should.be.false;
				nowLoading.hasClass("loading").should.be.true;
			});
		});

		afterEach(() => {
			nowLoading.remove();
			sinon.stub(ApplicationController.prototype, "contentShown");
		});
	});

	describe("setHeader", () => {
		let header,
				buttonConfig,
				button,
				label;

		beforeEach(() => {
			header = {};

			buttonConfig = {
				eventHandler: sinon.stub(),
				style: "testButton",
				label: "Test button"
			};

			button = $("<a>")
				.hide()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "headerLabel")
				.hide()
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight");
			applicationController.viewStack.push({controller: {header}});
		});

		describe("with left button", () => {
			beforeEach(() => {
				button.attr("id", "headerLeftButton");
				header.leftButton = buttonConfig;
				applicationController.setHeader();
			});

			it("should attach a click event handler", () => {
				button.trigger("click");
				buttonConfig.eventHandler.should.have.been.called;
			});

			it("should style the button", () => {
				button.hasClass("button").should.be.true;
				button.hasClass("header").should.be.true;
				button.hasClass("left").should.be.true;
				button.hasClass("testButton").should.be.true;
			});

			it("should set the button label", () => button.text().should.equal("Test button"));
			it("should show the button", () => button.css("display").should.not.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("without left button", () => {
			beforeEach(() => applicationController.setHeader());

			it("should not attach a click event handler", () => {
				button.trigger("click");
				buttonConfig.eventHandler.should.not.have.been.called;
			});

			it("should not style the button", () => {
				button.hasClass("button").should.be.false;
				button.hasClass("header").should.be.false;
				button.hasClass("left").should.be.false;
				button.hasClass("testButton").should.be.false;
			});

			it("should not set the button label", () => button.text().should.equal(""));
			it("should not show the button", () => button.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("with header label", () => {
			beforeEach(() => {
				header.label = "Test header";
				applicationController.setHeader();
			});

			it("should set the header label", () => label.text().should.equal("Test header"));
			it("should show the header label", () => label.css("display").should.not.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("without header label", () => {
			beforeEach(() => applicationController.setHeader());

			it("should not set the header label", () => label.text().should.equal(""));
			it("should not show the header label", () => label.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("with right button", () => {
			beforeEach(() => {
				button.attr("id", "headerRightButton");
				header.rightButton = buttonConfig;
				applicationController.setHeader();
			});

			it("should attach a click event handler", () => {
				button.trigger("click");
				buttonConfig.eventHandler.should.have.been.called;
			});

			it("should style the button", () => {
				button.hasClass("button").should.be.true;
				button.hasClass("header").should.be.true;
				button.hasClass("right").should.be.true;
				button.hasClass("testButton").should.be.true;
			});

			it("should set the button label", () => button.text().should.equal("Test button"));
			it("should show the button", () => button.css("display").should.not.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("without right button", () => {
			beforeEach(() => applicationController.setHeader());

			it("should not attach a click event handler", () => {
				button.trigger("click");
				buttonConfig.eventHandler.should.not.have.been.called;
			});

			it("should not style the button", () => {
				button.hasClass("button").should.be.false;
				button.hasClass("header").should.be.false;
				button.hasClass("right").should.be.false;
				button.hasClass("testButton").should.be.false;
			});

			it("should not set the button label", () => button.text().should.equal(""));
			it("should not show the button", () => button.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		afterEach(() => {
			button.remove();
			label.remove();
		});
	});

	describe("clearHeader", () => {
		let header,
				buttonConfig,
				leftButton,
				rightButton,
				label;

		beforeEach(() => {
			header = {};
			buttonConfig = {eventHandler: sinon.stub()};

			leftButton = $("<a>")
				.attr("id", "headerLeftButton")
				.on("click", buttonConfig.eventHandler)
				.show()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "headerRightButton")
				.on("click", buttonConfig.eventHandler)
				.show()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "headerLabel")
				.show()
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight");
			applicationController.viewStack.push({controller: {header}});
		});

		describe("with left button", () => {
			beforeEach(() => {
				header.leftButton = buttonConfig;
				applicationController.clearHeader();
			});

			it("should detach the click event handler", () => {
				leftButton.trigger("click");
				buttonConfig.eventHandler.should.not.have.been.called;
			});

			it("should hide the left button", () => leftButton.css("display").should.equal("none"));
			it("should hide the header label", () => label.css("display").should.equal("none"));
			it("should hide the right button", () => rightButton.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("without left button", () => {
			beforeEach(() => applicationController.clearHeader());

			it("should not detach the click event handler", () => {
				leftButton.trigger("click");
				buttonConfig.eventHandler.should.have.been.called;
			});

			it("should hide the left button", () => leftButton.css("display").should.equal("none"));
			it("should hide the header label", () => label.css("display").should.equal("none"));
			it("should hide the right button", () => rightButton.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("with right button", () => {
			beforeEach(() => {
				header.rightButton = buttonConfig;
				applicationController.clearHeader();
			});

			it("should detach the click event handler", () => {
				rightButton.trigger("click");
				buttonConfig.eventHandler.should.not.have.been.called;
			});

			it("should hide the left button", () => leftButton.css("display").should.equal("none"));
			it("should hide the header label", () => label.css("display").should.equal("none"));
			it("should hide the right button", () => rightButton.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("without right button", () => {
			beforeEach(() => applicationController.clearHeader());

			it("should not detach the click event handler", () => {
				rightButton.trigger("click");
				buttonConfig.eventHandler.should.have.been.called;
			});

			it("should hide the left button", () => leftButton.css("display").should.equal("none"));
			it("should hide the header label", () => label.css("display").should.equal("none"));
			it("should hide the right button", () => rightButton.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		afterEach(() => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("setFooter", () => {
		let footer,
				buttonConfig,
				button,
				label;

		beforeEach(() => {
			footer = {};

			buttonConfig = {
				eventHandler: sinon.stub(),
				style: "testButton",
				label: "Test button"
			};

			button = $("<a>")
				.hide()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "footerLabel")
				.hide()
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight");
		});

		describe("without footer", () => {
			beforeEach(() => {
				applicationController.viewStack.push({controller: {}});
				applicationController.setFooter();
			});

			it("should not show the footer label", () => label.css("display").should.equal("none"));
			it("should not update the content height", () => applicationController.setContentHeight.should.not.have.been.called);
		});

		describe("with footer", () => {
			beforeEach(() => applicationController.viewStack.push({controller: {footer}}));

			describe("with left button", () => {
				beforeEach(() => {
					button.attr("id", "footerLeftButton");
					footer.leftButton = buttonConfig;
					applicationController.setFooter();
				});

				it("should attach a click event handler", () => {
					button.trigger("click");
					buttonConfig.eventHandler.should.have.been.called;
				});

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("footer").should.be.true;
					button.hasClass("left").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
				it("should show the button", () => button.css("display").should.not.equal("none"));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("without left button", () => {
				beforeEach(() => applicationController.setFooter());

				it("should not attach a click event handler", () => {
					button.trigger("click");
					buttonConfig.eventHandler.should.not.have.been.called;
				});

				it("should not style the button", () => {
					button.hasClass("button").should.be.false;
					button.hasClass("footer").should.be.false;
					button.hasClass("left").should.be.false;
					button.hasClass("testButton").should.be.false;
				});

				it("should not set the button label", () => button.text().should.equal(""));
				it("should not show the button", () => button.css("display").should.equal("none"));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("with footer label", () => {
				beforeEach(() => {
					footer.label = "Test footer";
					applicationController.setFooter();
				});

				it("should set the footer label", () => label.text().should.equal("Test footer"));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("without footer label", () => {
				beforeEach(() => applicationController.setFooter());

				it("should not set the footer label", () => label.text().should.equal(""));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("with right button", () => {
				beforeEach(() => {
					button.attr("id", "footerRightButton");
					footer.rightButton = buttonConfig;
					applicationController.setFooter();
				});

				it("should attach a click event handler", () => {
					button.trigger("click");
					buttonConfig.eventHandler.should.have.been.called;
				});

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("footer").should.be.true;
					button.hasClass("right").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
				it("should show the button", () => button.css("display").should.not.equal("none"));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("without right button", () => {
				beforeEach(() => applicationController.setFooter());

				it("should not attach a click event handler", () => {
					button.trigger("click");
					buttonConfig.eventHandler.should.not.have.been.called;
				});

				it("should not style the button", () => {
					button.hasClass("button").should.be.false;
					button.hasClass("footer").should.be.false;
					button.hasClass("right").should.be.false;
					button.hasClass("testButton").should.be.false;
				});

				it("should not set the button label", () => button.text().should.equal(""));
				it("should not show the button", () => button.css("display").should.equal("none"));
				it("should show the footer label", () => label.css("display").should.not.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});
		});

		afterEach(() => {
			button.remove();
			label.remove();
		});
	});

	describe("clearFooter", () => {
		let footer,
				buttonConfig,
				leftButton,
				rightButton,
				label;

		beforeEach(() => {
			footer = {};
			buttonConfig = {eventHandler: sinon.stub()};

			leftButton = $("<a>")
				.attr("id", "footerLeftButton")
				.on("click", buttonConfig.eventHandler)
				.show()
				.appendTo(document.body);

			rightButton = $("<a>")
				.attr("id", "footerRightButton")
				.on("click", buttonConfig.eventHandler)
				.show()
				.appendTo(document.body);

			label = $("<h1>")
				.attr("id", "footerLabel")
				.show()
				.val("Test footer")
				.appendTo(document.body);

			sinon.stub(applicationController, "setContentHeight");
		});

		describe("without footer", () => {
			beforeEach(() => {
				applicationController.viewStack.push({controller: {}});
				applicationController.clearFooter();
			});

			it("should hide the left button", () => leftButton.css("display").should.equal("none"));
			it("should clear the footer label", () => label.val().should.equal(""));
			it("should hide the footer label", () => label.css("display").should.equal("none"));
			it("should hide the right button", () => rightButton.css("display").should.equal("none"));
			it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
		});

		describe("with footer", () => {
			beforeEach(() => applicationController.viewStack.push({controller: {footer}}));

			describe("with left button", () => {
				beforeEach(() => {
					footer.leftButton = buttonConfig;
					applicationController.clearFooter();
				});

				it("should detach the click event handler", () => {
					leftButton.trigger("click");
					buttonConfig.eventHandler.should.not.have.been.called;
				});

				it("should hide the left button", () => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", () => label.val().should.equal(""));
				it("should hide the footer label", () => label.css("display").should.equal("none"));
				it("should hide the right button", () => rightButton.css("display").should.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("without left button", () => {
				beforeEach(() => applicationController.clearFooter());

				it("should not detach the click event handler", () => {
					leftButton.trigger("click");
					buttonConfig.eventHandler.should.have.been.called;
				});

				it("should hide the left button", () => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", () => label.val().should.equal(""));
				it("should hide the footer label", () => label.css("display").should.equal("none"));
				it("should hide the right button", () => rightButton.css("display").should.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("with right button", () => {
				beforeEach(() => {
					footer.rightButton = buttonConfig;
					applicationController.clearFooter();
				});

				it("should detach the click event handler", () => {
					rightButton.trigger("click");
					buttonConfig.eventHandler.should.not.have.been.called;
				});

				it("should hide the left button", () => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", () => label.val().should.equal(""));
				it("should hide the footer label", () => label.css("display").should.equal("none"));
				it("should hide the right button", () => rightButton.css("display").should.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});

			describe("without right button", () => {
				beforeEach(() => applicationController.clearFooter());

				it("should not detach the click event handler", () => {
					rightButton.trigger("click");
					buttonConfig.eventHandler.should.have.been.called;
				});

				it("should hide the left button", () => leftButton.css("display").should.equal("none"));
				it("should clear the footer label", () => label.val().should.equal(""));
				it("should hide the footer label", () => label.css("display").should.equal("none"));
				it("should hide the right button", () => rightButton.css("display").should.equal("none"));
				it("should update the content height", () => applicationController.setContentHeight.should.have.been.called);
			});
		});

		afterEach(() => {
			leftButton.remove();
			rightButton.remove();
			label.remove();
		});
	});

	describe("setContentHeight", () => {
		it("should set the height of the content area minus the header and footer", () => {
			const header = $("<div>")
							.attr("id", "header")
							.appendTo(document.body)
							.outerHeight(20),
						footer = $("<div>")
							.attr("id", "footer")
							.appendTo(document.body)
							.outerHeight(10),
						scrollingElement = $("<div>")
							.appendTo(content);

			window.innerHeight = 50;
			applicationController.setContentHeight();
			scrollingElement.outerHeight().should.equal(20);
			header.remove();
			footer.remove();
		});
	});

	describe("showNotice", () => {
		let notices,
				notice,
				buttonConfig,
				eventHandler,
				noticeContainer,
				button;

		beforeEach(() => {
			notices = $("<div>")
				.attr("id", "notices")
				.css("position", "absolute")
				.css("visibility", "hidden")
				.css("top", "0px")
				.appendTo(document.body);

			buttonConfig = {
				style: "testButton",
				label: "Test button"
			};

			sinon.stub(applicationController, "noticesMoved");
			sinon.stub(applicationController, "hideNotice");
			notice = {label: "<b>test-notice</b>"};
			eventHandler = sinon.stub();
			applicationController.noticeStack = {notice: []};
			window.innerHeight = 1;
			$.fx.off = true;
		});

		it("should create a new notice", () => {
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");

			noticeContainer.length.should.equal(1);
			noticeContainer.html().should.equal("<a></a><p><b>test-notice</b></p><a></a>");
		});

		describe("with left button", () => {
			beforeEach(() => (notice.leftButton = buttonConfig));

			describe("with custom event handler", () => {
				beforeEach(() => {
					buttonConfig.eventHandler = eventHandler;
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:first");
					button.trigger("click");
				});

				it("should attach a custom click event handler", () => eventHandler.should.have.been.called);
				it("should attach a hide click event handler", () => applicationController.hideNotice.should.have.been.calledWith(sinon.match(value => value[0] === noticeContainer[0])));

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("left").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
			});

			describe("without custom event handler", () => {
				beforeEach(() => {
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:first");
					button.trigger("click");
				});

				it("should not attach a custom click event handler", () => eventHandler.should.not.have.been.called);
				it("should attach a hide click event handler", () => applicationController.hideNotice.should.have.been.calledWith(sinon.match(value => value[0] === noticeContainer[0])));

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("left").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
			});
		});

		describe("without left button", () => {
			beforeEach(() => {
				applicationController.showNotice(notice);
				noticeContainer = notices.children("div");
				button = noticeContainer.children("a:first");
				button.trigger("click");
			});

			it("should not attach a hide click event handler", () => applicationController.hideNotice.should.not.have.been.called);

			it("should not style the button", () => {
				button.hasClass("button").should.be.false;
				button.hasClass("left").should.be.false;
				button.hasClass("testButton").should.be.false;
			});

			it("should not set the button label", () => button.text().should.equal(""));
		});

		describe("with notice id", () => {
			it("should set the notice id", () => {
				notice.id = "test-notice";
				applicationController.showNotice(notice);
				notices.find("div p#test-notice").length.should.equal(1);
			});
		});

		describe("without notice id", () => {
			it("should not set the notice id", () => {
				applicationController.showNotice(notice);
				notices.find("div p#test-notice").length.should.equal(0);
			});
		});

		describe("with right button", () => {
			beforeEach(() => (notice.rightButton = buttonConfig));

			describe("with custom event handler", () => {
				beforeEach(() => {
					buttonConfig.eventHandler = eventHandler;
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:last");
					button.trigger("click");
				});

				it("should attach a custom click event handler", () => eventHandler.should.have.been.called);

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("right").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
			});

			describe("without custom event handler", () => {
				beforeEach(() => {
					applicationController.showNotice(notice);
					noticeContainer = notices.children("div");
					button = noticeContainer.children("a:last");
					button.trigger("click");
				});

				it("should not attach a custom click event handler", () => eventHandler.should.not.have.been.called);

				it("should style the button", () => {
					button.hasClass("button").should.be.true;
					button.hasClass("right").should.be.true;
					button.hasClass("testButton").should.be.true;
				});

				it("should set the button label", () => button.text().should.equal("Test button"));
			});
		});

		describe("without right button", () => {
			beforeEach(() => {
				applicationController.showNotice(notice);
				noticeContainer = notices.children("div");
				button = noticeContainer.children("a:last");
				button.trigger("click");
			});

			it("should not style the button", () => {
				button.hasClass("button").should.be.false;
				button.hasClass("right").should.be.false;
				button.hasClass("testButton").should.be.false;
			});

			it("should not set the button label", () => button.text().should.equal(""));
		});

		describe("initial notice", () => {
			beforeEach(() => applicationController.showNotice(notice));

			it("should position the notice stack off screen", () => notices.css("top").should.equal("1px"));
			it("should make the notice stack visible", () => notices.css("visibility").should.equal("visible"));
		});

		describe("subsequent notice", () => {
			beforeEach(() => {
				applicationController.noticeStack.notice.push({});
				applicationController.showNotice(notice);
			});

			it("should not position the notice stack off screen", () => notices.css("top").should.equal("0px"));
			it("should make the notice stack visible", () => notices.css("visibility").should.equal("hidden"));
		});

		it("should update the height of the notice stack to accomodate the new notice", () => {
			applicationController.noticeStack.height = 0;
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");
			applicationController.noticeStack.height.should.equal(-noticeContainer.height());
		});

		it("should push the notice onto the stack", () => {
			applicationController.showNotice(notice);
			noticeContainer = notices.children("div");
			applicationController.noticeStack.notice.pop()[0].should.equal(noticeContainer[0]);
		});

		describe("animation", () => {
			let windowHeight;

			beforeEach(done => {
				applicationController.noticesMoved.restore();
				sinon.stub(applicationController, "noticesMoved").callsFake(() => done());
				sinon.spy($.fn, "animate");
				applicationController.noticeStack.height = 0;
				windowHeight = $(window).height();
				applicationController.showNotice(notice);
			});

			it("should slide up the notices container to reveal the notice", () => {
				noticeContainer = notices.children("div");
				$.fn.animate.should.have.been.calledWith({top: windowHeight - noticeContainer.height()});
			});

			it("should invoke the completed callback", () => applicationController.noticesMoved.should.have.been.called);

			afterEach(() => $.fn.animate.restore());
		});

		afterEach(() => {
			notices.remove();
			$.fx.off = false;
		});
	});

	describe("hideNotice", () => {
		let notice;

		beforeEach(() => {
			sinon.stub(applicationController, "noticeHidden");
			applicationController.noticeStack = {height: 5};

			notice = {
				height: sinon.stub().returns(10),
				data: sinon.stub(),
				animate: sinon.stub().yields()
			};

			applicationController.hideNotice(notice);
		});

		it("should update the height of the notice stack to reclaim the space for the notice", () => applicationController.noticeStack.height.should.equal(15));
		it("should mark the notice as acknowledged", () => notice.data.should.have.been.calledWith("acknowledged", true));
		it("should slide down the notice to hide it", () => notice.animate.should.have.been.calledWith({height: 0}, sinon.match.func));
		it("should invoke the completed callback", () => applicationController.noticeHidden.should.have.been.called);
	});

	describe("noticeHidden", () => {
		let notices;

		beforeEach(done => {
			notices = $("<div>")
				.attr("id", "notices")
				.appendTo(document.body);

			sinon.stub(applicationController, "noticesMoved").callsFake(() => done());
			sinon.spy($.fn, "animate");
			$.fx.off = true;
			applicationController.noticeStack.height = 10;
			applicationController.noticeHidden();
		});

		it("should slide down the notices container to the height of the notice stack", () => {
			$.fn.animate.should.have.been.calledWith({top: "-=10"});
		});

		it("should invoke the completed callback", () => applicationController.noticesMoved.should.have.been.called);

		afterEach(() => {
			$.fn.animate.restore();
			notices.remove();
			$.fx.off = false;
		});
	});

	describe("noticesMoved", () => {
		const testParams = [
			{
				description: "all notices acknowledged",
				notices: [true, true, true],
				containerVisibility: "hidden"
			},
			{
				description: "some notices acknowledged",
				notices: [true, false, true],
				containerVisibility: "visible"
			}
		];

		let	data,
				remove,
				notices,
				acknowledged,
				unacknowledged;

		beforeEach(() => {
			notices = $("<div>")
				.attr("id", "notices")
				.css("visibility", "visible")
				.appendTo(document.body);
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					remove = sinon.stub();

					params.notices.forEach(noticeAcknowledged => {
						data = sinon.stub().withArgs("acknowledged").returns(noticeAcknowledged);
						applicationController.noticeStack.notice.push({data, remove});
					});

					acknowledged = params.notices.filter(notice => notice);
					unacknowledged = params.notices.filter(notice => !notice);
					applicationController.noticesMoved();
				});

				it("should remove any acknowledged notices from the DOM", () => remove.callCount.should.equal(acknowledged.length));
				it("should remove any acknowledged notices from the notice stack", () => applicationController.noticeStack.notice.length.should.equal(unacknowledged.length));
				it(`should ${"hidden" === params.containerVisibility ? "hide" : "not hide"} the notices container`, () => notices.css("visibility").should.equal(params.containerVisibility));
			});
		});

		afterEach(() => notices.remove());
	});

	describe("showScrollHelper", () => {
		it("should show the scroll helper", () => {
			applicationController.showScrollHelper();
			abc.css("display").should.not.equal("none");
		});
	});

	describe("hideScrollHelper", () => {
		it("should hide the scroll helper", () => {
			abc.css("display", "block");
			applicationController.hideScrollHelper();
			abc.css("display").should.equal("none");
		});
	});

	describe("gotLastSyncTime", () => {
		beforeEach(() => sinon.stub(applicationController, "showNotice"));

		describe("without last sync time", () => {
			it("should do nothing", () => {
				applicationController.gotLastSyncTime({});
				applicationController.showNotice.should.not.have.been.called;
			});
		});

		describe("with last sync time", () => {
			let clock,
					settingValue;

			beforeEach(() => {
				applicationController.maxDataAgeDays = 2;
				clock = sinon.useFakeTimers((new Date()).valueOf());
				settingValue = new Date() - (2 * 24 * 60 * 60 * 1000);
			});

			describe("younger than max data data age days", () => {
				it("should do nothing", () => {
					applicationController.gotLastSyncTime({settingValue});
					applicationController.showNotice.should.not.have.been.called;
				});
			});

			describe("older than max data age days", () => {
				beforeEach(() => (applicationController.maxDataAgeDays = 1));

				it("should display a sync notice", () => {
					applicationController.gotLastSyncTime({settingValue});
					applicationController.showNotice.should.have.been.calledWith({
						label: "The last data sync was over 1 days ago",
						leftButton: {
							style: "cautionButton",
							label: "OK"
						}
					});
				});
			});

			afterEach(() => clock.restore());
		});
	});

	afterEach(() => {
		contentWrapper.remove();
		abc.remove();
		ApplicationController.prototype.contentShown.restore();
	});
});