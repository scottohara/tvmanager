import DatabaseMock, {SQLCommand} from "mocks/database-mock";
import sinon from "sinon";

export default class TransactionMock {
	public constructor(public readonly db: DatabaseMock) {}

	public executeSql(originalSql: DOMString, params?: ObjectArray, successCallback?: SQLStatementCallback, errorCallback?: SQLStatementErrorCallback): void {
		if (this.db.commit) {
			let commit = false;

			try {
				const tokens: RegExpMatchArray | null = originalSql.match(/\?/gu),
							WHITESPACE = /\s+/gu;

				if (tokens && params && tokens.length !== params.length) {
					this.db.commands.push({originalSql});
					this.executeError("Number of ?s doesn't match number of parameters");
				}

				let parsedSql: string = originalSql.replace(WHITESPACE, " ");

				if (params) {
					params.forEach((param: string): string => (parsedSql = parsedSql.replace(/\?/u, param)));
				}

				this.db.commands.push({
					originalSql,
					parsedSql
				});

				if (this.db.failAtSql && this.db.failAtSql.test(parsedSql)) {
					this.executeError("Force failed");
				} else if (successCallback) {
					let rowsAffected = 1,
							rows: SQLResultSetRowList = {
								length: 0,
								item(): void {}
							};

					if (this.db.noRowsAffectedAtSql && this.db.noRowsAffectedAtSql.test(parsedSql)) {
						rowsAffected = 0;
					} else {
						rows = this.db.resultRows;
					}

					try {
						successCallback(this, {insertId: 0, rowsAffected, rows});
						commit = true;
					} catch (successError) {
						this.db.success = false;
						this.db.errorMessage = successError.message;
					} finally {
						this.db.commit = commit;
					}
				}
			} catch (e) {
				if ("ExecuteError" === e.name) {
					if (errorCallback) {
						try {
							this.db.errorMessage = e.message;
							this.db.success = errorCallback(this, e);
							commit = true === this.db.success;
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

	public executeError(message: string): void {
		const e: Error = new Error(message);

		e.name = "ExecuteError";
		throw e;
	}
}

// For full code coverage, we need to execute some code that is otherwise not covered in unit testing
try {
	const commands: SQLCommand[] = [],
				tx: TransactionMock = new TransactionMock({commit: true, commands} as DatabaseMock);

	// Override executeError so that it doesn't throw an "ExecuteError", to ensure 100% branch coverage of catch block
	sinon.stub(tx, "executeError").throws();

	// Attempt to execute a SQL statement with an incorrect number of param tokens
	tx.executeSql("?", []);
} finally {

	// No op
}