import sinon, { SinonStub } from "sinon";
import ApplicationControllerMock from "mocks/application-controller-mock";
import Program from "../../../src/models/program-model";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("Program", (): void => {
	let id: string,
			programName: string | null,
			seriesCount: number,
			episodeCount: number,
			watchedCount: number,
			recordedCount: number,
			expectedCount: number,
			program: Program,
			callback: SinonStub;

	beforeEach((): void => {
		id = "1";
		programName = "test-program";
		seriesCount = 1;
		episodeCount = 1;
		watchedCount = 1;
		recordedCount = 1;
		expectedCount = 1;
		program = new Program(id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount);
	});

	describe("object constructor", (): void => {
		it("should return a Program instance", (): Chai.Assertion => program.should.be.an.instanceOf(Program));
		it("should set the id", (): Chai.Assertion => String(program.id).should.equal(id));
		it("should set the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		it("should set the progress bar total", (): Chai.Assertion => program["progressBar"]["total"].should.equal(episodeCount));
		it("should set the series count", (): Chai.Assertion => program.seriesCount.should.equal(seriesCount));
		it("should set the episode count", (): Chai.Assertion => program.episodeCount.should.equal(episodeCount));
		it("should set the watched count", (): Chai.Assertion => program.watchedCount.should.equal(watchedCount));
		it("should set the recorded count", (): Chai.Assertion => program.recordedCount.should.equal(recordedCount));
		it("should set the expected count", (): Chai.Assertion => program.expectedCount.should.equal(expectedCount));
	});

	describe("list", (): void => {
		let sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			sql = `
				SELECT					p.ProgramID,
												p.Name,
												COUNT(DISTINCT s.SeriesID) AS SeriesCount,
												COUNT(e.EpisodeID) AS EpisodeCount,
												COUNT(e2.EpisodeID) AS WatchedCount,
												COUNT(e3.EpisodeID) AS RecordedCount,
												COUNT(e4.EpisodeID) AS ExpectedCount
				FROM						Program p
				LEFT OUTER JOIN	Series s on p.ProgramID = s.ProgramID
				LEFT OUTER JOIN	Episode e on s.SeriesID = e.SeriesID
				LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
				LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
				LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
				GROUP BY		 		p.ProgramID
				ORDER BY p.Name COLLATE NOCASE
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Program.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Program.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					ProgramID: id,
					Name: programName,
					SeriesCount: seriesCount,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount: recordedCount,
					ExpectedCount: expectedCount
				}]);
				Program.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([program]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("find", (): void => {
		beforeEach((): SinonStub => (callback = sinon.stub()));

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`
					SELECT	ProgramID,
									Name
					FROM		Program
					WHERE		ProgramID = ${id}
				`);
				Program.find(id, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(null));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					ProgramID: id,
					Name: programName
				}]);

				program.seriesCount = 0;
				program.setEpisodeCount(0);
				program.setWatchedCount(0);
				program.setRecordedCount(0);
				program.setExpectedCount(0);

				Program.find(id, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(program));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("count", (): void => {
		beforeEach((): SinonStub => (callback = sinon.stub()));

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`
					SELECT	COUNT(*) AS ProgramCount
					FROM Program
				`);
				Program.count(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(0));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{ ProgramCount: 1 }]);
				Program.count(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(1));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("removeAll", (): void => {
		beforeEach((): SinonStub => (callback = sinon.stub()));

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("DELETE FROM Program");
				Program.removeAll(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(`Program.removeAll: ${appController.db.errorMessage}`));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => Program.removeAll(callback));

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("fromJson", (): void => {
		it("should construct a Program object from the JSON", (): Chai.Assertion => Program.fromJson({ id, programName, type: "Program" }).should.deep.equal(new Program(id, programName)));
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			useId: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				useId: true
			},
			{
				description: "insert",
				useId: false
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let programId: string,
						sql: string;

				beforeEach((): void => {
					if (scenario.useId) {
						programId = id;
					} else {
						programId = "%";
						program.id = null;
					}

					sql = `
						REPLACE INTO Program (ProgramID, Name)
						VALUES (${programId}, ${programName})
					`;
				});

				describe("fail", (): void => {
					beforeEach((): void => appController.db.failAt(sql));

					describe("without callback", (): void => {
						beforeEach((): void => program.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});
				});

				describe("no rows affected", (): void => {
					beforeEach((): void => appController.db.noRowsAffectedAt(sql));

					describe("without callback", (): void => {
						beforeEach((): void => program.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("no rows affected"));
						it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("no rows affected"));
					});
				});

				describe(`${scenario.description} Sync fail`, (): void => {
					beforeEach((): void => appController.db.failAt(`
						INSERT OR IGNORE INTO Sync (Type, ID, Action)
						VALUES ('Program', ${programId}, 'modified')
					`));

					describe("without callback", (): void => {
						beforeEach((): void => program.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});
				});

				describe("success", (): void => {
					describe("without callback", (): void => {
						beforeEach((): void => program.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(program.id));
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});
				});
			});
		});
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should execute no SQL commands", (): void => {
				program.id = null;
				program.remove();
				appController.db.commands.length.should.equal(0);
			});
		});

		describe("insert Episode Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ${id})`);
				program.remove();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("delete Episode fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ${id})`);
				program.remove();
			});

			it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("insert Series Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'deleted' FROM Series WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute three SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(3));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("delete Series fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Series	WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute four SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(4));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("insert Program Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Program', ${id}, 'deleted')`);
				program.remove();
			});

			it("should execute five SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(5));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("delete Program fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Program WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute six SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(6));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(program.id).should.equal(id));
			it("should not clear the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
		});

		describe("success", (): void => {
			beforeEach((): void => program.remove());

			it("should execute six SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(6));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
			it("should clear the id", (): Chai.Assertion => (null === program.id).should.be.true);
			it("should clear the program name", (): Chai.Assertion => (null === program.programName).should.be.true);
		});
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the program", (): Chai.Assertion => program.toJson().should.deep.equal({ id, programName, type: "Program" }));
	});

	describe("setProgramName", (): void => {
		let programGroup: string;

		describe("with name", (): void => {
			beforeEach((): void => {
				programName = "another-test-program";
				programGroup = "A";
				program.setProgramName(programName);
			});

			it("should set the program name", (): Chai.Assertion => String(program.programName).should.equal(programName));
			it("should set the program group", (): Chai.Assertion => program.programGroup.should.equal(programGroup));
		});

		describe("without name", (): void => {
			beforeEach((): void => {
				programName = null;
				programGroup = "A";
				program.setProgramName(programName);
			});

			it("should set the program name", (): Chai.Assertion => (null === program.programName).should.be.true);
			it("should set the program group", (): Chai.Assertion => program.programGroup.should.equal(""));
		});
	});

	describe("setEpisodeCount", (): void => {
		beforeEach((): void => {
			episodeCount = 2;
			program.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", (): Chai.Assertion => program.episodeCount.should.equal(episodeCount));
		it("should set the progress bar total", (): Chai.Assertion => program["progressBar"]["total"].should.equal(episodeCount));
	});

	describe("setWatchedCount", (): void => {
		it("should set the watched count", (): void => {
			watchedCount = 2;
			program.setWatchedCount(watchedCount);
			program.watchedCount.should.equal(watchedCount);
		});
	});

	describe("setRecordedCount", (): void => {
		beforeEach((): void => program.setRecordedCount(1));

		it("should set the recorded count", (): Chai.Assertion => program.recordedCount.should.equal(1));
		it("should update the progress bar display", (): Chai.Assertion => program.progressBarDisplay.should.equal(JSON.stringify({
			label: 1,
			percent: 100,
			style: "recorded"
		})));
	});

	describe("setExpectedCount", (): void => {
		beforeEach((): void => program.setExpectedCount(1));

		it("should set the expected count", (): Chai.Assertion => program.expectedCount.should.equal(1));
		it("should update the progress bar display", (): Chai.Assertion => program.progressBarDisplay.should.equal(JSON.stringify({
			label: 1,
			percent: 100,
			style: "expected"
		})));
	});

	describe("setWatchedProgress", (): void => {
		it("should update the progress bar display", (): void => {
			program.watchedCount = 1;
			program["setWatchedProgress"]();
			program.progressBarDisplay.should.equal(JSON.stringify({
				label: 1,
				percent: 100,
				style: "watched"
			}));
		});
	});

	afterEach((): void => appController.db.reset());
});