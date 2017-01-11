let dbMode;

export default class DatabaseControllerMock {
	constructor(databaseName, callback, errorCallback) {
		this.name = databaseName;

		switch (dbMode) {
			case "304":
				break;

			case "Fail":
				errorCallback({message: "Error"});
				break;

			case "Upgrade":
				this.version = "1.1";
				callback({initial: "1.0", current: "1.1"});
				break;

			default:
				this.version = "1.1";
				callback({initial: "1.1", current: "1.1"});
		}
	}

	static set mode(mode) {
		dbMode = mode;
	}
}