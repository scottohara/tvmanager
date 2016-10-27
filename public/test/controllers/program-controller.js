define(
	[
		"controllers/program-controller",
		"models/program-model",
		"controllers/application-controller",
		"framework/jquery"
	],

	(ProgramController, Program, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("ProgramController", () => {
			let listItem,
					programController;

			beforeEach(() => {
				listItem = {
					program: {
						programName: "test-program",
						save: sinon.stub(),
						setProgramName(programName) {
							this.programName = programName;
						}
					}
				};

				programController = new ProgramController(listItem);
			});

			describe("object constructor", () => {
				const testParams = [
					{
						description: "update"
					},
					{
						description: "add",
						listItem: {
							program: new Program(null, "", 0, 0, 0, 0, 0)
						},
						programController: new ProgramController()
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => {
							listItem = params.listItem || listItem;
							programController = params.programController || programController;
						});

						it("should return a ProgramController instance", () => programController.should.be.an.instanceOf(ProgramController));
						it("should set the list item", () => programController.listItem.program.programName.should.equal(listItem.program.programName));
					});
				});
			});

			describe("setup", () => {
				let programName;

				beforeEach(() => {
					sinon.stub(programController, "cancel");
					sinon.stub(programController, "save");

					programName = $("<input>")
						.attr("id", "programName")
						.appendTo(document.body);

					programController.setup();
				});

				it("should set the header label", () => programController.header.label.should.equal("Add/Edit Program"));

				it("should attach a header left button event handler", () => {
					programController.header.leftButton.eventHandler();
					programController.cancel.should.have.been.called;
				});

				it("should set the header left button label", () => programController.header.leftButton.label.should.equal("Cancel"));

				it("should attach a header right button event handler", () => {
					programController.header.rightButton.eventHandler();
					programController.save.should.have.been.called;
				});

				it("should set the header right button style", () => programController.header.rightButton.style.should.equal("confirmButton"));
				it("should set the header right button label", () => programController.header.rightButton.label.should.equal("Save"));

				it("should set the program name", () => programName.val().should.equal(listItem.program.programName));

				afterEach(() => programName.remove());
			});

			describe("save", () => {
				const testParams = [
					{
						description: "update",
						listIndex: 0,
						scrollPos: 0
					},
					{
						description: "insert",
						listIndex: -1,
						scrollPos: -1
					}
				];

				let programName,
						programNameInput;

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => {
							programName = "test-program-2";

							programNameInput = $("<input>")
								.attr("id", "programName")
								.val(programName)
								.appendTo(document.body);

							appController.viewStack = [
								{scrollPos: 0},
								{scrollPos: 0}
							];
							programController.listItem.listIndex = params.listIndex;
							programController.save();
						});

						it("should get the program name", () => programController.listItem.program.programName.should.equal(programName));
						it("should save the program", () => listItem.program.save.should.have.been.called);
						it("should set the Programs view scroll position", () => appController.viewStack[0].scrollPos.should.equal(params.scrollPos));
						it("should pop the view", () => appController.popView.should.have.been.called);

						afterEach(() => programNameInput.remove());
					});
				});
			});

			describe("cancel", () => {
				it("should pop the view", () => {
					programController.cancel();
					appController.popView.should.have.been.called;
				});
			});
		});
	}
);