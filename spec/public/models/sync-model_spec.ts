import {
	ModelType,
	SyncAction
} from "models";
import sinon, {SinonStub} from "sinon";
import ApplicationControllerMock from "mocks/application-controller-mock";
import Sync from "../../../src/models/sync-model";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("Sync", (): void => {
	let type: ModelType,
			id: string,
			action: SyncAction,
			sync: Sync,
			callback: SinonStub;

	beforeEach((): void => {
		type = "Program";
		id = "1";
		action = "modified";
		sync = new Sync(type, id, action);
	});

	describe("object constructor", (): void => {
		it("should return a Sync instance", (): Chai.Assertion => sync.should.be.an.instanceOf(Sync));
		it("should set the type", (): Chai.Assertion => String(sync.type).should.equal(type));
		it("should set the id", (): Chai.Assertion => String(sync.id).should.equal(id));
		it("should set the action", (): Chai.Assertion => String(sync.action).should.equal(action));
	});

	describe("list", (): void => {
		let sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			sql = `
				SELECT	Type,
								ID,
								Action
				FROM		Sync
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Sync.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Sync.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					Type: type,
					ID: id,
					Action: action
				}]);
				Sync.list(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([sync]));
			it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
		});
	});

	describe("count", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("SELECT COUNT(*) AS SyncCount FROM Sync");
				Sync.count(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(0));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{SyncCount: 1}]);
				Sync.count(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(1));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("removeAll", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("DELETE FROM Sync");
				Sync.removeAll(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(`Sync.removeAll: ${appController.db.errorMessage}`));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => Sync.removeAll(callback));

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("remove", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`
					DELETE FROM Sync
					WHERE	Type = ${type} AND
								ID = ${id}
				`);
				sync.remove();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the type", (): Chai.Assertion => String(sync.type).should.equal(type));
			it("should not clear the id", (): Chai.Assertion => String(sync.id).should.equal(id));
		});

		describe("success", (): void => {
			beforeEach((): void => sync.remove());

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
			it("should clear the type", (): Chai.Assertion => (null === sync.type).should.be.true);
			it("should clear the id", (): Chai.Assertion => (null === sync.id).should.be.true);
		});
	});

	afterEach((): void => appController.db.reset());
});