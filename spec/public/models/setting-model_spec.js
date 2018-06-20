import ApplicationController from "controllers/application-controller";
import Setting from "../../../src/models/setting-model";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("Setting", () => {
	let settingName,
			settingValue,
			setting,
			callback;

	beforeEach(() => {
		settingName = "test-setting";
		settingValue = "test-value";
		setting = new Setting(settingName, settingValue);
	});

	describe("object constructor", () => {
		it("should return a Setting instance", () => setting.should.be.an.instanceOf(Setting));
		it("should set the setting name", () => setting.settingName.should.equal(settingName));
		it("should set the setting value", () => setting.settingValue.should.equal(settingValue));
	});

	describe("save", () => {
		describe("delete fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Setting WHERE Name = ${settingName}`);
				setting.save();
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
		});

		describe("insert fail", () => {
			beforeEach(() => appController.db.failAt(`INSERT INTO Setting (Name, Value) VALUES (${settingName}, ${settingValue})`));

			describe("without callback", () => {
				beforeEach(() => setting.save());

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", () => appController.db.commit.should.be.false);
				it("should return an error message", () => appController.db.errorMessage.should.equal("Setting.save: Force failed"));
			});

			describe("with callback", () => {
				beforeEach(() => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", () => appController.db.commit.should.be.false);
				it("should invoke the callback", () => callback.should.have.been.calledWith(false));
				it("should return an error message", () => appController.db.errorMessage.should.equal("Setting.save: Force failed"));
			});
		});

		describe("no rows affected", () => {
			beforeEach(() => appController.db.noRowsAffectedAt(`INSERT INTO Setting (Name, Value) VALUES (${settingName}, ${settingValue})`));

			describe("without callback", () => {
				beforeEach(() => setting.save());

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", () => appController.db.commit.should.be.false);
				it("should return an error message", () => appController.db.errorMessage.should.equal("Setting.save: no rows affected"));
			});

			describe("with callback", () => {
				beforeEach(() => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", () => appController.db.commit.should.be.false);
				it("should invoke the callback", () => callback.should.have.been.calledWith(false));
				it("should return an error message", () => appController.db.errorMessage.should.equal("Setting.save: no rows affected"));
			});
		});

		describe("success", () => {
			describe("without callback", () => {
				beforeEach(() => setting.save());

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should commit the transaction", () => appController.db.commit.should.be.true);
				it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			});

			describe("with callback", () => {
				beforeEach(() => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
				it("should commit the transaction", () => appController.db.commit.should.be.true);
				it("should invoke the callback", () => callback.should.have.been.calledWith(true));
				it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			});
		});
	});

	describe("remove", () => {
		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Setting WHERE Name = ${settingName}`);
				setting.remove();
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the setting name", () => setting.settingName.should.equal(settingName));
			it("should not clear the setting value", () => setting.settingValue.should.equal(settingValue));
		});

		describe("success", () => {
			beforeEach(() => setting.remove());

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should clear the setting name", () => (null === setting.settingName).should.be.true);
			it("should clear the setting value", () => (null === setting.settingValue).should.be.true);
		});
	});

	describe("get", () => {
		let sql;

		beforeEach(() => (sql = `SELECT Value AS SettingValue FROM Setting WHERE Name = ${settingName}`));

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(sql);
				callback = sinon.stub();
				Setting.get(settingName, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.called);
			it("should return an error message", () => appController.db.errorMessage.should.equal("Setting.get: Force failed"));
		});

		describe("success", () => {
			describe("doesn't exist", () => {
				beforeEach(() => {
					appController.db.noRowsAffectedAt(sql);
					callback = sinon.stub().withArgs(sinon.match(new Setting(settingName)));
					Setting.get(settingName, callback);
				});

				it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
				it("should commit the transaction", () => appController.db.commit.should.be.true);
				it("should invoke the callback", () => callback.should.have.been.called);
				it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			});

			describe("exists", () => {
				beforeEach(() => {
					appController.db.addResultRows([{SettingValue: settingValue}]);
					callback = sinon.stub().withArgs(sinon.match(setting));
					Setting.get(settingName, callback);
				});

				it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
				it("should commit the transaction", () => appController.db.commit.should.be.true);
				it("should invoke the callback", () => callback.should.have.been.called);
				it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			});
		});
	});

	afterEach(() => appController.db.reset());
});