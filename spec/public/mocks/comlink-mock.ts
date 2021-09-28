import {
	Remote,
	expose as originalExpose,
	wrap as originalWrap
} from "../../../node_modules/comlink";
import type { SinonSpy } from "sinon";
import sinon from "sinon";

const wrap: SinonSpy = sinon.spy(originalWrap),
			expose: SinonSpy = sinon.spy(originalExpose);

export { Remote, wrap, expose };