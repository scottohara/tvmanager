import type {
	ListAction,
	ListItem
} from "~/components";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import List from "./list";
import ListTemplate from "~/views/listTemplate.html";
import type { SinonStub } from "sinon";
import TestController from "~/mocks/test-controller";
import type { View } from "~/controllers";
import WindowMock from "~/mocks/window-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("List", (): void => {
	const validActions: ListAction[] = ["view", "edit", "delete"];

	let container: string,
			itemTemplate: string,
			groupBy: string,
			items: ListItem[],
			eventHandler: SinonStub,
			action: ListAction,
			containerElement: HTMLUListElement,
			list: List;

	beforeEach((): void => {
		container = "list";
		itemTemplate = ListTemplate;
		groupBy = "name";
		items = [
			// Object create is used to set a prototype, so we can test that the template correctly ignores inherited properties
			Object.create({ inheritedProperty: "ignore me" }, {
				id: { enumerable: true, value: "1" },
				name: { enumerable: true, value: "group-one" },
				value: { enumerable: true, value: "item-one" }
			}),
			{
				id: "2",
				name: "group-one",
				value: "item-two"
			},
			{
				id: "3",
				name: "group-two",
				value: "item-three"
			}
		] as ListItem[];
		eventHandler = sinon.stub();
		action = "view";

		containerElement = document.createElement("ul");
		containerElement.id = container;
		containerElement.style.height = "100px";
		containerElement.style.overflowY = "scroll";
		containerElement.style.margin = "0px";
		containerElement.style.display = "none";
		document.body.append(containerElement);

		list = new List(container, itemTemplate, groupBy, items, eventHandler, eventHandler, eventHandler);
	});

	describe("object constructor", (): void => {
		it("should return a List instance", (): Chai.Assertion => expect(list).to.be.an.instanceOf(List));
		it("should set the container", (): Chai.Assertion => expect(list["container"]).to.equal(container));
		it("should set the item template", (): Chai.Assertion => expect(list["itemTemplate"]).to.equal(itemTemplate));
		it("should set the group by", (): Chai.Assertion => expect(list["groupBy"] as string).to.equal(groupBy));
		it("should set the list items", (): Chai.Assertion => expect(list.items).to.deep.equal(items));
		it("should attach a view event handler", (): Chai.Assertion => expect(list["viewEventHandler"]).to.equal(eventHandler));
		it("should attach an edit event handler", (): Chai.Assertion => expect(list["editEventHandler"] as SinonStub).to.equal(eventHandler));
		it("should attach a delete event handler", (): Chai.Assertion => expect(list["deleteEventHandler"] as SinonStub).to.equal(eventHandler));
		it("should set the action", (): Chai.Assertion => expect(list["action"] as ListAction).to.equal(action));
	});

	describe("refresh", (): void => {
		let renderHtml: string,
				tap: SinonStub;

		describe("without grouping", (): void => {
			beforeEach((): void => {
				renderHtml = "<li><a id=\"item-1\">group-one:item-one</a></li><li><a id=\"item-2\">group-one:item-two</a></li><li><a id=\"item-3\">group-two:item-three</a></li><ul id=\"index\"></ul>";
				list = new List(container, itemTemplate, null, items, eventHandler, eventHandler, eventHandler);
				tap = sinon.stub(list, "tap" as keyof List);
				list.refresh();
			});

			it("should render the list", (): Chai.Assertion => expect(containerElement.innerHTML).to.equal(renderHtml));

			it("should attach a click handler to each item", (): void => {
				document.querySelectorAll(`#${container} li:not([id])`).forEach((element: HTMLLIElement, index: number): void => {
					element.dispatchEvent(new MouseEvent("click"));
					expect(tap).to.have.been.calledWith(index);
				});
				expect(tap.callCount).to.equal(3);
			});
		});

		describe("with grouping", (): void => {
			beforeEach((): void => {
				renderHtml = "<li id=\"group-group-one\" class=\"group\">group-one</li><li><a id=\"item-1\">group-one:item-one</a></li><li><a id=\"item-2\">group-one:item-two</a></li><li id=\"group-group-two\" class=\"group\">group-two</li><li><a id=\"item-3\">group-two:item-three</a></li><ul id=\"index\"><li>group-one</li><li>group-two</li></ul>";
				tap = sinon.stub(list, "tap" as keyof List);
				list.refresh();
			});

			it("should render the list", (): Chai.Assertion => expect(containerElement.innerHTML).to.equal(renderHtml));

			it("should attach a click handler to each item", (): void => {
				document.querySelectorAll(`#${container} > li:not([id])`).forEach((element: HTMLLIElement, index: number): void => {
					element.dispatchEvent(new MouseEvent("click"));
					expect(tap).to.have.been.calledWith(index);
				});
				expect(tap.callCount).to.equal(3);
			});
		});

		describe("index", (): void => {
			let event: MouseEvent,
					scrollIntoView: SinonStub;

			beforeEach((): void => {
				list.refresh();
				scrollIntoView = sinon.stub(document.querySelector("#group-group-one") as HTMLLIElement, "scrollIntoView");
			});

			it("should prevent the default touchstart behavour", (): void => {
				event = new MouseEvent("touchstart");

				const preventDefault = sinon.spy(event, "preventDefault");

				list["index"].dispatchEvent(event);
				expect(preventDefault).to.have.been.called;
			});

			describe("without active button state", (): void => {
				beforeEach((): void => {
					event = new PointerEvent("pointermove");
					list["index"].dispatchEvent(event);
				});

				it("should do nothing", (): Chai.Assertion => expect(scrollIntoView).to.not.have.been.called);
			});

			describe("with active button state", (): void => {
				let elementFromPoint: SinonStub,
						element: HTMLLIElement;

				beforeEach((): void => {
					event = new PointerEvent("pointermove", { buttons: 1 });
					elementFromPoint = sinon.stub(document, "elementFromPoint");
					element = document.createElement("li");
					element.textContent = "group-one";
				});

				describe("no element at point", (): void => {
					beforeEach((): void => {
						elementFromPoint.returns(null);
						list["index"].dispatchEvent(event);
					});

					it("should do nothing", (): Chai.Assertion => expect(scrollIntoView).to.not.have.been.called);
				});

				describe("element not within index", (): void => {
					beforeEach((): void => {
						document.body.append(element);
						elementFromPoint.returns(element);
						list["index"].dispatchEvent(event);
					});

					it("should do nothing", (): Chai.Assertion => expect(scrollIntoView).to.not.have.been.called);
				});

				describe("element within index", (): void => {
					beforeEach((): void => {
						list["index"].append(element);
						elementFromPoint.returns(element);
						list["index"].dispatchEvent(event);
					});

					it("should scroll the corresponding group into view", (): Chai.Assertion => expect(scrollIntoView).to.have.been.calledWith(true));
				});

				afterEach((): void => {
					elementFromPoint.restore();
					element.remove();
				});
			});
		});
	});

	describe("showIndex", (): void => {
		let index: HTMLUListElement;

		beforeEach((): void => {
			index = document.createElement("ul");
			index.id = "index";
			index.style.display = "none";
			document.body.append(index);
			list.showIndex();
		});

		it("should show the index", (): Chai.Assertion => expect(index.style.display).to.equal("block"));

		afterEach((): void => index.remove());
	});

	describe("hideIndex", (): void => {
		let index: HTMLUListElement;

		beforeEach((): void => {
			index = document.createElement("ul");
			index.id = "index";
			index.style.display = "block";
			document.body.append(index);
			list.hideIndex();
		});

		it("should hide the index", (): Chai.Assertion => expect(index.style.display).to.equal("none"));

		afterEach((): void => index.remove());
	});

	describe("scrollTo", (): void => {
		const BODY_PADDING = 8;

		beforeEach((): void => {
			for (let i = 0; i < 10; i++) {
				const item = document.createElement("li");

				item.id = `item-${i}`;
				item.style.height = "20px";
				containerElement.append(item);
			}

			containerElement.style.display = "block";
			containerElement.scrollTop = 40;

			appController.viewStack = [{ controller: new TestController(), scrollPos: 40 }];
			appController.setScrollPosition.reset();
		});

		describe("item above view", (): void => {
			beforeEach((): void => list.scrollTo("1"));

			it("should update the scroll position", (): Chai.Assertion => expect((appController.viewStack.pop() as View).scrollPos).to.equal(20 + BODY_PADDING));
			it("should set the scroll position", (): Chai.Assertion => expect(appController.setScrollPosition).to.have.been.called);
		});

		describe("item in view", (): void => {
			beforeEach((): void => list.scrollTo("5"));

			it("should not update the scroll position", (): Chai.Assertion => expect((appController.viewStack.pop() as View).scrollPos).to.equal(40));
			it("should not set the scroll position", (): Chai.Assertion => expect(appController.setScrollPosition).to.not.have.been.called);
		});

		describe("item below view", (): void => {
			beforeEach((): void => list.scrollTo("8"));

			it("should update the scroll position", (): Chai.Assertion => expect((appController.viewStack.pop() as View).scrollPos).to.equal(80 + BODY_PADDING));
			it("should set the scroll position", (): Chai.Assertion => expect(appController.setScrollPosition).to.have.been.called);
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

				it("should set the action", (): Chai.Assertion => expect(list["action"] as ListAction).to.equal(validAction));

				if ("view" === validAction) {
					it("should not save the scroll position", (): Chai.Assertion => expect(appController.getScrollPosition).to.not.have.been.called);
				} else {
					it("should save the scroll position", (): Chai.Assertion => expect(appController.getScrollPosition).to.have.been.called);
				}

				it("should not show an alert", (): Chai.Assertion => expect(WindowMock.alert).to.not.have.been.called);
			});
		});

		describe("invalid action", (): void => {
			beforeEach((): void => list.setAction("invalid" as ListAction));
			it("should not save the scroll position", (): Chai.Assertion => expect(appController.getScrollPosition).to.not.have.been.called);
			it("should show an alert", (): Chai.Assertion => expect(WindowMock.alert).to.have.been.calledWith("invalid is not a valid action"));
			it("should not set the action", (): Chai.Assertion => expect(list["action"]).to.be.undefined);
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

						it("should not trigger a confirm prompt", (): Chai.Assertion => expect(WindowMock.confirm).to.not.have.been.called);
						it("should not trigger the event handler", (): Chai.Assertion => expect(eventHandler).to.not.have.been.called);
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

							it("should trigger a confirm prompt", (): Chai.Assertion => expect(WindowMock.confirm).to.have.been.calledWith("Delete this item?"));
							it("should trigger the event handler", (): Chai.Assertion => expect(eventHandler).to.have.been.called);
						});

						describe("aborted", (): void => {
							beforeEach((): void => {
								WindowMock.confirm.returns(false);
								list["action"] = validAction;
								list["tap"](0);
							});

							it("should trigger a confirm prompt", (): Chai.Assertion => expect(WindowMock.confirm).to.have.been.calledWith("Delete this item?"));
							it("should not trigger the event handler", (): Chai.Assertion => expect(eventHandler).to.not.have.been.called);
						});
					} else {
						beforeEach((): void => {
							list["action"] = validAction;
							list["tap"](0);
						});

						it("should not trigger a confirm prompt", (): Chai.Assertion => expect(WindowMock.confirm).to.not.have.been.called);
						it("should trigger the event handler", (): Chai.Assertion => expect(eventHandler).to.have.been.called);
					}
				});
			});
		});

		describe("invalid action", (): void => {
			beforeEach((): void => {
				list["action"] = undefined;
				list["tap"](0);
			});

			it("should not trigger a confirm prompt", (): Chai.Assertion => expect(WindowMock.confirm).to.not.have.been.called);
			it("should not trigger the event handler", (): Chai.Assertion => expect(eventHandler).to.not.have.been.called);
		});
	});

	afterEach((): void => containerElement.remove());
});