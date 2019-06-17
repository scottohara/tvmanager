import {
	SelectedValues,
	SlotData
} from "framework/spinningwheel/index.d.ts";
import sinon, { SinonStub } from "sinon";

interface SpinningWheel {
	cellHeight: number;
	addSlot: <T>(values: SlotData<T>, style: "left" | "right" | null, defaultValue: T) => void;
	setDoneAction: SinonStub;
	open: SinonStub;
	getSelectedValues: <T>() => SelectedValues<T>;
}

const spinningWheel: SpinningWheel = {
	cellHeight: 0,
	addSlot: sinon.stub(),
	setDoneAction: sinon.stub().yields(),
	open: sinon.stub(),
	getSelectedValues: sinon.stub()
};

export default spinningWheel;