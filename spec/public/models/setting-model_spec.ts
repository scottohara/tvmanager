import sinon, {SinonStub} from "sinon";
import ApplicationControllerMock from "mocks/application-controller-mock";
import Setting from "../../../src/models/setting-model";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("Setting", (): void => {
	let settingName: string,
			settingValue: string,
			setting: Setting,
			callback: SinonStub;

	beforeEach((): void => {
		settingName = "test-setting";
		settingValue = "test-value";
		setting = new Setting(settingName, settingValue);
	});

	describe("object constructor", (): void => {
		it("should return a Setting instance", (): Chai.Assertion => setting.should.be.an.instanceOf(Setting));
		it("should set the setting name", (): Chai.Assertion => String(setting["settingName"]).should.equal(settingName));
		it("should set the setting value", (): Chai.Assertion => String(setting.settingValue).should.equal(settingValue));
	});

	describe("get", (): void => {
		let sql: string;

		beforeEach((): string => (sql = `SELECT Value AS SettingValue FROM Setting WHERE Name = ${settingName}`));

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				callback = sinon.stub();
				Setting.get(settingName, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			describe("doesn't exist", (): void => {
				beforeEach((): void => {
					appController.db.noRowsAffectedAt(sql);
					callback = sinon.stub().withArgs(sinon.match(new Setting(settingName, null)));
					Setting.get(settingName, callback);
				});

				it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
				it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
				it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
				it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
				it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
			});

			describe("exists", (): void => {
				beforeEach((): void => {
					appController.db.addResultRows([{SettingValue: settingValue}]);
					callback = sinon.stub().withArgs(sinon.match(setting));
					Setting.get(settingName, callback);
				});

				it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
				it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
				it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
				it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
			});
		});
	});

	describe("save", (): void => {
		describe("delete fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Setting WHERE Name = ${settingName}`);
				setting.save();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
		});

		describe("insert fail", (): void => {
			beforeEach((): void => appController.db.failAt(`INSERT INTO Setting (Name, Value) VALUES (${settingName}, ${settingValue})`));

			describe("without callback", (): void => {
				beforeEach((): void => setting.save());

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
				it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
			});

			describe("with callback", (): void => {
				beforeEach((): void => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
				it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(false));
				it("should return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
				it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
			});
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => appController.db.noRowsAffectedAt(`INSERT INTO Setting (Name, Value) VALUES (${settingName}, ${settingValue})`));

			describe("without callback", (): void => {
				beforeEach((): void => setting.save());

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
				it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
			});

			describe("with callback", (): void => {
				beforeEach((): void => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
				it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(false));
				it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
			});
		});

		describe("success", (): void => {
			describe("without callback", (): void => {
				beforeEach((): void => setting.save());

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
				it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
				it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
			});

			describe("with callback", (): void => {
				beforeEach((): void => {
					callback = sinon.stub();
					setting.save(callback);
				});

				it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
				it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
				it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(true));
				it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
			});
		});
	});

	describe("remove", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Setting WHERE Name = ${settingName}`);
				setting.remove();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the setting name", (): Chai.Assertion => String(setting["settingName"]).should.equal(settingName));
			it("should not clear the setting value", (): Chai.Assertion => String(setting.settingValue).should.equal(settingValue));
		});

		describe("success", (): void => {
			beforeEach((): void => setting.remove());

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should clear the setting name", (): Chai.Assertion => (null === setting["settingName"]).should.be.true);
			it("should clear the setting value", (): Chai.Assertion => (null === setting.settingValue).should.be.true);
		});
	});

	afterEach((): void => appController.db.reset());
});