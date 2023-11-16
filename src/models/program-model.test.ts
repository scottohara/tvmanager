import DatabaseServiceMock from "~/mocks/database-service-mock";
import Program from "./program-model";
import type { SinonStub } from "sinon";

describe("Program", (): void => {
	let id: string,
		programName: string | null,
		seriesCount: number,
		episodeCount: number,
		watchedCount: number,
		recordedCount: number,
		expectedCount: number,
		program: Program;

	beforeEach((): void => {
		id = "1";
		programName = "test-program";
		seriesCount = 1;
		episodeCount = 1;
		watchedCount = 1;
		recordedCount = 1;
		expectedCount = 1;
		program = new Program(
			id,
			programName,
			seriesCount,
			episodeCount,
			watchedCount,
			recordedCount,
			expectedCount,
		);
	});

	describe("object constructor", (): void => {
		it("should return a Program instance", (): Chai.Assertion =>
			expect(program).to.be.an.instanceOf(Program));
		it("should set the id", (): Chai.Assertion =>
			expect(String(program.id)).to.equal(id));
		it("should set the program name", (): Chai.Assertion =>
			expect(String(program.programName)).to.equal(programName));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(program["progressBar"]["total"]).to.equal(episodeCount));
		it("should set the series count", (): Chai.Assertion =>
			expect(program.seriesCount).to.equal(seriesCount));
		it("should set the episode count", (): Chai.Assertion =>
			expect(program.episodeCount).to.equal(episodeCount));
		it("should set the watched count", (): Chai.Assertion =>
			expect(program.watchedCount).to.equal(watchedCount));
		it("should set the recorded count", (): Chai.Assertion =>
			expect(program.recordedCount).to.equal(recordedCount));
		it("should set the expected count", (): Chai.Assertion =>
			expect(program.expectedCount).to.equal(expectedCount));

		["programGroup"].forEach((property: string): void => {
			it(`should make the ${property} property enumerable`, (): Chai.Assertion =>
				expect(
					Boolean(
						(
							Object.getOwnPropertyDescriptor(
								program,
								property,
							) as PropertyDescriptor
						).enumerable,
					),
				).to.be.true);
		});
	});

	describe("list", (): void => {
		let programList: Program[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).programsStore.list as SinonStub).throws();
				programList = await Program.list();
			});

			it("should attempt to get the list of programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.list).to.have.been
					.called);
			it("should return an empty array", (): Chai.Assertion =>
				expect(programList).to.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).programsStore.list as SinonStub).returns([
					{
						ProgramID: id,
						Name: programName,
						SeriesCount: seriesCount,
						EpisodeCount: episodeCount,
						WatchedCount: watchedCount,
						RecordedCount: recordedCount,
						ExpectedCount: expectedCount,
					},
				]);
				programList = await Program.list();
			});

			it("should attempt to get the list of programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.list).to.have.been
					.called);
			it("should return the list of programs", (): Chai.Assertion =>
				expect(programList).to.deep.equal([program]));
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).programsStore.list as SinonStub).reset(),
		);
	});

	describe("find", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).programsStore.find as SinonStub).throws();
				program = await Program.find(id);
			});

			it("should attempt to find the program", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).programsStore.find,
				).to.have.been.calledWith(id));
			it("should return a null program id", (): Chai.Assertion =>
				expect(program.id).to.be.null);
		});

		describe("success", (): void => {
			describe("doesn't exist", (): void => {
				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).programsStore.find as SinonStub).returns(
						undefined,
					);
					program = await Program.find(id);
				});

				it("should attempt to find the program", async (): Promise<Chai.Assertion> =>
					expect(
						(await DatabaseServiceMock).programsStore.find,
					).to.have.been.calledWith(id));
				it("should return a null program id", (): Chai.Assertion =>
					expect(program.id).to.be.null);
			});

			describe("exists", (): void => {
				let foundProgram: Program;

				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).programsStore.find as SinonStub).returns(
						{
							ProgramID: id,
							Name: programName,
						},
					);

					program.seriesCount = 0;
					program.setEpisodeCount(0);
					program.setWatchedCount(0);
					program.setRecordedCount(0);
					program.setExpectedCount(0);

					foundProgram = await Program.find(id);
				});

				it("should attempt to find the program", async (): Promise<Chai.Assertion> =>
					expect(
						(await DatabaseServiceMock).programsStore.find,
					).to.have.been.calledWith(id));
				it("should return the program", (): Chai.Assertion =>
					expect(foundProgram).to.deep.equal(program));
			});
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).programsStore.find as SinonStub).reset(),
		);
	});

	describe("count", (): void => {
		let count: number;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).programsStore.count as SinonStub).throws();
				count = await Program.count();
			});

			it("should attempt to get the count of programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.count).to.have.been
					.called);
			it("should return zero", (): Chai.Assertion => expect(count).to.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).programsStore.count as SinonStub).returns(
					1,
				);
				count = await Program.count();
			});

			it("should attempt to get the count of programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.count).to.have.been
					.called);
			it("should return the count of programs", (): Chai.Assertion =>
				expect(count).to.equal(1));
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).programsStore.count as SinonStub).reset(),
		);
	});

	describe("removeAll", (): void => {
		let errorMessage: string | undefined;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).programsStore.removeAll as SinonStub
				).throws(new Error("Force failed"));
				errorMessage = await Program.removeAll();
			});

			it("should attempt to remove all programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.removeAll).to.have.been
					.called);
			it("should return an error message", (): Chai.Assertion =>
				expect(String(errorMessage)).to.equal(
					"Program.removeAll: Force failed",
				));
		});

		describe("success", (): void => {
			beforeEach(
				async (): Promise<string | undefined> =>
					(errorMessage = await Program.removeAll()),
			);

			it("should attempt to remove all programs", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).programsStore.removeAll).to.have.been
					.called);
			it("should not return an error message", (): Chai.Assertion =>
				expect(errorMessage).to.be.undefined);
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).programsStore.removeAll as SinonStub
				).reset(),
		);
	});

	describe("fromJson", (): void => {
		it("should construct a Program object from the JSON", (): Chai.Assertion =>
			expect(
				Program.fromJson({ id, programName, type: "Program" }),
			).to.deep.equal(new Program(id, programName)));
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			useId: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				useId: true,
			},
			{
				description: "insert",
				useId: false,
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let programId: string | undefined;

				beforeEach((): void => {
					if (!scenario.useId) {
						program.id = null;
					}
				});

				describe("fail", (): void => {
					beforeEach(async (): Promise<void> => {
						(
							(await DatabaseServiceMock).programsStore.save as SinonStub
						).throws();
						programId = await program.save();
					});

					it("should attempt to save the program", async (): Promise<Chai.Assertion> =>
						expect(
							(await DatabaseServiceMock).programsStore.save,
						).to.have.been.calledWith({
							ProgramID: program.id,
							Name: program.programName,
						}));

					it("should not return the program id", (): Chai.Assertion =>
						expect(programId).to.be.undefined);
				});

				describe("success", (): void => {
					beforeEach(
						async (): Promise<string | undefined> =>
							(programId = await program.save()),
					);

					it("should attempt to save the program", async (): Promise<Chai.Assertion> =>
						expect(
							(await DatabaseServiceMock).programsStore.save,
						).to.have.been.calledWith({
							ProgramID: program.id,
							Name: program.programName,
						}));

					it("should return the program id", (): Chai.Assertion =>
						expect(String(programId)).to.equal(program.id));
				});
			});
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).programsStore.save as SinonStub).reset(),
		);
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				program.id = null;
				await program.remove();
				expect((await DatabaseServiceMock).programsStore.remove).to.not.have
					.been.called;
			});
		});

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).programsStore.remove as SinonStub
				).throws();
				try {
					await program.remove();
				} catch (_e: unknown) {
					// No op
				}
			});

			it("should attempt to remove the program", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).programsStore.remove,
				).to.have.been.calledWith(id));
			it("should not clear the id", (): Chai.Assertion =>
				expect(String(program.id)).to.equal(id));
			it("should not clear the program name", (): Chai.Assertion =>
				expect(String(program.programName)).to.equal(programName));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => program.remove());

			it("should attempt to remove the program", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).programsStore.remove,
				).to.have.been.calledWith(id));
			it("should clear the id", (): Chai.Assertion =>
				expect(program.id).to.be.null);
			it("should clear the program name", (): Chai.Assertion =>
				expect(program.programName).to.be.null);
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).programsStore.remove as SinonStub).reset(),
		);
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the program", (): Chai.Assertion =>
			expect(program.toJson()).to.deep.equal({
				id,
				programName,
				type: "Program",
			}));
	});

	describe("programGroup", (): void => {
		interface Scenario {
			description: string;
			programName: string | null;
			programGroup: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "without name",
				programName: null,
				programGroup: "",
			},
			{
				description: "with name",
				programName: "another-test-program",
				programGroup: "A",
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(
					(): string | null => (program.programName = scenario.programName),
				);
				it("should return the program group", (): Chai.Assertion =>
					expect(program.programGroup).to.equal(scenario.programGroup));
			});
		});
	});

	describe("setEpisodeCount", (): void => {
		beforeEach((): void => {
			episodeCount = 2;
			program.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", (): Chai.Assertion =>
			expect(program.episodeCount).to.equal(episodeCount));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(program["progressBar"]["total"]).to.equal(episodeCount));
	});

	describe("setWatchedCount", (): void => {
		it("should set the watched count", (): void => {
			watchedCount = 2;
			program.setWatchedCount(watchedCount);
			expect(program.watchedCount).to.equal(watchedCount);
		});
	});

	describe("setRecordedCount", (): void => {
		beforeEach((): void => program.setRecordedCount(1));

		it("should set the recorded count", (): Chai.Assertion =>
			expect(program.recordedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "recorded",
				}),
			));
	});

	describe("setExpectedCount", (): void => {
		beforeEach((): void => program.setExpectedCount(1));

		it("should set the expected count", (): Chai.Assertion =>
			expect(program.expectedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "expected",
				}),
			));
	});

	describe("setWatchedProgress", (): void => {
		it("should update the progress bar display", (): void => {
			program.watchedCount = 1;
			program["setWatchedProgress"]();
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "watched",
				}),
			);
		});
	});
});
