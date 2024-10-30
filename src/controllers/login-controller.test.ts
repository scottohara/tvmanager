import type { NavButton, NavButtonEventHandler } from "~/controllers";
import sinon, { type SinonStub } from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import Login from "~/models/login-model";
import LoginController from "~/controllers/login-controller";
import LoginView from "~/views/login-view.html";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("LoginController", (): void => {
	let loginController: LoginController;

	beforeEach((): LoginController => (loginController = new LoginController()));

	describe("object constructor", (): void => {
		it("should return a LoginController instance", (): Chai.Assertion =>
			expect(loginController).to.be.an.instanceOf(LoginController));
	});

	describe("view", (): void => {
		it("should return the login view", (): Chai.Assertion =>
			expect(loginController.view).to.equal(LoginView));
	});

	describe("setup", (): void => {
		let userName: HTMLInputElement,
			password: HTMLInputElement,
			rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(loginController, "login" as keyof LoginController);

			userName = document.createElement("input");
			userName.id = "userName";
			password = document.createElement("input");
			password.id = "password";
			document.body.append(userName, password);

			await loginController.setup();
			rightButton = loginController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(loginController.header.label)).to.equal("Login"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(loginController["login"]).to.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Login"));

		afterEach((): void => {
			userName.remove();
			password.remove();
		});
	});

	describe("login", (): void => {
		const userName = "test-user",
			password = "test-password";

		let userNameInput: HTMLInputElement,
			passwordInput: HTMLInputElement,
			fakeAuthenticate: SinonStub;

		beforeEach((): void => {
			userNameInput = document.createElement("input");
			userNameInput.id = "userName";
			userNameInput.value = userName;
			passwordInput = document.createElement("input");
			passwordInput.id = "password";
			passwordInput.value = password;
			document.body.append(userNameInput, passwordInput);

			fakeAuthenticate = sinon.stub(Login, "authenticate");
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => loginController["login"]());

			it("should authenticate", (): Chai.Assertion =>
				expect(fakeAuthenticate).to.have.been.calledWith(userName, password));
			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeAuthenticate.throws(new Error("login failed"));
				await loginController["login"]();
			});

			it("should attempt to authenticate", (): Chai.Assertion =>
				expect(fakeAuthenticate).to.have.been.calledWith(userName, password));
			it("should not pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.not.have.been.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "login failed",
				}));
		});

		afterEach((): void => {
			userNameInput.remove();
			passwordInput.remove();
			fakeAuthenticate.restore();
		});
	});
});
