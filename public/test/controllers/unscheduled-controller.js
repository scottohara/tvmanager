define(
	[
		"controllers/unscheduled-controller",
		"controllers/application-controller",
		"models/episode-model"
	],

	(UnscheduledController, ApplicationController, Episode) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("UnscheduledController", () => {
			let unscheduledController,
					items;

			beforeEach(() => {
				unscheduledController = new UnscheduledController();
				items = [{}];
			});

			describe("object constructor", () => {
				it("should return an UnscheduledController instance", () => unscheduledController.should.be.an.instanceOf(UnscheduledController));
			});

			describe("setup", () => {
				beforeEach(() => {
					sinon.stub(unscheduledController, "viewItem");
					sinon.stub(unscheduledController, "goBack");
					sinon.stub(unscheduledController, "activate");
					unscheduledController.setup();
				});

				it("should set the header label", () => unscheduledController.header.label.should.equal("Unscheduled"));

				it("should attach a header left button event handler", () => {
					unscheduledController.header.leftButton.eventHandler();
					unscheduledController.goBack.should.have.been.called;
				});

				it("should set the header left button style", () => unscheduledController.header.leftButton.style.should.equal("backButton"));
				it("should set the header left button label", () => unscheduledController.header.leftButton.label.should.equal("Schedule"));

				it("should attach a view event handler to the unscheduled list", () => {
					unscheduledController.unscheduledList.viewEventHandler();
					unscheduledController.viewItem.should.have.been.called;
				});

				it("should activate the controller", () => unscheduledController.activate.should.have.been.called);
			});

			describe("activate", () => {
				it("should get the list of unscheduled episodes", () => {
					sinon.stub(unscheduledController, "listRetrieved");
					unscheduledController.activate();
					Episode.listByUnscheduled.should.have.been.calledWith(sinon.match.func);
					unscheduledController.listRetrieved.should.have.been.calledWith([{}]);
				});
			});

			describe("listRetrieved", () => {
				beforeEach(() => {
					sinon.stub(unscheduledController, "activate");
					sinon.stub(unscheduledController, "viewItems");
					unscheduledController.setup();
					unscheduledController.listRetrieved(items);
				});

				it("should set the unscheduled list items", () => unscheduledController.unscheduledList.items.should.deep.equal(items));
				it("should refresh the list", () => unscheduledController.unscheduledList.refresh.should.have.been.called);
				it("should set the list to view mode", () => unscheduledController.viewItems.should.have.been.called);
			});

			describe("goBack", () => {
				it("should pop the view", () => {
					unscheduledController.goBack();
					appController.popView.should.have.been.called;
				});
			});

			describe("viewItem", () => {
				it("should push the episode view for the selected item", () => {
					const index = 0;

					unscheduledController.unscheduledList = {items};
					unscheduledController.viewItem(index);
					appController.pushView.should.have.been.calledWith("episode", {
						listIndex: index,
						episode: items[index]
					});
				});
			});

			describe("viewItems", () => {
				beforeEach(() => {
					sinon.stub(unscheduledController, "activate");
					unscheduledController.setup();
					unscheduledController.viewItems();
				});

				it("should set the list to view mode", () => unscheduledController.unscheduledList.action.should.equal("view"));
				it("should clear the view footer", () => appController.clearFooter.should.have.been.called);
				it("should set the footer label", () => unscheduledController.footer.label.should.equal("v1.0"));
				it("should set the view footer", () => appController.setFooter.should.have.been.called);
			});
		});
	}
);
