import sinon, { SinonStub } from "sinon";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import List from "../../../src/components/list";
import { ListAction } from "components";
import ListTemplate from "views/listTemplate.html";
import TestController from "mocks/test-controller";
import { View } from "controllers";
import WindowMock from "mocks/window-mock";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("List", (): void => {
	const validActions: ListAction[] = ["view", "edit", "delete"];

	let container: string,
			itemTemplate: string,
			groupBy: string,
			items: object[],
			eventHandler: SinonStub,
			action: ListAction,
			containerElement: JQuery<HTMLElement>,
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
		];
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
		it("should attach an edit event handler", (): Chai.Assertion => (list["editEventHandler"] as Function).should.equal(eventHandler));
		it("should attach a delete event handler", (): Chai.Assertion => (list["deleteEventHandler"] as Function).should.equal(eventHandler));
		it("should set the action", (): Chai.Assertion => (list["action"] as ListAction).should.equal(action));
	});

	describe("refresh", (): void => {
		let renderHtml: string,
				tap: SinonStub;

		describe("without grouping", (): void => {
			beforeEach((): void => {
				renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
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
				renderHtml = "<li id=\"group-one\" class=\"group\">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id=\"group-two\" class=\"group\">group-two</li><li><a>group-two:item-three</a></li>";
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
	});

	afterEach((): JQuery<HTMLElement> => containerElement.remove());
});