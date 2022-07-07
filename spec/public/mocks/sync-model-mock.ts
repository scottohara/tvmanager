import type {
	ModelType,
	SyncAction
} from "models";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const removeStub = sinon.stub(),
			listStub = sinon.stub(),
			countStub = sinon.stub(),
			removeAllStub = sinon.stub();

let syncList: SyncMock[] = [];

export default class SyncMock {
	public constructor(public type: ModelType | null,
						public id: string | null,
						public readonly action?: SyncAction) {
		removeStub.reset();
	}

	public static get list(): SinonStub<unknown[], Promise<SyncMock[]>> {
		return listStub.returns(Promise.resolve(syncList));
	}

	public static get count(): SinonStub<unknown[], Promise<number>> {
		return countStub.returns(Promise.resolve(syncList.length));
	}

	public static get removeAll(): SinonStub<unknown[], Promise<string | undefined>> {
		return removeAllStub;
	}

	public static get syncList(): SyncMock[] {
		return syncList;
	}

	public static set syncList(list: SyncMock[]) {
		syncList = list;
	}

	public get remove(): SinonStub<unknown[], Promise<void>> {
		return removeStub;
	}

	public static reset(): void {
		syncList = [];
		removeStub.reset();
	}
}