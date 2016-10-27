define(
	() => {
		"use strict";

		const SpinningWheelMock = {
			addSlot: sinon.stub(),
			setDoneAction: sinon.stub().yields(),
			open: sinon.stub(),
			getSelectedValues: sinon.stub()
		};

		return SpinningWheelMock;
	}
);
