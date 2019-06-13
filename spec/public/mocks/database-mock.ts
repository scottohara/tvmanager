import TransactionMock from "mocks/transaction-mock";
import sinon from "sinon";

export interface SQLCommand {
	originalSql: DOMString;
	parsedSql?: DOMString;
}
export default class DatabaseMock {
	public commit = true;

	public commands: SQLCommand[] = [];

	public resultRows: SQLResultSetRowList = {
		length: 0,
		item(): void {}
	};

	public failAtSql: RegExp | null = null;

	public noRowsAffectedAtSql: RegExp | null = null;

	public errorMessage = "";

	public success = true;

	public version: DOMString = "1.0";

	public constructor() {
		sinon.spy(this, "changeVersion");
	}

	public transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		const tx = new TransactionMock(this);

		callback(tx);
		if (this.commit) {
			if (successCallback) {
				successCallback();
			}
		} else if (errorCallback) {
			errorCallback({
				code: 0,
				message: this.errorMessage
			});
		}
	}

	public readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.transaction(callback, errorCallback, successCallback);
	}

	public changeVersion(_initialVersion: DOMString, _expectedVersion: DOMString, callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void {
		this.transaction(callback, errorCallback, successCallback);
	}

	public reset(): void {
		this.commit = true;
		this.errorMessage = "";
		this.success = true;
		this.commands = [];
		this.resultRows = {
			length: 0,
			item(): void {}
		};
		this.version = "1.0";
		this.failAtSql = null;
		this.noRowsAffectedAtSql = null;
	}

	public failAt(sql: string): void {
		this.failAtSql = this.normaliseSql(sql);
	}

	public noRowsAffectedAt(sql: string): void {
		this.noRowsAffectedAtSql = this.normaliseSql(sql);
	}

	public addResultRows(rows: object[]): void {
		this.resultRows = {
			length: rows.length,
			item(index: number): object {
				return rows[index];
			}
		};
	}

	private normaliseSql(sql: string): RegExp {
		const WHITESPACE = /\s+/gu,
					SINGLE_SPACE = " ",
					PERCENT = /%/u,
					ANY_CHARACTER = "(.*)";

		/*
		 * Escape the following special regex characters so that they match literally:
		 * - square brackets, curly braces, parens, star, plus, question mark
		 * - dot, backslash, caret, dollar, pipe, hash
		 */
		return new RegExp(sql.replace(WHITESPACE, SINGLE_SPACE).replace(/[[\]{}()*+?.\\^$|#]/gu, "\\$&").replace(PERCENT, ANY_CHARACTER), "gu");
	}
}