import {
	ModelType,
	SyncAction
} from "models";
import sinon, {SinonStub} from "sinon";

const removeStub: SinonStub = sinon.stub(),
			listStub: SinonStub = sinon.stub(),
			countStub: SinonStub = sinon.stub(),
			removeAllStub: SinonStub = sinon.stub().yields();

let syncList: SyncMock[] = [];

export default class SyncMock {
	public constructor(public type: ModelType | null,
						public id: string | null,
						public readonly action?: SyncAction) {
		removeStub.reset();
	}

	public get remove(): SinonStub<void[], void> {
		return removeStub;
	}

	public static reset(): void {
		syncList = [];
		removeStub.reset();
	}

	public static get list(): SinonStub<void[], SyncMock[]> {
		return listStub.yields(syncList);
	}

	public static get count(): SinonStub<void[], number> {
		return countStub.yields(syncList.length);
	}

	public static get removeAll(): SinonStub<void[], void> {
		return removeAllStub;
	}

	public static get syncList(): SyncMock[] {
		return syncList;
	}

	public static set syncList(list: SyncMock[]) {
		syncList = list;
	}
}