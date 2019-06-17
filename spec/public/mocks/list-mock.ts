import sinon, { SinonStub } from "sinon";
import { ListAction } from "components";

export default class ListMock {
	public action!: ListAction;

	public refresh: SinonStub;

	public scrollTo: SinonStub;

	public tap: SinonStub;

	public constructor(public readonly container: string,
						public readonly itemTemplate: string,
						public readonly groupBy: string | null,
						public items: object[],
						public readonly viewEventHandler: (index: number) => void = sinon.stub(),
						public readonly editEventHandler: ((index: number) => void) | null = sinon.stub(),
						public readonly deleteEventHandler: (index: number) => void = sinon.stub()) {
		this.refresh = sinon.stub();
		this.scrollTo = sinon.stub();
		this.tap = sinon.stub();
	}

	public setAction(action: ListAction): void {
		this.action = action;
	}
}