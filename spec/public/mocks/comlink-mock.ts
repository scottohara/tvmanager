import {
	expose as originalExpose,
	wrap as originalWrap
} from "../../../node_modules/comlink";
import sinon, { SinonSpy } from "sinon";

const wrap: SinonSpy = sinon.spy(originalWrap),
			expose: SinonSpy = sinon.spy(originalExpose);

export { wrap, expose };