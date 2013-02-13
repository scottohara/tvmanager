define(
	function() {
		"use strict";

		var SpinningWheelMock = {
			slots: [],
			selectedValues: {
				keys: [],
				values: []
			},
			addSlot: function(data, align, value) {
				this.slots.push(value);
			},
			setDoneAction: function(callback) {
				callback();
			},
			open: function() {
			},
			getSelectedValues: function() {
				return this.selectedValues;
			}
		};

		return SpinningWheelMock;
	}
);
