import type {
	HeaderFooter,
	ViewControllerArgs
} from "controllers";
import ApplicationController from "controllers/application-controller";

export default abstract class ViewController {
	public header!: HeaderFooter;

	public footer?: HeaderFooter;

	protected appController: ApplicationController;

	public constructor() {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
	}

	public abstract get view(): string;

	public activate?(args?: ViewControllerArgs): Promise<void>;

	public contentShown?(): void;

	public abstract setup(): Promise<void>;
}