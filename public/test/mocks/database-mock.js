define(
	[
		'test/mocks/transaction-mock',
		'framework/jquery'
	],

	function(TransactionMock, $) {
		"use strict";

		var DatabaseMock = function() {
			this.reset();
		};

		DatabaseMock.prototype.reset = function() {
			this.commit = true;
			this.errorMessage = null;
			this.commands = [];
			this.resultRows = [];
			this.version = "1.0";
			this.failAtSql = null;
			this.noRowsAffectedAtSql = null;
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
			QUnit.equal(initialVersion, this.version, "Initial version");
			this.transaction(callback, errorCallback, successCallback);
			if (this.commit) {
				QUnit.equal(expectedVersion, this.version, "Expected version");
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

		return DatabaseMock;
	}
);
