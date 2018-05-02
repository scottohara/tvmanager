import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import List from "../../../src/components/list";
import ListTemplate from "views/listTemplate.html";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("List", () => {
	const validActions = ["view", "edit", "delete"];

	let container,
			itemTemplate,
			groupBy,
			items,
			eventHandler,
			action,
			containerElement,
			list;

	beforeEach(() => {
		container = "list";
		itemTemplate = ListTemplate;
		groupBy = "name";
		items = [
			// Object create is used to set a prototype, so we can test that the template correctly ignores inherited properties
			Object.create({inheritedProperty: "ignore me"}, {
				name: {enumerable: true, value: "group-one"},
				value: {enumerable: true, value: "item-one"}
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

	describe("object constructor", () => {
		it("should return a List instance", () => list.should.be.an.instanceOf(List));
		it("should set the container", () => list.container.should.equal(container));
		it("should set the item template", () => list.itemTemplate.should.equal(itemTemplate));
		it("should set the group by", () => list.groupBy.should.equal(groupBy));
		it("should set the list items", () => list.items.should.deep.equal(items));
		it("should attach a view event handler", () => list.viewEventHandler.should.equal(eventHandler));
		it("should attach an edit event handler", () => list.editEventHandler.should.equal(eventHandler));
		it("should attach a delete event handler", () => list.deleteEventHandler.should.equal(eventHandler));
		it("should set the action", () => list.action.should.equal(action));
	});

	describe("refresh", () => {
		let renderHtml;

		beforeEach(() => sinon.stub(list, "tap"));

		describe("without grouping", () => {
			beforeEach(() => {
				renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
				list.groupBy = null;
				list.refresh();
			});

			it("should render the list", () => containerElement.html().should.equal(renderHtml));

			it("should attach a click handler to each item", () => {
				$(`#${container} li:not([id])`).each((index, element) => {
					$(element).trigger("click");
					list.tap.should.have.been.calledWith(index);
				});
				list.tap.callCount.should.equal(3);
			});
		});

		describe("with grouping", () => {
			beforeEach(() => {
				renderHtml = "<li id=\"group-one\" class=\"group\">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id=\"group-two\" class=\"group\">group-two</li><li><a>group-two:item-three</a></li>";
				list.refresh();
			});

			it("should render the list", () => containerElement.html().should.equal(renderHtml));

			it("should attach a click handler to each item", () => {
				$(`#${container} li:not([id])`).each((index, element) => {
					$(element).trigger("click");
					list.tap.should.have.been.calledWith(index);
				});
				list.tap.callCount.should.equal(3);
			});
		});
	});

	describe("scrollTo", () => {
		const BODY_PADDING = 8;

		beforeEach(() => {
			for (let i = 0; i < 10; i++) {
				$("<li>")
					.attr("id", i)
					.height(20)
					.appendTo(containerElement);
			}

			containerElement.show();
			containerElement.scrollTop(40);

			appController.viewStack = [{scrollPos: 40}];
			appController.setScrollPosition.reset();
		});

		describe("item above view", () => {
			beforeEach(() => list.scrollTo(1));

			it("should update the scroll position", () => appController.viewStack.pop().scrollPos.should.equal(20 + BODY_PADDING));
			it("should set the scroll position", () => appController.setScrollPosition.should.have.been.called);
		});

		describe("item in view", () => {
			beforeEach(() => list.scrollTo(5));

			it("should not update the scroll position", () => appController.viewStack.pop().scrollPos.should.equal(40));
			it("should not set the scroll position", () => appController.setScrollPosition.should.not.have.been.called);
		});

		describe("item below view", () => {
			beforeEach(() => list.scrollTo(8));

			it("should update the scroll position", () => appController.viewStack.pop().scrollPos.should.equal(80 + BODY_PADDING));
			it("should set the scroll position", () => appController.setScrollPosition.should.have.been.called);
		});
	});

	describe("setAction", () => {
		let windowAlert;

		beforeEach(() => {
			windowAlert = sinon.stub(window, "alert");
			appController.getScrollPosition.reset();
			list.action = "";
		});

		validActions.forEach(validAction => {
			describe(validAction, () => {
				beforeEach(() => list.setAction(validAction));

				it("should set the action", () => list.action.should.equal(validAction));

				if ("view" === validAction) {
					it("should not save the scroll position", () => appController.getScrollPosition.should.not.have.been.called);
				} else {
					it("should save the scroll position", () => appController.getScrollPosition.should.have.been.called);
				}

				it("should not show an alert", () => windowAlert.should.not.have.been.called);
			});
		});

		describe("invalid action", () => {
			beforeEach(() => list.setAction("invalid"));

			it("should not save the scroll position", () => appController.getScrollPosition.should.not.have.been.called);
			it("should show an alert", () => windowAlert.should.have.been.calledWith("invalid is not a valid action"));
			it("should not set the action", () => list.action.should.equal(""));
		});

		afterEach(() => windowAlert.restore());
	});

	describe("tap", () => {
		let windowConfirm;

		beforeEach(() => {
			eventHandler = sinon.stub();
			windowConfirm = sinon.stub(window, "confirm");
		});

		validActions.forEach(validAction => {
			describe(validAction, () => {
				describe("without event handler", () => {
					beforeEach(() => {
						list[`${validAction}EventHandler`] = null;
						list.action = validAction;
						list.tap(0);
					});

					it("should not trigger a confirm prompt", () => windowConfirm.should.not.have.been.called);
					it("should not trigger the event handler", () => eventHandler.should.not.have.been.called);
				});

				describe("with event handler", () => {
					beforeEach(() => (list[`${validAction}EventHandler`] = eventHandler));

					if ("delete" === validAction) {
						describe("confirmed", () => {
							beforeEach(() => {
								windowConfirm.returns(true);
								list.action = validAction;
								list.tap(0);
							});

							it("should trigger a confirm prompt", () => windowConfirm.should.have.been.calledWith("Delete this item?"));
							it("should trigger the event handler", () => eventHandler.should.have.been.called);
						});

						describe("aborted", () => {
							beforeEach(() => {
								windowConfirm.returns(false);
								list.action = validAction;
								list.tap(0);
							});

							it("should trigger a confirm prompt", () => windowConfirm.should.have.been.calledWith("Delete this item?"));
							it("should not trigger the event handler", () => eventHandler.should.not.have.been.called);
						});
					} else {
						beforeEach(() => {
							list.action = validAction;
							list.tap(0);
						});

						it("should not trigger a confirm prompt", () => windowConfirm.should.not.have.been.called);
						it("should trigger the event handler", () => eventHandler.should.have.been.called);
					}
				});
			});
		});

		afterEach(() => windowConfirm.restore());
	});

	afterEach(() => containerElement.remove());
});