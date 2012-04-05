DatabaseMock = function() {
	this.commit = true;
	this.errorMessage = null;
	this.commands = [];
	this.resultRows = [];
	this.version = "1.0";
};

DatabaseMock.prototype.transaction = function(callback, errorCallback, successCallback) {
	var tx = new TransactionMock(this);
	callback(tx);
	if (this.commit) {
		if (successCallback) {
			successCallback();
		}
	} else {
		if (errorCallback) {
			tx.db.errorMessage = errorCallback({
				code: 0,
				message: this.errorMessage
			});
		}
	}
};

DatabaseMock.prototype.readTransaction = function(callback, errorCallback, successCallback) {
	this.transaction(callback, errorCallback, successCallback);
};

DatabaseMock.prototype.changeVersion = function(initialVersion, expectedVersion, callback, errorCallback, successCallback) {
	equals(initialVersion, this.version, "Initial version");
	this.transaction(callback, errorCallback, successCallback);
	if (this.commit) {
		equals(expectedVersion, this.version, "Expected version");
	}
};

DatabaseMock.prototype.failAt = function(sql) {
	this.failAtSql = new RegExp(sql.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&").replace(/%/, '(.*)'), 'g');
};

DatabaseMock.prototype.noRowsAffectedAt = function(sql) {
	this.noRowsAffectedAtSql = new RegExp(sql.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&").replace(/%/, '(.*)'), 'g');
};

DatabaseMock.prototype.addResultRows = function(rows) {
	this.resultRows = {
		data: rows,
		length: rows.length,
		item: function(index) {
			return this.data[index];
		}
	};
};

TransactionMock = function(db) {
	this.db = db;
};

TransactionMock.prototype.executeSql = function(sql, params, successCallback, errorCallback) {
	if (this.db.commit) {
		var commit = false;

		try {
			var tokens = sql.match(/\?/g);
			if (tokens && tokens.length !== params.length) {
				this.db.commands.push({
					originalSql: sql
				});
				this.executeError("Number of ?s doesn't match number of parameters");
			}

			var parsedSql = sql;
			if (params) {
				for (var i = 0; i < params.length; i++) {
					parsedSql = parsedSql.replace(/\?/, params[i]);
				}
			}

			this.db.commands.push({
				originalSql: sql,
				parsedSql: parsedSql
			});

			if (this.db.failAtSql && this.db.failAtSql.test(parsedSql)) {
				this.executeError("Force failed");
			} else {
				if (successCallback) {
					var rowsAffected = 1;
					var rows = [];
					if (this.db.noRowsAffectedAtSql && this.db.noRowsAffectedAtSql.test(parsedSql)) {
						rowsAffected = null;
					} else {
						rows = this.db.resultRows;
					}

					try {
						successCallback(this, {
							rowsAffected: rowsAffected,
							rows: rows
						});
						commit = true;
					} catch(successError) {
						this.db.errorMessage = successError.message;
					} finally {
						this.db.commit = commit;
					}
				}
			}
		} catch (e) {
			if ("ExecuteError" === e.name) {
				if (errorCallback) {
					try {
						this.db.errorMessage = errorCallback(this, e);
						commit = (false === this.db.errorMessage);
					} finally {
						this.db.commit = commit;
					}
				} else {
					this.db.errorMessage = e.message;
				}
			}

			this.db.commit = commit;
		}
	}
};

TransactionMock.prototype.executeError = function(message) {
	var e = new Error(message);
	e.name = "ExecuteError";
	throw e;
};
