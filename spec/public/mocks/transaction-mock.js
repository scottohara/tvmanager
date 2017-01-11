export default class TransactionMock {
	constructor(db) {
		this.db = db;
	}

	executeSql(sql, params, successCallback, errorCallback) {
		if (this.db.commit) {
			let commit = false;

			try {
				const tokens = sql.match(/\?/g),
							WHITESPACE = /\s+/g;

				if (tokens && tokens.length !== params.length) {
					this.db.commands.push({originalSql: sql});
					this.executeError("Number of ?s doesn't match number of parameters");
				}

				let parsedSql = sql.replace(WHITESPACE, " ");

				if (params) {
					params.forEach(param => (parsedSql = parsedSql.replace(/\?/, param)));
				}

				this.db.commands.push({
					originalSql: sql,
					parsedSql
				});

				if (this.db.failAtSql && this.db.failAtSql.test(parsedSql)) {
					this.executeError("Force failed");
				} else if (successCallback) {
					let rowsAffected = 1,
							rows = [];

					if (this.db.noRowsAffectedAtSql && this.db.noRowsAffectedAtSql.test(parsedSql)) {
						rowsAffected = null;
					} else {
						rows = this.db.resultRows;
					}

					try {
						successCallback(this, {rowsAffected, rows});
						commit = true;
					} catch (successError) {
						this.db.errorMessage = successError.message;
					} finally {
						this.db.commit = commit;
					}
				}
			} catch (e) {
				if ("ExecuteError" === e.name) {
					if (errorCallback) {
						try {
							this.db.errorMessage = errorCallback(this, e);
							commit = false === this.db.errorMessage;
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
	}

	executeError(message) {
		const e = new Error(message);

		e.name = "ExecuteError";
		throw e;
	}
}

// For full code coverage, we need to execute some code that is otherwise not covered in unit testing
try {
	const tx = new TransactionMock({commit: true, commands: []});

	// Override executeError so that it doesn't throw an "ExecuteError", to ensure 100% branch coverage of catch block
	tx.executeError = sinon.stub().throws();

	// Attempt to execute a SQL statement with an incorrect number of param tokens
	tx.executeSql("?", []);
} finally {

	// No op
}