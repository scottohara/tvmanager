import type {
	ListAction,
	ListEventHandler,
	ListItem
} from "~/components";
import type { SinonStub } from "sinon";
import sinon from "sinon";

export default class ListMock {
	public action!: ListAction;

	public refresh: SinonStub;

	public showIndex: SinonStub;

	public hideIndex: SinonStub;

	public scrollTo: SinonStub;

	public tap: SinonStub;

	public constructor(public readonly container: string,
						public readonly itemTemplate: string,
						public readonly groupBy: string | null,
						public items: ListItem[],
						public readonly viewEventHandler: ListEventHandler = sinon.stub(),
						public readonly editEventHandler: ListEventHandler | null = sinon.stub(),
						public readonly deleteEventHandler: ListEventHandler = sinon.stub()) {
		this.showIndex = sinon.stub();
		this.hideIndex = sinon.stub();
		this.refresh = sinon.stub();
		this.scrollTo = sinon.stub();
		this.tap = sinon.stub();
	}

	public setAction(action: ListAction): void {
		this.action = action;
	}
}