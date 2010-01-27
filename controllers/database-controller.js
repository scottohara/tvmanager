function DatabaseController(callback, errorCallback) {
	this.name = "TVManager";
	this.displayName = "TV Manager";
	this.estimatedSize = "10000";
	this.successCallback = callback;
	this.errorCallback = errorCallback;
	this.initialVersion = "";

	this.expectedVersion = "1.3";

	this.upgrades = [
		{
			version: "",
			upgradeHandler: this.v1_0.bind(this)
		},
		{
			version: "1.0",
			upgradeHandler: this.v1_1.bind(this)
		},
		{
			version: "1.1",
			upgradeHandler: this.v1_2.bind(this)
		},
		{
			version: "1.2",
			upgradeHandler: this.v1_3.bind(this)
		}
	];

	this.openDb();

	if (this.db) {
		this.initialVersion = this.db.version;
		if (this.initialVersion != this.expectedVersion) {
			var startIndex = 0;
			var endIndex = this.upgrades.length;
			for (var i = 0; i < this.upgrades.length; i++) {
				if (this.upgrades[i].version === this.initialVersion) {
					startIndex = i;
				}
				if (this.upgrades[i].version === this.expectedVersion) {
					endIndex = i;
					break;
				}
			}

			this.db.changeVersion(this.initialVersion, this.expectedVersion,
				function(tx) {
					for (var i = startIndex; i < endIndex; i++) {
						this.upgrades[i].upgradeHandler(tx);
					}
				}.bind(this),
				this.errorCallback,
				this.versionOK.bind(this)
			);
		} else {
			this.versionOK();
		}
	} else {
		this.errorCallback({code: 0, message: "Unable to open database" + this.name});
	}

	return this.db;
}

DatabaseController.prototype.openDb = function() {
	this.db = openDatabase(this.name, "", this.displayName, this.estimatedSize);
}

DatabaseController.prototype.versionOK = function() {
	if (this.initialVersion != this.expectedVersion) {
		this.openDb();
	}

	this.successCallback({initial: this.initialVersion, current: this.expectedVersion});
}

DatabaseController.prototype.v1_0 = function(tx) {
	tx.executeSql("CREATE TABLE IF NOT EXISTS Program (Name)");
	tx.executeSql("CREATE TABLE IF NOT EXISTS Series (Name, ProgramID)");
	tx.executeSql("CREATE TABLE IF NOT EXISTS Episode (Name, SeriesID)");
}

DatabaseController.prototype.v1_1 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN Status");
}

DatabaseController.prototype.v1_2 = function(tx) {
	tx.executeSql("ALTER TABLE Episode ADD COLUMN StatusDate");
}

DatabaseController.prototype.v1_3 = function(tx) {
	tx.executeSql("ALTER TABLE Series ADD COLUMN NowShowing");
}