import {
	DatabaseErrorCallback,
	DatabaseSuccessCallback
} from "services";
import sinon from "sinon";

type DBMode = "Fail" | "Upgrade" | undefined;

let dbMode: DBMode;

export default class DatabaseServiceMock {
	public static connect(_: string, callback: DatabaseSuccessCallback, errorCallback: DatabaseErrorCallback): Database {
		let db!: Database;

		switch (dbMode) {
			case "Fail":
				errorCallback({ code: 0, message: "Error" });
				break;

			case "Upgrade":
				db = {
					version: "1.1",
					transaction: sinon.stub(),
					readTransaction: sinon.stub(),
					changeVersion: sinon.stub()
				};
				callback({ initial: "1.0", current: "1.1" });
				break;

			default:
				db = {
					version: "1.1",
					transaction: sinon.stub(),
					readTransaction: sinon.stub(),
					changeVersion: sinon.stub()
				};
				callback({ initial: "1.1", current: "1.1" });
		}

		return db;
	}

	public static set mode(mode: DBMode) {
		dbMode = mode;
	}
}