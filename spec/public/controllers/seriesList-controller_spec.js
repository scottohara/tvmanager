import $ from "jquery";
import ApplicationController from "controllers/application-controller";
import Series from "models/series-model";
import SeriesListController from "controllers/seriesList-controller";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("SeriesListController", () => {
	let listItem,
			items,
			seriesList,
			seriesListController;

	beforeEach(() => {
		listItem = {
			program: {
				id: 1,
				programName: "test-program",
				seriesCount: 1,
				episodeCount: 6,
				watchedCount: 2,
				recordedCount: 2,
				expectedCount: 2,
				setEpisodeCount: sinon.stub(),
				setWatchedCount: sinon.stub(),
				setRecordedCount: sinon.stub(),
				setExpectedCount: sinon.stub()
			}
		};

		items = [
			{
				id: 1,
				seriesName: "a-test-series",
				programId: 1,
				episodeCount: 3,
				watchedCount: 1,
				recordedCount: 1,
				expectedCount: 1
			},
			{
				id: 2,
				seriesName: "z-test-series",
				programId: 1,
				episodeCount: 3,
				watchedCount: 1,
				recordedCount: 1,
				expectedCount: 1
			}
		];

		seriesList = $("<ul>")
			.attr("id", "list")
			.appendTo(document.body);

		seriesListController = new SeriesListController(listItem);
	});

	describe("object constructor", () => {
		it("should return a SeriesListController instance", () => seriesListController.should.be.an.instanceOf(SeriesListController));
		it("should set the list item", () => seriesListController.listItem.should.equal(listItem));
	});

	describe("setup", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "viewItem");
			sinon.stub(seriesListController, "editItem");
			sinon.stub(seriesListController, "deleteItem");
			sinon.stub(seriesListController, "goBack");
			sinon.stub(seriesListController, "addItem");
			sinon.stub(seriesListController, "listRetrieved");
			Series.series = items;
			seriesListController.setup();
		});

		it("should set the header label", () => seriesListController.header.label.should.equal(listItem.program.programName));

		it("should attach a header left button event handler", () => {
			seriesListController.header.leftButton.eventHandler();
			seriesListController.goBack.should.have.been.called;
		});

		it("should set the header left button style", () => seriesListController.header.leftButton.style.should.equal("backButton"));
		it("should set the header left button label", () => seriesListController.header.leftButton.label.should.equal("Programs"));

		it("should attach a header right button event handler", () => {
			seriesListController.header.rightButton.eventHandler();
			seriesListController.addItem.should.have.been.called;
		});

		it("should set the header right button label", () => seriesListController.header.rightButton.label.should.equal("+"));

		it("should attach a view event handler to the series list", () => {
			seriesListController.seriesList.viewEventHandler();
			seriesListController.viewItem.should.have.been.called;
		});

		it("should attach an edit event handler to the series list", () => {
			seriesListController.seriesList.editEventHandler();
			seriesListController.editItem.should.have.been.called;
		});

		it("should attach a delete event handler to the series list", () => {
			seriesListController.seriesList.deleteEventHandler();
			seriesListController.deleteItem.should.have.been.called;
		});

		it("should get the list of series for the program", () => {
			Series.listByProgram.should.have.been.calledWith(listItem.program.id, sinon.match.func);
			seriesListController.listRetrieved.should.have.been.calledWith(items);
		});
	});

	describe("activate", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "viewItems");
			seriesListController.seriesList = {
				items: [
					Object.assign({}, items[0]),
					Object.assign({}, items[1])
				],
				refresh: sinon.stub(),
				scrollTo: sinon.stub()
			};
		});

		describe("from programs view", () => {
			beforeEach(() => seriesListController.activate());

			it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
			it("should set the list to view mode", () => seriesListController.viewItems.should.have.been.called);
		});

		describe("from series or episodes view", () => {
			let sortedItems,
					clock;

			beforeEach(() => (clock = sinon.useFakeTimers()));

			describe("edit", () => {
				beforeEach(() => {
					sinon.stub(seriesListController, "deleteItem");
					listItem.listIndex = 0;
					listItem.series = Object.assign(items[0], {seriesName: "edited-series"});
				});

				describe("program changed", () => {
					beforeEach(() => {
						listItem.series.programId = 2;
						seriesListController.activate(listItem);
						clock.tick(300);
					});

					it("should not update the program episode count", () => listItem.program.setEpisodeCount.should.not.have.been.called);
					it("should not update the program watched count", () => listItem.program.setWatchedCount.should.not.have.been.called);
					it("should not update the program recorded count", () => listItem.program.setRecordedCount.should.not.have.been.called);
					it("should not update the program expected count", () => listItem.program.setExpectedCount.should.not.have.been.called);
					it("should remove the item from the list", () => seriesListController.deleteItem.should.have.been.calledWith(listItem.listIndex, true));
					it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
					it("should not scroll the list", () => seriesListController.seriesList.scrollTo.should.not.have.been.called);
					it("should set the list to view mode", () => seriesListController.viewItems.should.have.been.called);
				});

				describe("program not changed", () => {
					beforeEach(() => {
						seriesListController.origEpisodeCount = 2;
						seriesListController.origWatchedCount = 0;
						seriesListController.origRecordedCount = 1;
						seriesListController.origExpectedCount = 2;
					});

					describe("series name unchanged", () => {
						beforeEach(() => {
							seriesListController.origSeriesName = listItem.series.seriesName;
							seriesListController.activate(listItem);
							clock.tick(300);
						});

						it("should update the item in the series list and resort by series name", () => seriesListController.seriesList.items.should.deep.equal(items));
						it("should update the program episode count", () => listItem.program.setEpisodeCount.should.have.been.calledWith(7));
						it("should update the program watched count", () => listItem.program.setWatchedCount.should.have.been.calledWith(3));
						it("should update the program recorded count", () => listItem.program.setRecordedCount.should.have.been.calledWith(2));
						it("should update the program expected count", () => listItem.program.setExpectedCount.should.have.been.calledWith(1));
						it("should not remove the item from the list", () => seriesListController.deleteItem.should.not.have.been.called);
						it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
						it("should not scroll the list", () => seriesListController.seriesList.scrollTo.should.not.have.been.called);
						it("should set the list to view mode", () => seriesListController.viewItems.should.have.been.called);
					});

					describe("series name changed", () => {
						beforeEach(() => {
							seriesListController.origSeriesName = "original-program";
							seriesListController.activate(listItem);
							clock.tick(300);
						});

						it("should update the item in the series list and resort by series name", () => seriesListController.seriesList.items.should.deep.equal(items));
						it("should update the program episode count", () => listItem.program.setEpisodeCount.should.have.been.calledWith(7));
						it("should update the program watched count", () => listItem.program.setWatchedCount.should.have.been.calledWith(3));
						it("should update the program recorded count", () => listItem.program.setRecordedCount.should.have.been.calledWith(2));
						it("should update the program expected count", () => listItem.program.setExpectedCount.should.have.been.calledWith(1));
						it("should not remove the item from the list", () => seriesListController.deleteItem.should.not.have.been.called);
						it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
						it("should scroll the list", () => seriesListController.seriesList.scrollTo.should.have.been.calledWith(1));
						it("should set the list to view mode", () => seriesListController.viewItems.should.have.been.called);
					});
				});
			});

			describe("add", () => {
				beforeEach(() => {
					listItem.series = {id: 3, seriesName: "new-series"};
					sortedItems = [
						items[0],
						listItem.series,
						items[1]
					];
					seriesListController.activate(listItem);
					clock.tick(300);
				});

				it("should add the item to the series list and resort by series name", () => seriesListController.seriesList.items.should.deep.equal(sortedItems));
				it("should increment the program series count", () => listItem.program.seriesCount.should.equal(2));
				it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
				it("should scroll the list", () => seriesListController.seriesList.scrollTo.should.have.been.calledWith(3));
				it("should set the list to view mode", () => seriesListController.viewItems.should.have.been.called);
			});

			afterEach(() => clock.restore());
		});
	});

	describe("listRetrieved", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "activate");
			seriesListController.seriesList = {};
			seriesListController.listRetrieved(items);
		});

		it("should set the series list items", () => seriesListController.seriesList.items.should.deep.equal(items));
		it("should activate the controller", () => seriesListController.activate.should.have.been.called);
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			seriesListController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("viewItem", () => {
		let index;

		beforeEach(() => {
			index = 0;
			seriesListController.seriesList = {items};
			seriesListController.viewItem(index);
		});

		it("should save the current series details", () => {
			seriesListController.origSeriesName.should.equal(items[0].seriesName);
			seriesListController.origEpisodeCount.should.equal(3);
			seriesListController.origWatchedCount.should.equal(1);
			seriesListController.origRecordedCount.should.equal(1);
			seriesListController.origExpectedCount.should.equal(1);
		});

		it("should push the episodes view for the selected item", () => appController.pushView.should.have.been.calledWith("episodes", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("addItem", () => {
		it("should push the series view with no selected item", () => {
			seriesListController.addItem();
			appController.pushView.should.have.been.calledWithExactly("series", {program: listItem.program});
		});
	});

	describe("editItem", () => {
		let index;

		beforeEach(() => {
			index = 0;
			seriesListController.seriesList = {items};
			seriesListController.editItem(index);
		});

		it("should save the current series details", () => {
			seriesListController.origSeriesName.should.equal(items[0].seriesName);
			seriesListController.origEpisodeCount.should.equal(3);
			seriesListController.origWatchedCount.should.equal(1);
			seriesListController.origRecordedCount.should.equal(1);
			seriesListController.origExpectedCount.should.equal(1);
		});

		it("should push the program view for the selected item", () => appController.pushView.should.have.been.calledWith("series", {
			listIndex: index,
			series: items[index]
		}));
	});

	describe("deleteItem", () => {
		const testParams = [
			{
				description: "moving",
				dontRemove: true
			},
			{
				description: "deleting",
				dontRemove: false
			}
		];

		let index,
				item;

		beforeEach(() => {
			index = 0;
			item = Object.assign(items[0], {remove: sinon.stub()});
			seriesListController.seriesList = {
				items: [item],
				refresh: sinon.stub()
			};
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => seriesListController.deleteItem(index, params.dontRemove));

				it("should decrement the program episode count", () => listItem.program.setEpisodeCount.should.have.been.calledWith(3));
				it("should decrement the program watched count", () => listItem.program.setWatchedCount.should.have.been.calledWith(1));
				it("should decrement the program recorded count", () => listItem.program.setRecordedCount.should.have.been.calledWith(1));
				it("should decrement the program expected count", () => listItem.program.setExpectedCount.should.have.been.calledWith(1));
				it("should decrement the program series count", () => listItem.program.seriesCount.should.equal(0));

				if (!params.dontRemove) {
					it("should remove the item from the database", () => item.remove.should.have.been.called);
				}

				it("should remove the item from the series list", () => seriesListController.seriesList.items.should.deep.equal([]));
				it("should refresh the list", () => seriesListController.seriesList.refresh.should.have.been.called);
			});
		});
	});

	describe("deleteItems", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "listRetrieved");
			sinon.stub(seriesListController, "viewItems");
			seriesListController.setup();
			seriesListController.deleteItems();
		});

		it("should set the list to delete mode", () => seriesListController.seriesList.action.should.equal("delete"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			seriesList.hasClass("delete").should.be.true;
			seriesList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", () => seriesListController.footer.label.should.equal("v1.0"));

		it("should attach a footer right button event handler", () => {
			seriesListController.footer.rightButton.eventHandler();
			seriesListController.viewItems.should.have.been.called;
		});

		it("should set the footer right button style", () => seriesListController.footer.rightButton.style.should.equal("confirmButton"));
		it("should set the footer right button label", () => seriesListController.footer.rightButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("editItems", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "listRetrieved");
			sinon.stub(seriesListController, "viewItems");
			seriesListController.setup();
			seriesListController.editItems();
		});

		it("should set the list to edit mode", () => seriesListController.seriesList.action.should.equal("edit"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			seriesList.hasClass("delete").should.be.false;
			seriesList.hasClass("edit").should.be.true;
		});

		it("should set the footer label", () => seriesListController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			seriesListController.footer.leftButton.eventHandler();
			seriesListController.viewItems.should.have.been.called;
		});

		it("should set the footer left button style", () => seriesListController.footer.leftButton.style.should.equal("confirmButton"));
		it("should set the footer left button label", () => seriesListController.footer.leftButton.label.should.equal("Done"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	describe("viewItems", () => {
		beforeEach(() => {
			sinon.stub(seriesListController, "listRetrieved");
			sinon.stub(seriesListController, "editItems");
			sinon.stub(seriesListController, "deleteItems");
			seriesListController.setup();
			seriesListController.viewItems();
		});

		it("should set the list to view mode", () => seriesListController.seriesList.action.should.equal("view"));
		it("should clear the view footer", () => appController.clearFooter.should.have.been.called);

		it("should set the list item icons", () => {
			seriesList.hasClass("delete").should.be.false;
			seriesList.hasClass("edit").should.be.false;
		});

		it("should set the footer label", () => seriesListController.footer.label.should.equal("v1.0"));

		it("should attach a footer left button event handler", () => {
			seriesListController.footer.leftButton.eventHandler();
			seriesListController.editItems.should.have.been.called;
		});

		it("should set the footer left button label", () => seriesListController.footer.leftButton.label.should.equal("Edit"));

		it("should attach a footer right button event handler", () => {
			seriesListController.footer.rightButton.eventHandler();
			seriesListController.deleteItems.should.have.been.called;
		});

		it("should set the footer left button style", () => seriesListController.footer.rightButton.style.should.equal("cautionButton"));
		it("should set the footer right button label", () => seriesListController.footer.rightButton.label.should.equal("Delete"));
		it("should set the view footer", () => appController.setFooter.should.have.been.called);
	});

	afterEach(() => seriesList.remove());
});