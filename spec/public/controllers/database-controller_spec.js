import DatabaseController from "../../../src/controllers/database-controller";
import DatabaseMock from "mocks/database-mock";
import TransactionMock from "mocks/transaction-mock";
import window from "components/window";

describe("DatabaseController", () => {
	let databaseName,
			callback,
			errorCallback,
			openDbStub,
			database,
			db;

	beforeEach(() => {
		databaseName = "test-db";
		callback = sinon.stub();
		errorCallback = sinon.stub();
		openDbStub = sinon.stub(DatabaseController.prototype, "openDb");
		database = new DatabaseMock();
		window.openDatabase.reset();
		window.openDatabase.returns(database);
		db = new DatabaseController(databaseName, callback, errorCallback);
	});

	describe("object constructor", () => {
		let	versionOkStub,
				startUpgradeStub;

		beforeEach(() => {
			versionOkStub = sinon.stub(DatabaseController.prototype, "versionOK");
			startUpgradeStub = sinon.stub(DatabaseController.prototype, "startUpgrade");
		});

		describe("error", () => {
			it("should attempt to open the database", () => openDbStub.should.have.been.called);
			it("should not determine that the version is OK", () => versionOkStub.should.not.have.been.called);
			it("should not start the upgrade", () => startUpgradeStub.should.not.have.been.called);
			it("should invoke the error callback", () => errorCallback.should.have.been.calledWith({
				code: 0,
				message: `Unable to open database ${databaseName}`
			}));
		});

		describe("success", () => {
			beforeEach(() => {
				openDbStub.restore();
				errorCallback.reset();
			});

			describe("without upgrade", () => {
				beforeEach(() => {
					database.version = DatabaseController.expectedVersion;
					db = new DatabaseController(databaseName, callback, errorCallback);
				});

				it("should attempt to open the database", () => window.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseController.displayName, DatabaseController.estimatedSize));
				it("should determine that the version is OK", () => versionOkStub.should.have.been.called);
				it("should not start the upgrade", () => startUpgradeStub.should.not.have.been.called);
				it("should not invoke the error callback", () => errorCallback.should.not.have.been.called);
			});

			describe("with upgrade", () => {
				beforeEach(() => {
					db = new DatabaseController(databaseName, callback, errorCallback);
				});

				it("should attempt to open the database", () => window.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseController.displayName, DatabaseController.estimatedSize));
				it("should not determine that the version is OK", () => versionOkStub.should.not.have.been.called);
				it("should start the upgrade", () => startUpgradeStub.should.have.been.calledWith(errorCallback));
				it("should not invoke the error callback", () => errorCallback.should.not.have.been.called);
			});
		});

		afterEach(() => {
			versionOkStub.restore();
			startUpgradeStub.restore();
		});
	});

	describe("upgrades", () => {
		it("should return an array of upgrade routines", () => db.upgrades.should.be.an("array"));
	});

	describe("openDb", () => {
		it("should open the database", () => {
			openDbStub.restore();
			db.openDb();
			window.openDatabase.should.have.been.calledWith(databaseName, "", DatabaseController.displayName, DatabaseController.estimatedSize);
		});
	});

	describe("versionOK", () => {
		beforeEach(() => openDbStub.reset());

		describe("upgraded", () => {
			beforeEach(() => db.versionOK());

			it("should reopen the database", () => openDbStub.should.have.been.called);
			it("should invoke the callback", () => callback.should.have.been.calledWith({initial: "", current: DatabaseController.expectedVersion}));
		});

		describe("not upgraded", () => {
			beforeEach(() => {
				db.initialVersion = DatabaseController.expectedVersion;
				db.versionOK();
			});

			it("should not reopen the database", () => openDbStub.should.not.have.been.called);
			it("should invoke the callback", () => callback.should.have.been.calledWith({initial: DatabaseController.expectedVersion, current: DatabaseController.expectedVersion}));
		});
	});

	describe("startUpgrade", () => {
		const testParams = [
			{
				description: "partial",
				initialVersion: "1.0",
				expectedVersion: "1.1",
				startIndex: 1,
				endIndex: 2
			},
			{
				description: "full",
				initialVersion: "",
				expectedVersion: DatabaseController.expectedVersion
			},
			{
				description: "invalid",
				initialVersion: "bad",
				expectedVersion: "bad"
			}
		];

		beforeEach(() => {
			db.db = database;
			sinon.stub(db, "nextUpgrade");
			sinon.stub(db, "versionOK");
			errorCallback.reset();
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				let originalExpectedVersion;

				beforeEach(() => {
					originalExpectedVersion = Object.getOwnPropertyDescriptor(DatabaseController, "expectedVersion");
					sinon.stub(DatabaseController, "expectedVersion").get(() => params.expectedVersion);
					db.initialVersion = params.initialVersion;
				});

				describe("fail", () => {
					beforeEach(() => {
						database.commit = false;
						db.startUpgrade(errorCallback);
					});

					it("should determine the upgrades to apply", () => db.upgradesToApply.should.deep.equal(db.upgrades.slice(params.startIndex, params.endIndex)));
					it("should change the database version", () => database.changeVersion.should.have.been.calledWith(params.initialVersion, DatabaseController.expectedVersion, sinon.match.func));
					it("should invoke the first upgrade handler", () => db.nextUpgrade.should.have.been.calledOnce);
					it("should invoke the error callback", () => errorCallback.should.have.been.called);
					it("should not determine that the version is OK", () => db.versionOK.should.not.have.been.called);
				});

				describe("success", () => {
					beforeEach(() => db.startUpgrade(errorCallback));

					it("should determine the upgrades to apply", () => db.upgradesToApply.should.deep.equal(db.upgrades.slice(params.startIndex, params.endIndex)));
					it("should change the database version", () => database.changeVersion.should.have.been.calledWith(params.initialVersion, DatabaseController.expectedVersion, sinon.match.func));
					it("should invoke the first upgrade handler", () => db.nextUpgrade.should.have.been.calledOnce);
					it("should determine that the version is OK", () => db.versionOK.should.have.been.called);
					it("should not invoke the error callback", () => errorCallback.should.not.have.been.called);
				});

				afterEach(() => Object.defineProperty(DatabaseController, "expectedVersion", originalExpectedVersion));
			});
		});
	});

	describe("nextUpgrade", () => {
		let tx;

		beforeEach(() => (tx = {}));

		describe("not done", () => {
			it("should invoke the next upgrade handler", () => {
				const upgradeHandler = sinon.stub();

				db.upgradesToApply = [{upgradeHandler}];
				db.nextUpgrade(tx);
				upgradeHandler.should.have.been.calledWith(tx);
			});
		});

		describe("done", () => {
			it("should do nothing", () => {
				db.upgradesToApply = [];
				db.nextUpgrade(tx);
			});
		});
	});

	describe("upgrade handlers", () => {
		const testParams = [
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

		let tx;

		beforeEach(() => {
			tx = new TransactionMock(database);
			sinon.stub(db, "nextUpgrade");
		});

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					if (params.data) {
						tx.db.addResultRows(params.data);
					}

					db[params.description](tx);
				});

				it("should execute the expected SQL commands", () => database.commands.map(command => command.parsedSql).should.deep.equal(params.commands));
				it("should invoke the next upgrade handler", () => db.nextUpgrade.should.have.been.calledWith(tx));
			});
		});
	});

	describe("displayName", () => {
		it("should return the database display name", () => DatabaseController.displayName.should.equal("TV Manager"));
	});

	describe("estimatedSize", () => {
		it("should return the estimated database size", () => DatabaseController.estimatedSize.should.equal("10000"));
	});

	describe("expectedVersion", () => {
		it("should return the expected database schema version", () => DatabaseController.expectedVersion.should.equal("1.9"));
	});

	afterEach(() => openDbStub.restore());
});