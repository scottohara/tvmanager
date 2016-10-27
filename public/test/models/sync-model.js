define(
	[
		"models/sync-model",
		"controllers/application-controller"
	],

	(Sync, ApplicationController) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("Sync", () => {
			let type,
					id,
					action,
					sync,
					callback;

			beforeEach(() => {
				type = "test-sync";
				id = "1";
				action = "modified";
				sync = new Sync(type, id, action);
			});

			describe("object constructor", () => {
				it("should return a Sync instance", () => sync.should.be.an.instanceOf(Sync));
				it("should set the type", () => sync.type.should.equal(type));
				it("should set the id", () => sync.id.should.equal(id));
				it("should set the action", () => sync.action.should.equal(action));
			});

			describe("remove", () => {
				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(`
							DELETE FROM Sync
							WHERE	Type = ${type} AND
										ID = ${id}
						`);
						sync.remove();
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should not clear the type", () => sync.type.should.equal(type));
					it("should not clear the id", () => sync.id.should.equal(id));
				});

				describe("success", () => {
					beforeEach(() => sync.remove());

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					it("should clear the type", () => (null === sync.type).should.be.true);
					it("should clear the id", () => (null === sync.id).should.be.true);
				});
			});

			describe("list", () => {
				let sql;

				beforeEach(() => {
					callback = sinon.stub();
					sql = `
						SELECT	Type,
										ID,
										Action
						FROM		Sync
					`;
				});

				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(sql);
						Sync.list(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Sync.list: Force failed"));
				});

				describe("no rows affected", () => {
					beforeEach(() => {
						appController.db.noRowsAffectedAt(sql);
						Sync.list(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});

				describe("success", () => {
					beforeEach(() => {
						appController.db.addResultRows([{
							Type: type,
							ID: id,
							Action: action
						}]);
						Sync.list(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([sync]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("count", () => {
				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt("SELECT COUNT(*) AS SyncCount FROM Sync");
						Sync.count(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith(0));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Sync.count: Force failed"));
				});

				describe("success", () => {
					beforeEach(() => {
						appController.db.addResultRows([{SyncCount: 1}]);
						Sync.count(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith(1));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("removeAll", () => {
				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt("DELETE FROM Sync");
						Sync.removeAll(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith(appController.db.errorMessage));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Sync.removeAll: Force failed"));
				});

				describe("success", () => {
					beforeEach(() => Sync.removeAll(callback));

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.called);
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			afterEach(() => appController.db.reset());
		});
	}
);
