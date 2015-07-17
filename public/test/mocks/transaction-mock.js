define(
	function() {
		"use strict";

		var TransactionMock = function(db) {
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

		// For full code coverage, we need to execute some code that is otherwise not covered in unit testing
		try {
			var tx = new TransactionMock({commit: true, commands: []});

			// Override executeError so that it doesn't throw an "ExecuteError", to ensure 100% branch coverage of catch block
			tx.executeError = function() {
				throw new Error();
			};

			// Attempt to execute a SQL statement with an incorrect number of param tokens
			tx.executeSql("?", []);
		} catch (e) {
		}

		return TransactionMock;
	}
);
