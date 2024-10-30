import Login from "~/models/login-model";
import LoginView from "~/views/login-view.html";
import type { NavButtonEventHandler } from "~/controllers";
import ViewController from "~/controllers/view-controller";

export default class LoginController extends ViewController {
	public get view(): string {
		return LoginView;
	}

	// DOM selectors
	private get userName(): HTMLInputElement {
		return document.querySelector("#userName") as HTMLInputElement;
	}

	private get password(): HTMLInputElement {
		return document.querySelector("#password") as HTMLInputElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Login",
			rightButton: {
				eventHandler: this.login.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Login",
			},
		};

		return Promise.resolve();
	}

	private async login(): Promise<void> {
		try {
			await Login.authenticate(this.userName.value, this.password.value);
			await this.appController.popView();
		} catch (e: unknown) {
			this.appController.showNotice({ label: (e as Error).message });
		}
	}
}
