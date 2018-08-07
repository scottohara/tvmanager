import DatabaseMock, {SQLCommand} from "mocks/database-mock";
import sinon, {SinonStub} from "sinon";
import DatabaseService from "../../../src/services/database-service";
import TransactionMock from "mocks/transaction-mock";
import WindowMock from "mocks/window-mock";

describe("DatabaseService", (): void => {
	let databaseName: string,
			callback: SinonStub,
			errorCallback: SinonStub,
			openDbStub: SinonStub,
			database: DatabaseMock;

	beforeEach((): void => {
		databaseName = "test-db";
		callback = sinon.stub();
		errorCallback = sinon.stub();
		openDbStub = sinon.stub(DatabaseService, "openDb" as keyof DatabaseService);
		database = new DatabaseMock();
		WindowMock.openDatabase.reset();
		WindowMock.openDatabase.returns(database);
		DatabaseService.connect(databaseName, callback, errorCallback);
	});

	describe("connect", (): void => {
		let versionOkStub: SinonStub,
				startUpgradeStub: SinonStub;

		beforeEach((): void => {
			versionOkStub = sinon.stub(DatabaseService, "versionOK" as keyof DatabaseService);
			startUpgradeStub = sinon.stub(DatabaseService, "startUpgrade" as keyof DatabaseService);
		});

		describe("error", (): void => {
			it("should attempt to open the database", (): Chai.Assertion => openDbStub.should.have.been.called);
			it("should not determine that the version is OK", (): Chai.Assertion => versionOkStub.should.not.have.been.called);
			it("should not start the upgrade", (): Chai.Assertion => startUpgradeStub.should.not.have.been.called);
			it("should invoke the error callback", (): Chai.Assertion => errorCallback.should.have.been.calledWith({
				code: 0,
				message: `Unable to open database ${databaseName}`
			}));
		});

		describe("success", (): void => {
			beforeEach((): void => {
				openDbStub.restore();
				errorCallback.reset();
			});

			describe("without upgrade", (): void => {
				beforeEach((): void => {
					database.version = DatabaseService["expectedVersion"];
					DatabaseService.connect(databaseName, callback, errorCallback);
				});

				it("should attempt to open the database", (): Chai.Assertion => WindowMock.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseService["displayName"], DatabaseService["estimatedSize"]));
				it("should determine that the version is OK", (): Chai.Assertion => versionOkStub.should.have.been.called);
				it("should not start the upgrade", (): Chai.Assertion => startUpgradeStub.should.not.have.been.called);
				it("should not invoke the error callback", (): Chai.Assertion => errorCallback.should.not.have.been.called);
			});

			describe("with upgrade", (): void => {
				beforeEach((): Database => DatabaseService.connect(databaseName, callback, errorCallback));

				it("should attempt to open the database", (): Chai.Assertion => WindowMock.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseService["displayName"], DatabaseService["estimatedSize"]));
				it("should not determine that the version is OK", (): Chai.Assertion => versionOkStub.should.not.have.been.called);
				it("should start the upgrade", (): Chai.Assertion => startUpgradeStub.should.have.been.calledWith(errorCallback));
				it("should not invoke the error callback", (): Chai.Assertion => errorCallback.should.not.have.been.called);
			});
		});

		afterEach((): void => {
			versionOkStub.restore();
			startUpgradeStub.restore();
		});
	});

	describe("upgrades", (): void => {
		it("should return an array of upgrade routines", (): Chai.Assertion => DatabaseService["upgrades"].should.be.an("array"));
	});

	describe("openDb", (): void => {
		it("should open the database", (): void => {
			openDbStub.restore();
			DatabaseService["openDb"]();
			WindowMock.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseService["displayName"], DatabaseService["estimatedSize"]);
		});
	});

	describe("versionOK", (): void => {
		beforeEach((): void => {
			openDbStub.reset();
			callback.reset();
			DatabaseService["initialVersion"] = "";
		});

		describe("upgraded", (): void => {
			beforeEach((): void => DatabaseService["versionOK"]());

			it("should reopen the database", (): Chai.Assertion => openDbStub.should.have.been.called);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith({initial: "", current: DatabaseService["expectedVersion"]}));
		});

		describe("not upgraded", (): void => {
			beforeEach((): void => {
				DatabaseService["initialVersion"] = DatabaseService["expectedVersion"];
				DatabaseService["versionOK"]();
			});

			it("should not reopen the database", (): Chai.Assertion => openDbStub.should.not.have.been.called);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith({initial: DatabaseService["expectedVersion"], current: DatabaseService["expectedVersion"]}));
		});
	});

	describe("startUpgrade", (): void => {
		interface Scenario {
			description: string;
			initialVersion: string;
			expectedVersion?: DOMString;
			startIndex?: number;
			endIndex?: number;
		}

		const scenarios: Scenario[] = [
			{
				description: "partial",
				initialVersion: "1.0",
				expectedVersion: "1.1",
				startIndex: 1,
				endIndex: 2
			},
			{
				description: "full",
				initialVersion: ""
			},
			{
				description: "invalid",
				initialVersion: "bad"
			}
		];

		let nextUpgradeStub: SinonStub,
				versionOkStub: SinonStub;

		beforeEach((): void => {
			DatabaseService["db"] = database;
			nextUpgradeStub = sinon.stub(DatabaseService, "nextUpgrade" as keyof DatabaseService);
			versionOkStub = sinon.stub(DatabaseService, "versionOK" as keyof DatabaseService);
			errorCallback.reset();
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let expectedVersionStub: SinonStub;

				beforeEach((): void => {
					DatabaseService["initialVersion"] = scenario.initialVersion;
					if (scenario.expectedVersion) {
						expectedVersionStub = sinon.stub(DatabaseService, "expectedVersion" as keyof DatabaseService).get((): DOMString => String(scenario.expectedVersion));
					}
				});

				describe("fail", (): void => {
					beforeEach((): void => {
						database.commit = false;
						DatabaseService["startUpgrade"](errorCallback);
					});

					it("should determine the upgrades to apply", (): Chai.Assertion => DatabaseService["upgradesToApply"].should.deep.equal(DatabaseService["upgrades"].slice(scenario.startIndex, scenario.endIndex)));
					it("should change the database version", (): Chai.Assertion => database.changeVersion.should.have.been.calledWith(scenario.initialVersion, DatabaseService["expectedVersion"], sinon.match.func));
					it("should invoke the first upgrade handler", (): Chai.Assertion => nextUpgradeStub.should.have.been.calledOnce);
					it("should invoke the error callback", (): Chai.Assertion => errorCallback.should.have.been.called);
					it("should not determine that the version is OK", (): Chai.Assertion => versionOkStub.should.not.have.been.called);
				});

				describe("success", (): void => {
					beforeEach((): void => DatabaseService["startUpgrade"](errorCallback));

					it("should determine the upgrades to apply", (): Chai.Assertion => DatabaseService["upgradesToApply"].should.deep.equal(DatabaseService["upgrades"].slice(scenario.startIndex, scenario.endIndex)));
					it("should change the database version", (): Chai.Assertion => database.changeVersion.should.have.been.calledWith(scenario.initialVersion, DatabaseService["expectedVersion"], sinon.match.func));
					it("should invoke the first upgrade handler", (): Chai.Assertion => nextUpgradeStub.should.have.been.calledOnce);
					it("should determine that the version is OK", (): Chai.Assertion => versionOkStub.should.have.been.called);
					it("should not invoke the error callback", (): Chai.Assertion => errorCallback.should.not.have.been.called);
				});

				afterEach((): void => {
					if (expectedVersionStub) {
						expectedVersionStub.restore();
					}
				});
			});
		});

		afterEach((): void => {
			nextUpgradeStub.restore();
			versionOkStub.restore();
		});
	});

	describe("nextUpgrade", (): void => {
		let tx: TransactionMock;

		beforeEach((): TransactionMock => (tx = new TransactionMock(database)));

		describe("not done", (): void => {
			it("should invoke the next upgrade handler", (): void => {
				const upgradeHandler: SinonStub = sinon.stub();

				DatabaseService["upgradesToApply"] = [{version: "", upgradeHandler}];
				DatabaseService["nextUpgrade"](tx);
				upgradeHandler.should.have.been.calledWith(tx);
			});
		});

		describe("done", (): void => {
			it("should do nothing", (): void => {
				DatabaseService["upgradesToApply"] = [];
				DatabaseService["nextUpgrade"](tx);
			});
		});
	});

	describe("upgrade handlers", (): void => {
		interface Scenario {
			description: string;
			commands: string[];
			data?: object[];
		}

		const scenarios: Scenario[] = [
			{
				description: "v1_0",
				commands: [
					"CREATE TABLE IF NOT EXISTS Program (Name)",
					"CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)",
					"CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)"
				]
			},
			{
				description: "v1_1",
				commands: ["ALTER TABLE Episode ADD COLUMN Status"]
			},
			{
				description: "v1_2",
				commands: ["ALTER TABLE Episode ADD COLUMN StatusDate"]
			},
			{
				description: "v1_3",
				commands: ["ALTER TABLE Series ADD COLUMN NowShowing"]
			},
			{
				description: "v1_4",
				commands: ["ALTER TABLE Episode ADD COLUMN Unverified"]
			},
			{
				description: "v1_5",
				commands: ["CREATE TABLE IF NOT EXISTS Setting (Name, Value)"]
			},
			{
				description: "v1_6",
				commands: ["ALTER TABLE Episode ADD COLUMN Unscheduled"]
			},
			{
				description: "v1_7",
				commands: [
					"ALTER TABLE Episode ADD COLUMN Sequence",
					"SELECT rowid, SeriesID FROM Episode ORDER BY SeriesID",
					"UPDATE Episode SET Sequence = 0 WHERE rowid = 1",
					"UPDATE Episode SET Sequence = 1 WHERE rowid = 2",
					"UPDATE Episode SET Sequence = 0 WHERE rowid = 3"
				],
				data: [
					{
						rowid: 1,
						SeriesID: 1
					},
					{
						rowid: 2,
						SeriesID: 1
					},
					{
						rowid: 3,
						SeriesID: 2
					}
				]
			},
			{
				description: "v1_8",
				commands: [
					"ALTER TABLE Program ADD COLUMN ProgramID",
					"ALTER TABLE Series ADD COLUMN SeriesID",
					"ALTER TABLE Episode ADD COLUMN EpisodeID",
					"SELECT rowid FROM Program",
					"UPDATE Program SET ProgramID = uuid WHERE rowid = 1",
					"UPDATE Series SET ProgramID = uuid WHERE ProgramID = 1",
					"UPDATE Program SET ProgramID = uuid WHERE rowid = 2",
					"UPDATE Series SET ProgramID = uuid WHERE ProgramID = 2",
					"CREATE TABLE tmp_Program (ProgramID PRIMARY KEY NOT NULL, Name)",
					"INSERT INTO tmp_Program (ProgramID, Name) SELECT ProgramID, Name FROM Program",
					"DROP TABLE Program",
					"ALTER TABLE tmp_Program RENAME TO Program",
					"SELECT rowid FROM Series",
					"UPDATE Series SET SeriesID = uuid WHERE rowid = 1",
					"UPDATE Episode SET SeriesID = uuid WHERE SeriesID = 1",
					"UPDATE Series SET SeriesID = uuid WHERE rowid = 2",
					"UPDATE Episode SET SeriesID = uuid WHERE SeriesID = 2",
					"CREATE TABLE tmp_Series (SeriesID PRIMARY KEY NOT NULL, Name, ProgramID, NowShowing)",
					"INSERT INTO tmp_Series (SeriesID, Name, ProgramID, NowShowing) SELECT SeriesID, Name, ProgramID, NowShowing FROM Series",
					"DROP TABLE Series",
					"ALTER TABLE tmp_Series RENAME TO Series",
					"SELECT rowid FROM Episode",
					"UPDATE Episode SET EpisodeID = uuid WHERE rowid = 1",
					"UPDATE Episode SET EpisodeID = uuid WHERE rowid = 2",
					"CREATE TABLE tmp_Episode (EpisodeID PRIMARY KEY NOT NULL, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)",
					"INSERT INTO tmp_Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode",
					"DROP TABLE Episode",
					"ALTER TABLE tmp_Episode RENAME TO Episode"
				],
				data: [
					{rowid: 1},
					{rowid: 2}
				]
			},
			{
				description: "v1_9",
				commands: [
					"CREATE TABLE IF NOT EXISTS Sync (Type, ID, Action, PRIMARY KEY ( Type, ID ))",
					"INSERT INTO Sync (Type, ID, Action) SELECT 'Program', ProgramID, 'modified' FROM Program",
					"INSERT INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'modified' FROM Series",
					"INSERT INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'modified' FROM Episode",
					"DELETE FROM Setting WHERE Name = 'LastSyncHash'"
				]
			}
		];

		let tx: TransactionMock,
				nextUpgradeStub: SinonStub;

		beforeEach((): void => {
			tx = new TransactionMock(database);
			nextUpgradeStub = sinon.stub(DatabaseService, "nextUpgrade" as keyof DatabaseService);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					if (scenario.data) {
						tx.db.addResultRows(scenario.data);
					}

					DatabaseService[scenario.description as "v1_0"](tx);
				});

				it("should execute the expected SQL commands", (): Chai.Assertion => database.commands.map((command: SQLCommand): DOMString | undefined => command.parsedSql).should.deep.equal(scenario.commands));
				it("should invoke the next upgrade handler", (): Chai.Assertion => nextUpgradeStub.should.have.been.calledWith(tx));
			});
		});

		afterEach((): void => nextUpgradeStub.restore());
	});

	describe("displayName", (): void => {
		it("should return the database display name", (): Chai.Assertion => DatabaseService["displayName"].should.equal("TV Manager"));
	});

	describe("estimatedSize", (): void => {
		it("should return the estimated database size", (): Chai.Assertion => DatabaseService["estimatedSize"].should.equal(10000));
	});

	describe("expectedVersion", (): void => {
		it("should return the expected database schema version", (): Chai.Assertion => DatabaseService["expectedVersion"].should.equal("1.9"));
	});

	afterEach((): void => openDbStub.restore());
});