import type {
	ModelType,
	PersistedSync,
	SyncAction
} from "~/models";
import Base from "~/models/base-model";

export default class Sync extends Base {
	public constructor(public type: ModelType | null,
						public id: string | null,
						public readonly action?: SyncAction) {
		super();
	}

	public static async list(): Promise<Sync[]> {
		let syncList: Sync[] = [];

		try {
			syncList = await Promise.all((await (await this.db).syncsStore.list()).map((sync: PersistedSync): Sync => new Sync(sync.Type, sync.ID, sync.Action)));
		} catch {
			// No op
		}

		return syncList;
	}

	public static async count(): Promise<number> {
		let count = 0;

		try {
			count = await (await this.db).syncsStore.count();
		} catch {
			// No op
		}

		return count;
	}

	public static async removeAll(): Promise<string | undefined> {
		let errorMessage: string | undefined;

		try {
			await (await this.db).syncsStore.removeAll();
		} catch (error: unknown) {
			errorMessage = `Sync.removeAll: ${(error as Error).message}`;
		}

		return errorMessage;
	}

	public async remove(): Promise<void> {
		await (await this.db).syncsStore.remove(this.type as ModelType, String(this.id));

		// Clear the instance properties
		this.type = null;
		this.id = null;
	}
}