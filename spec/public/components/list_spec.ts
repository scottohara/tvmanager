import type {
	ListAction,
	ListItem
} from "components";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import List from "../../../src/components/list";
import ListTemplate from "views/listTemplate.html";
import type { SinonStub } from "sinon";
import TestController from "mocks/test-controller";
import type { View } from "controllers";
import WindowMock from "mocks/window-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("List", (): void => {
	const validActions: ListAction[] = ["view", "edit", "delete"];

	let container: string,
			itemTemplate: string,
			groupBy: string,
			items: ListItem[],
			eventHandler: SinonStub,
			action: ListAction,
			containerElement: JQuery,
			list: List;

	beforeEach((): void => {
		container = "list";
		itemTemplate = ListTemplate;
		groupBy = "name";
		items = [
			// Object create is used to set a prototype, so we can test that the template correctly ignores inherited properties
			Object.create({ inheritedProperty: "ignore me" }, {
				name: { enumerable: true, value: "group-one" },
				value: { enumerable: true, value: "item-one" }
			}),
			{
				name: "group-one",
				value: "item-two"
			},
			{
				name: "group-two",
				value: "item-three"
			}
		] as ListItem[];
		eventHandler = sinon.stub();
		action = "view";

		containerElement = $("<ul>")
			.attr("id", container)
			.height(100)
			.css("overflow-y", "scroll")
			.css("margin", 0)
			.hide()
			.appendTo(document.body);

		list = new List(container, itemTemplate, groupBy, items, eventHandler, eventHandler, eventHandler);
	});

	describe("object constructor", (): void => {
		it("should return a List instance", (): Chai.Assertion => list.should.be.an.instanceOf(List));
		it("should set the container", (): Chai.Assertion => list["container"].should.equal(container));
		it("should set the item template", (): Chai.Assertion => list["itemTemplate"].should.equal(itemTemplate));
		it("should set the group by", (): Chai.Assertion => (list["groupBy"] as string).should.equal(groupBy));
		it("should set the list items", (): Chai.Assertion => list.items.should.deep.equal(items));
		it("should attach a view event handler", (): Chai.Assertion => list["viewEventHandler"].should.equal(eventHandler));
		it("should attach an edit event handler", (): Chai.Assertion => (list["editEventHandler"] as SinonStub).should.equal(eventHandler));
		it("should attach a delete event handler", (): Chai.Assertion => (list["deleteEventHandler"] as SinonStub).should.equal(eventHandler));
		it("should set the action", (): Chai.Assertion => (list["action"] as ListAction).should.equal(action));
	});

	describe("refresh", (): void => {
		let renderHtml: string,
				tap: SinonStub;

		describe("without grouping", (): void => {
			beforeEach((): void => {
				renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li><ul id=\"index\"></ul>";
				list = new List(container, itemTemplate, null, items, eventHandler, eventHandler, eventHandler);
				tap = sinon.stub(list, "tap" as keyof List);
				list.refresh();
			});

			it("should render the list", (): Chai.Assertion => containerElement.html().should.equal(renderHtml));

			it("should attach a click handler to each item", (): void => {
				$(`#${container} li:not([id])`).each((index: number, element: HTMLElement): void => {
					$(element).trigger("click");
					tap.should.have.been.calledWith(index);
				});
				tap.callCount.should.equal(3);
			});
		});

		describe("with grouping", (): void => {
			beforeEach((): void => {
				renderHtml = "<li id=\"group-one\" class=\"group\">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id=\"group-two\" class=\"group\">group-two</li><li><a>group-two:item-three</a></li><ul id=\"index\"><li>group-one</li><li>group-two</li></ul>";
				tap = sinon.stub(list, "tap" as keyof List);
				list.refresh();
			});

			it("should render the list", (): Chai.Assertion => containerElement.html().should.equal(renderHtml));

			it("should attach a click handler to each item", (): void => {
				$(`#${container} > li:not([id])`).each((index: number, element: HTMLElement): void => {
					$(element).trigger("click");
					tap.should.have.been.calledWith(index);
				});
				tap.callCount.should.equal(3);
			});
		});

		describe("index", (): void => {
			let index: JQuery,
					event: JQuery.Event,
					scrollIntoView: SinonStub;

			beforeEach((): void => {
				list.refresh();
				index = $("#index");
				scrollIntoView = sinon.stub($("#group-one").get(0), "scrollIntoView");
				event = new $.Event("pointermove");
			});

			describe("without active button state", (): void => {
				beforeEach((): JQuery => index.trigger(event));
				it("should do nothing", (): Chai.Assertion => scrollIntoView.should.not.have.been.called);
			});

			describe("with active button state", (): void => {
				let elementFromPoint: SinonStub,
						element: JQuery;

				beforeEach((): void => {
					event.buttons = 1;
					elementFromPoint = sinon.stub(document, "elementFromPoint");
					element = $("<li>").text("group-one");
				});

				describe("no element at point", (): void => {
					beforeEach((): void => {
						elementFromPoint.returns(null);
						index.trigger(event);
					});

					it("should do nothing", (): Chai.Assertion => scrollIntoView.should.not.have.been.called);
				});

				describe("element not within index", (): void => {
					beforeEach((): void => {
						element.appendTo(document.body);
						elementFromPoint.returns(element.get(0));
						index.trigger(event);
					});

					it("should do nothing", (): Chai.Assertion => scrollIntoView.should.not.have.been.called);
				});

				describe("element within index", (): void => {
					beforeEach((): void => {
						element.appendTo(index);
						elementFromPoint.returns(element.get(0));
						index.trigger(event);
					});

					it("should scroll the corresponding group into view", (): Chai.Assertion => scrollIntoView.should.have.been.calledWith(true));
				});

				afterEach((): void => {
					elementFromPoint.restore();
					element.remove();
				});
			});
		});
	});

	describe("showIndex", (): void => {
		let index: JQuery;

		beforeEach((): void => {
			index = $("<ul>")
				.attr("id", "index")
				.css("display", "none")
				.appendTo(document.body);

			list.showIndex();
		});

		it("should show the index", (): Chai.Assertion => index.css("display").should.equal("block"));

		afterEach((): JQuery => index.remove());
	});

	describe("hideIndex", (): void => {
		let index: JQuery;

		beforeEach((): void => {
			index = $("<ul>")
				.attr("id", "index")
				.css("display", "block")
				.appendTo(document.body);

			list.hideIndex();
		});

		it("should hide the index", (): Chai.Assertion => index.css("display").should.equal("none"));

		afterEach((): JQuery => index.remove());
	});

	describe("scrollTo", (): void => {
		const BODY_PADDING = 8;

		beforeEach((): void => {
			for (let i = 0; i < 10; i++) {
				$("<li>")
					.attr("id", i)
					.height(20)
					.appendTo(containerElement);
			}

			containerElement.show();
			containerElement.scrollTop(40);

			appController.viewStack = [{ controller: new TestController(), scrollPos: 40 }];
			appController.setScrollPosition.reset();
		});

		describe("item above view", (): void => {
			beforeEach((): void => list.scrollTo("1"));

			it("should update the scroll position", (): Chai.Assertion => (appController.viewStack.pop() as View).scrollPos.should.equal(20 + BODY_PADDING));
			it("should set the scroll position", (): Chai.Assertion => appController.setScrollPosition.should.have.been.called);
		});

		describe("item in view", (): void => {
			beforeEach((): void => list.scrollTo("5"));

			it("should not update the scroll position", (): Chai.Assertion => (appController.viewStack.pop() as View).scrollPos.should.equal(40));
			it("should not set the scroll position", (): Chai.Assertion => appController.setScrollPosition.should.not.have.been.called);
		});

		describe("item below view", (): void => {
			beforeEach((): void => list.scrollTo("8"));

			it("should update the scroll position", (): Chai.Assertion => (appController.viewStack.pop() as View).scrollPos.should.equal(80 + BODY_PADDING));
			it("should set the scroll position", (): Chai.Assertion => appController.setScrollPosition.should.have.been.called);
		});
	});

	describe("setAction", (): void => {
		beforeEach((): void => {
			appController.getScrollPosition.reset();
			list["action"] = undefined;
		});

		validActions.forEach((validAction: ListAction): void => {
			describe(validAction, (): void => {
				beforeEach((): void => list.setAction(validAction));

				it("should set the action", (): Chai.Assertion => (list["action"] as ListAction).should.equal(validAction));

				if ("view" === validAction) {
					it("should not save the scroll position", (): Chai.Assertion => appController.getScrollPosition.should.not.have.been.called);
				} else {
					it("should save the scroll position", (): Chai.Assertion => appController.getScrollPosition.should.have.been.called);
				}

				it("should not show an alert", (): Chai.Assertion => WindowMock.alert.should.not.have.been.called);
			});
		});

		describe("invalid action", (): void => {
			beforeEach((): void => list.setAction("invalid" as ListAction));
			it("should not save the scroll position", (): Chai.Assertion => appController.getScrollPosition.should.not.have.been.called);
			it("should show an alert", (): Chai.Assertion => WindowMock.alert.should.have.been.calledWith("invalid is not a valid action"));
			it("should not set the action", (): Chai.Assertion => (undefined === list["action"]).should.be.true);
		});
	});

	describe("tap", (): void => {
		let viewEventHandler: SinonStub,
				editEventHandler: SinonStub | null | undefined,
				deleteEventHandler: SinonStub | undefined;

		beforeEach((): void => {
			viewEventHandler = sinon.stub();
			WindowMock.confirm.resetHistory();
			editEventHandler = undefined;
			deleteEventHandler = undefined;
		});

		validActions.forEach((validAction: ListAction): void => {
			describe(validAction, (): void => {
				if ("view" !== validAction) {
					describe("without event handler", (): void => {
						beforeEach((): void => {
							list = new List(container, itemTemplate, groupBy, items, viewEventHandler, editEventHandler, deleteEventHandler);
							list["action"] = validAction;
							list["tap"](0);
						});

						it("should not trigger a confirm prompt", (): Chai.Assertion => WindowMock.confirm.should.not.have.been.called);
						it("should not trigger the event handler", (): Chai.Assertion => eventHandler.should.not.have.been.called);
					});
				}

				describe("with event handler", (): void => {
					beforeEach((): void => {
						editEventHandler = sinon.stub();
						deleteEventHandler = sinon.stub();
					});

					if ("delete" === validAction) {
						describe("confirmed", (): void => {
							beforeEach((): void => {
								WindowMock.confirm.returns(true);
								list["action"] = validAction;
								list["tap"](0);
							});

							it("should trigger a confirm prompt", (): Chai.Assertion => WindowMock.confirm.should.have.been.calledWith("Delete this item?"));
							it("should trigger the event handler", (): Chai.Assertion => eventHandler.should.have.been.called);
						});

						describe("aborted", (): void => {
							beforeEach((): void => {
								WindowMock.confirm.returns(false);
								list["action"] = validAction;
								list["tap"](0);
							});

							it("should trigger a confirm prompt", (): Chai.Assertion => WindowMock.confirm.should.have.been.calledWith("Delete this item?"));
							it("should not trigger the event handler", (): Chai.Assertion => eventHandler.should.not.have.been.called);
						});
					} else {
						beforeEach((): void => {
							list["action"] = validAction;
							list["tap"](0);
						});

						it("should not trigger a confirm prompt", (): Chai.Assertion => WindowMock.confirm.should.not.have.been.called);
						it("should trigger the event handler", (): Chai.Assertion => eventHandler.should.have.been.called);
					}
				});
			});
		});

		describe("invalid action", (): void => {
			beforeEach((): void => {
				list["action"] = undefined;
				list["tap"](0);
			});

			it("should not trigger a confirm prompt", (): Chai.Assertion => WindowMock.confirm.should.not.have.been.called);
			it("should not trigger the event handler", (): Chai.Assertion => eventHandler.should.not.have.been.called);
		});
	});

	afterEach((): JQuery => containerElement.remove());
});