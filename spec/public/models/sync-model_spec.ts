import {
	ModelType,
	SyncAction
} from "models";
import DatabaseServiceMock from "mocks/database-service-mock";
import { SinonStub } from "sinon";
import Sync from "../../../src/models/sync-model";

describe("Sync", (): void => {
	let type: ModelType,
			id: string,
			action: SyncAction,
			sync: Sync;

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
		let syncList: Sync[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.list as SinonStub).throws();
				syncList = await Sync.list();
			});

			it("should attempt to get the list of syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.list.should.have.been.called);
			it("should return an empty array", (): Chai.Assertion => syncList.should.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.list as SinonStub).returns([{
					Type: type,
					ID: id,
					Action: action
				}]);
				syncList = await Sync.list();
			});

			it("should attempt to get the list of syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.list.should.have.been.called);
			it("should return the list of syncs", (): Chai.Assertion => syncList.should.deep.equal([sync]));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.list as SinonStub).reset());
	});

	describe("count", (): void => {
		let count: number;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.count as SinonStub).throws();
				count = await Sync.count();
			});

			it("should attempt to get the count of syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.count.should.have.been.called);
			it("should return zero", (): Chai.Assertion => count.should.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.count as SinonStub).returns(1);
				count = await Sync.count();
			});

			it("should attempt to get the count of syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.count.should.have.been.called);
			it("should return the count of syncs", (): Chai.Assertion => count.should.equal(1));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.count as SinonStub).reset());
	});

	describe("removeAll", (): void => {
		let errorMessage: string | undefined;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.removeAll as SinonStub).throws(new Error("Force failed"));
				errorMessage = await Sync.removeAll();
			});

			it("should attempt to remove all syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.removeAll.should.have.been.called);
			it("should return an error message", (): Chai.Assertion => String(errorMessage).should.equal("Sync.removeAll: Force failed"));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<string | undefined> => (errorMessage = await Sync.removeAll()));

			it("should attempt to remove all syncs", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.removeAll.should.have.been.called);
			it("should not return an error message", (): Chai.Assertion => (undefined === errorMessage).should.be.true);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.removeAll as SinonStub).reset());
	});

	describe("remove", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.remove as SinonStub).throws();
				try {
					await sync.remove();
				} catch (_e) {
					// No op
				}
			});

			it("should attempt to remove the sync", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.remove.should.have.been.calledWith(type, id));
			it("should not clear the type", (): Chai.Assertion => String(sync.type).should.equal(type));
			it("should not clear the id", (): Chai.Assertion => String(sync.id).should.equal(id));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => sync.remove());

			it("should attempt to remove the sync", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).syncsStore.remove.should.have.been.calledWith(type, id));
			it("should clear the type", (): Chai.Assertion => (null === sync.type).should.be.true);
			it("should clear the id", (): Chai.Assertion => (null === sync.id).should.be.true);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.remove as SinonStub).reset());
	});
});