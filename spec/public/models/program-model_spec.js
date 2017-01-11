import ApplicationController from "controllers/application-controller";
import Program from "../../../src/models/program-model";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("Program", () => {
	let id,
			programName,
			seriesCount,
			episodeCount,
			watchedCount,
			recordedCount,
			expectedCount,
			program,
			callback;

	beforeEach(() => {
		id = 1;
		programName = "test-program";
		seriesCount = 1;
		episodeCount = 1;
		watchedCount = 1;
		recordedCount = 1;
		expectedCount = 1;
		program = new Program(id, programName, seriesCount, episodeCount, watchedCount, recordedCount, expectedCount);
	});

	describe("object constructor", () => {
		it("should return a Program instance", () => program.should.be.an.instanceOf(Program));
		it("should set the id", () => program.id.should.equal(id));
		it("should set the program name", () => program.programName.should.equal(programName));
		it("should set the progress bar total", () => program.progressBar.total.should.equal(episodeCount));
		it("should set the series count", () => program.seriesCount.should.equal(seriesCount));
		it("should set the episode count", () => program.episodeCount.should.equal(episodeCount));
		it("should set the watched count", () => program.watchedCount.should.equal(watchedCount));
		it("should set the recorded count", () => program.recordedCount.should.equal(recordedCount));
		it("should set the expected count", () => program.expectedCount.should.equal(expectedCount));
	});

	describe("save", () => {
		const testParams = [
			{
				description: "update",
				useId: true
			},
			{
				description: "insert",
				useId: false
			}
		];

		testParams.forEach(params => {
			describe(params.description, () => {
				let programId,
						sql;

				beforeEach(() => {
					if (params.useId) {
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

				describe("fail", () => {
					beforeEach(() => appController.db.failAt(sql));

					describe("without callback", () => {
						beforeEach(() => program.save());

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: Force failed"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: Force failed"));
					});
				});

				describe("no rows affected", () => {
					beforeEach(() => appController.db.noRowsAffectedAt(sql));

					describe("without callback", () => {
						beforeEach(() => program.save());

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: no rows affected"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: no rows affected"));
					});
				});

				describe(`${params.description} Sync fail`, () => {
					beforeEach(() => appController.db.failAt(`
						INSERT OR IGNORE INTO Sync (Type, ID, Action)
						VALUES ('Program', ${programId}, 'modified')
					`));

					describe("without callback", () => {
						beforeEach(() => program.save());

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: Force failed"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Program.save: Force failed"));
					});
				});

				describe("success", () => {
					describe("without callback", () => {
						beforeEach(() => program.save());

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", () => appController.db.commit.should.be.true);
						it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							program.save(callback);
						});

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", () => appController.db.commit.should.be.true);
						it("should invoke the callback", () => callback.should.have.been.calledWith(program.id));
						it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					});
				});
			});
		});
	});

	describe("remove", () => {
		describe("no ID", () => {
			it("should execute no SQL commands", () => {
				program.id = null;
				program.remove();
				appController.db.commands.length.should.equal(0);
			});
		});

		describe("insert Episode Sync fail", () => {
			beforeEach(() => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ${id})`);
				program.remove();
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("delete Episode fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = ${id})`);
				program.remove();
			});

			it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("insert Series Sync fail", () => {
			beforeEach(() => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'deleted' FROM Series WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute three SQL commands", () => appController.db.commands.length.should.equal(3));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("delete Series fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Series	WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute four SQL commands", () => appController.db.commands.length.should.equal(4));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("insert Program Sync fail", () => {
			beforeEach(() => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Program', ${id}, 'deleted')`);
				program.remove();
			});

			it("should execute five SQL commands", () => appController.db.commands.length.should.equal(5));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("delete Program fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Program WHERE ProgramID = ${id}`);
				program.remove();
			});

			it("should execute six SQL commands", () => appController.db.commands.length.should.equal(6));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => program.id.should.equal(id));
			it("should not clear the program name", () => program.programName.should.equal(programName));
		});

		describe("success", () => {
			beforeEach(() => program.remove());

			it("should execute six SQL commands", () => appController.db.commands.length.should.equal(6));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			it("should clear the id", () => (null === program.id).should.be.true);
			it("should clear the program name", () => (null === program.programName).should.be.true);
		});
	});

	describe("toJson", () => {
		it("should return a JSON representation of the program", () => program.toJson().should.deep.equal({id, programName}));
	});

	describe("setProgramName", () => {
		let programGroup;

		beforeEach(() => {
			programName = "another-test-program";
			programGroup = "A";
			program.setProgramName(programName);
		});

		it("should set the program name", () => program.programName.should.equal(programName));
		it("should set the program group", () => program.programGroup.should.equal(programGroup));
	});

	describe("setEpisodeCount", () => {
		beforeEach(() => {
			episodeCount = 2;
			program.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", () => program.episodeCount.should.equal(episodeCount));
		it("should set the progress bar total", () => program.progressBar.total.should.equal(episodeCount));
	});

	describe("setWatchedCount", () => {
		it("should set the watched count", () => {
			watchedCount = 2;
			program.setWatchedCount(watchedCount);
			program.watchedCount.should.equal(watchedCount);
		});
	});

	describe("setWatchedProgress", () => {
		const testParams = [
			{
				description: "null",
				watchedCount: null,
				progressBarDisplay: {
					label: null,
					percent: 0,
					style: "watched"
				}
			},
			{
				description: "zero",
				watchedCount: 0,
				progressBarDisplay: {
					label: 0,
					percent: 0,
					style: "watched"
				}
			},
			{
				description: "non-zero",
				watchedCount: 1,
				progressBarDisplay: {
					label: 1,
					percent: 100,
					style: "watched"
				}
			}
		];

		testParams.forEach(params => {
			describe(params.description, () => {
				it("should update the progress bar display", () => {
					program.watchedCount = params.watchedCount;
					program.setWatchedProgress();
					program.progressBarDisplay.should.deep.equal(params.progressBarDisplay);
				});
			});
		});
	});

	describe("setRecordedCount", () => {
		const testParams = [
			{
				description: "null",
				recordedCount: null,
				progressBarDisplay: {
					label: null,
					percent: 0,
					style: "recorded"
				}
			},
			{
				description: "zero",
				recordedCount: 0,
				progressBarDisplay: {
					label: 0,
					percent: 0,
					style: "recorded"
				}
			},
			{
				description: "non-zero",
				recordedCount: 1,
				progressBarDisplay: {
					label: 1,
					percent: 100,
					style: "recorded"
				}
			}
		];

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => program.setRecordedCount(params.recordedCount));

				it("should set the recorded count", () => {
					if (null === params.recordedCount) {
						(null === program.recordedCount).should.be.true;
					} else {
						program.recordedCount.should.equal(params.recordedCount);
					}
				});

				it("should update the progress bar display", () => program.progressBarDisplay.should.deep.equal(params.progressBarDisplay));
			});
		});
	});

	describe("setExpectedCount", () => {
		const testParams = [
			{
				description: "null",
				expectedCount: null,
				progressBarDisplay: {
					label: null,
					percent: 0,
					style: "expected"
				}
			},
			{
				description: "zero",
				expectedCount: 0,
				progressBarDisplay: {
					label: 0,
					percent: 0,
					style: "expected"
				}
			},
			{
				description: "non-zero",
				expectedCount: 1,
				progressBarDisplay: {
					label: 1,
					percent: 100,
					style: "expected"
				}
			}
		];

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => program.setExpectedCount(params.expectedCount));

				it("should set the expected count", () => {
					if (null === params.expectedCount) {
						(null === program.expectedCount).should.be.true;
					} else {
						program.expectedCount.should.equal(params.expectedCount);
					}
				});

				it("should update the progress bar display", () => program.progressBarDisplay.should.deep.equal(params.progressBarDisplay));
			});
		});
	});

	describe("list", () => {
		let sql;

		beforeEach(() => {
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

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(sql);
				Program.list(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Program.list: Force failed"));
		});

		describe("no rows affected", () => {
			beforeEach(() => {
				appController.db.noRowsAffectedAt(sql);
				Program.list(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});

		describe("success", () => {
			beforeEach(() => {
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

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([program]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("find", () => {
		beforeEach(() => (callback = sinon.stub()));

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(`
					SELECT	ProgramID,
									Name
					FROM		Program
					WHERE		ProgramID = ${id}
				`);
				Program.find(id, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(null));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Program.find: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{
					ProgramID: id,
					Name: programName
				}]);

				program.seriesCount = Reflect.undefined;
				program.setEpisodeCount();
				program.setWatchedCount();
				program.setRecordedCount();
				program.setExpectedCount();

				Program.find(id, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith(program));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("count", () => {
		beforeEach(() => (callback = sinon.stub()));

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(`
					SELECT	COUNT(*) AS ProgramCount
					FROM Program
				`);
				Program.count(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(0));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Program.count: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{ProgramCount: 1}]);
				Program.count(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith(1));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("removeAll", () => {
		beforeEach(() => (callback = sinon.stub()));

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt("DELETE FROM Program");
				Program.removeAll(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(appController.db.errorMessage));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Program.removeAll: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => Program.removeAll(callback));

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.called);
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("fromJson", () => {
		it("should construct a Program object from the JSON", () => Program.fromJson({id, programName}).should.deep.equal(new Program(id, programName)));
	});

	afterEach(() => appController.db.reset());
});