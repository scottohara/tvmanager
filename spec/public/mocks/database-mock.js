import TransactionMock from "mocks/transaction-mock";

export default class DatabaseMock {
	constructor() {
		this.reset();
		sinon.spy(this, "changeVersion");
	}

	reset() {
		this.commit = true;
		this.errorMessage = null;
		this.commands = [];
		this.resultRows = [];
		this.version = "1.0";
		this.failAtSql = null;
		this.noRowsAffectedAtSql = null;
	}

	transaction(callback, errorCallback, successCallback) {
		const tx = new TransactionMock(this);

		callback(tx);
		if (this.commit) {
			if (successCallback) {
				successCallback();
			}
		} else if (errorCallback) {
			tx.db.errorMessage = errorCallback({
				code: 0,
				message: this.errorMessage
			});
		}
	}

	readTransaction(callback, errorCallback, successCallback) {
		this.transaction(callback, errorCallback, successCallback);
	}

	changeVersion(initialVersion, expectedVersion, callback, errorCallback, successCallback) {
		this.transaction(callback, errorCallback, successCallback);
	}

	normaliseSql(sql) {
		const WHITESPACE = /\s+/g,
					SINGLE_SPACE = " ",
					PERCENT = /%/,
					ANY_CHARACTER = "(.*)";

		/*
		 * Escape the following special regex characters so that they match literally:
		 * - dashes, square brackets, curly braces, parens, star, plus, question mark
		 * - dot, comma, backslash, caret, dollar, pipe, hash, whitespace
		 */
		return new RegExp(sql.replace(WHITESPACE, SINGLE_SPACE).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&").replace(PERCENT, ANY_CHARACTER), "g");
	}

	failAt(sql) {
		this.failAtSql = this.normaliseSql(sql);
	}

	noRowsAffectedAt(sql) {
		this.noRowsAffectedAtSql = this.normaliseSql(sql);
	}

	addResultRows(rows) {
		this.resultRows = {
			data: rows,
			length: rows.length,
			item(index) {
				return this.data[index];
			}
		};
	}
}