import type {
	ClickEventHandler,
	ClickEventListener,
	HeaderFooter,
	NavButton,
	ViewControllerArgs,
} from "~/controllers";
import ApplicationController from "~/controllers/application-controller";

export default abstract class ViewController {
	protected appController: ApplicationController;

	#header!: HeaderFooter<ClickEventListener>;

	#footer?: HeaderFooter<ClickEventListener>;

	public constructor() {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
	}

	public get header(): HeaderFooter<ClickEventListener> {
		return this.#header;
	}

	public set header(header: HeaderFooter) {
		this.#header = this.wrapButtons(header);
	}

	public get footer(): HeaderFooter<ClickEventListener> | undefined {
		return this.#footer;
	}

	public set footer(footer: HeaderFooter | undefined) {
		this.#footer = undefined === footer ? undefined : this.wrapButtons(footer);
	}

	public abstract get view(): string;

	public activate?(args?: ViewControllerArgs): Promise<void>;

	public contentShown?(): void;

	public abstract setup(): Promise<void>;

	protected toEventListener(
		eventHandler: ClickEventHandler,
	): ClickEventListener {
		return (): void => {
			Promise.resolve(eventHandler()).catch((e: unknown): void =>
				this.appController.showNotice({ label: (e as Error).message }),
			);
		};
	}

	private wrapButton(
		button?: NavButton,
	): NavButton<ClickEventListener> | undefined {
		return undefined === button?.eventHandler
			? button
			: { ...button, eventHandler: this.toEventListener(button.eventHandler) };
	}

	private wrapButtons(
		headerFooter: HeaderFooter,
	): HeaderFooter<ClickEventListener> {
		return {
			...headerFooter,
			leftButton: this.wrapButton(headerFooter.leftButton),
			rightButton: this.wrapButton(headerFooter.rightButton),
		};
	}
}
