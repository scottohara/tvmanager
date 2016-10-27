define(
	[
		"controllers/application-controller",
		"components/list",
		"framework/jquery"
	],

	(ApplicationController, List, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("List", () => {
			const validActions = ["view", "edit", "delete"];

			let container,
					itemTemplate,
					groupBy,
					items,
					currentItem,
					eventHandler,
					populateItemEventHandler,
					action,
					list;

			beforeEach(() => {
				container = "list";
				itemTemplate = "base/test/views/listTemplate.html";
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
				currentItem = 0;
				eventHandler = index => index.should.equal(currentItem);
				populateItemEventHandler = item => {
					item.should.deep.equal(items[currentItem]);
					currentItem++;
				};
				action = "view";

				$("<ul>")
					.attr("id", container)
					.hide()
					.appendTo(document.body);

				list = new List(container, itemTemplate, groupBy, items, eventHandler, eventHandler, eventHandler, populateItemEventHandler);
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
				it("should attach a populate item event handler", () => list.populateItemEventHandler.should.equal(populateItemEventHandler));
				it("should set the action", () => list.action.should.equal(action));
			});

			describe("refresh", () => {
				let originalSetScrollPosition,
						renderHtml,
						resume;

				beforeEach(() => {
					originalSetScrollPosition = appController.setScrollPosition;
					renderHtml = "<li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li><a>group-two:item-three</a></li>";
					appController.setScrollPosition = () => {
						$(`#${container}`).html().should.equal(renderHtml);
						$(`#${container} li:not([id])`).each((index, element) => {
							currentItem = index;
							$(element).trigger("click");
						});
						resume();
					};
				});

				describe("304 not modified", () => {
					it("should refresh the list", done => {
						const fakeServer = sinon.fakeServer.create();

						fakeServer.respondImmediately = true;
						fakeServer.respondWith("GET", itemTemplate, [304, {}, "<a>#{name}:#{value}</a>"]);
						resume = done;
						list.groupBy = null;
						list.refresh();
						fakeServer.restore();
					});
				});

				describe("without event handler", () => {
					it("should refresh the list", done => {
						resume = done;
						list = new List(container, itemTemplate, null, items, eventHandler, eventHandler, eventHandler, null);
						list.refresh();
					});
				});

				describe("without grouping", () => {
					it("should refresh the list", done => {
						resume = done;
						list.groupBy = null;
						list.refresh();
					});
				});

				describe("with grouping", () => {
					it("should refresh the list", done => {
						resume = done;
						renderHtml = "<li id=\"group-one\" class=\"group\">group-one</li><li><a>group-one:item-one</a></li><li><a>group-one:item-two</a></li><li id=\"group-two\" class=\"group\">group-two</li><li><a>group-two:item-three</a></li>";
						list.refresh();
					});
				});

				afterEach(() => (appController.setScrollPosition = originalSetScrollPosition));
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

			afterEach(() => $(`#${container}`).remove());
		});
	}
);