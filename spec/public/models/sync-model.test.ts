import type {
	ModelType,
	SyncAction
} from "~/models";
import DatabaseServiceMock from "~/mocks/database-service-mock";
import type { SinonStub } from "sinon";
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
		it("should return a Sync instance", (): Chai.Assertion => expect(sync).to.be.an.instanceOf(Sync));
		it("should set the type", (): Chai.Assertion => expect(String(sync.type)).to.equal(type));
		it("should set the id", (): Chai.Assertion => expect(String(sync.id)).to.equal(id));
		it("should set the action", (): Chai.Assertion => expect(String(sync.action)).to.equal(action));
	});

	describe("list", (): void => {
		let syncList: Sync[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.list as SinonStub).throws();
				syncList = await Sync.list();
			});

			it("should attempt to get the list of syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.list).to.have.been.called);
			it("should return an empty array", (): Chai.Assertion => expect(syncList).to.deep.equal([]));
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

			it("should attempt to get the list of syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.list).to.have.been.called);
			it("should return the list of syncs", (): Chai.Assertion => expect(syncList).to.deep.equal([sync]));
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

			it("should attempt to get the count of syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.count).to.have.been.called);
			it("should return zero", (): Chai.Assertion => expect(count).to.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.count as SinonStub).returns(1);
				count = await Sync.count();
			});

			it("should attempt to get the count of syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.count).to.have.been.called);
			it("should return the count of syncs", (): Chai.Assertion => expect(count).to.equal(1));
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

			it("should attempt to remove all syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.removeAll).to.have.been.called);
			it("should return an error message", (): Chai.Assertion => expect(String(errorMessage)).to.equal("Sync.removeAll: Force failed"));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<string | undefined> => (errorMessage = await Sync.removeAll()));

			it("should attempt to remove all syncs", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.removeAll).to.have.been.called);
			it("should not return an error message", (): Chai.Assertion => expect(errorMessage).to.be.undefined);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.removeAll as SinonStub).reset());
	});

	describe("remove", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).syncsStore.remove as SinonStub).throws();
				try {
					await sync.remove();
				} catch (_e: unknown) {
					// No op
				}
			});

			it("should attempt to remove the sync", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.remove).to.have.been.calledWith(type, id));
			it("should not clear the type", (): Chai.Assertion => expect(String(sync.type)).to.equal(type));
			it("should not clear the id", (): Chai.Assertion => expect(String(sync.id)).to.equal(id));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => sync.remove());

			it("should attempt to remove the sync", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).syncsStore.remove).to.have.been.calledWith(type, id));
			it("should clear the type", (): Chai.Assertion => expect(sync.type).to.be.null);
			it("should clear the id", (): Chai.Assertion => expect(sync.id).to.be.null);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).syncsStore.remove as SinonStub).reset());
	});
});