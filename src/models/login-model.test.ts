import Login from "./login-model";
import type { SinonStub } from "sinon";
import WindowMock from "~/mocks/window-mock";

describe("Login", (): void => {
	beforeEach((): null => (Login["cachedAuthenticationKey"] = null));

	describe("isAuthenticated", (): void => {
		it("should be true if an authentication key exists", (): void => {
			WindowMock.localStorage.getItem.returns("authentication key");
			expect(Login.isAuthenticated).to.be.true;
		});

		it("should be false if an authentication key does not exist", (): void => {
			WindowMock.localStorage.getItem.returns(null);
			expect(Login.isAuthenticated).to.be.false;
		});
	});

	describe("authenticationKey", (): void => {
		beforeEach(
			(): SinonStub =>
				WindowMock.localStorage.getItem.returns("authentication key"),
		);

		it("should get & cache the key from local storage when first called", (): void => {
			expect(Login.authenticationKey).to.equal("authentication key");
			expect(WindowMock.localStorage.getItem).to.have.been.calledWith(
				Login["LOCAL_STORAGE_KEY"],
			);
			expect(Login["cachedAuthenticationKey"]).to.equal("authentication key");
		});

		it("should return the cached key when called again", (): void => {
			Login.authenticationKey;
			WindowMock.localStorage.getItem.returns("a different key").resetHistory();
			expect(Login.authenticationKey).to.equal("authentication key");
			expect(WindowMock.localStorage.getItem).to.not.have.been.called;
			expect(Login["cachedAuthenticationKey"]).to.equal("authentication key");
		});
	});

	describe("authorisation", (): void => {
		it("should return a basic authentication header value", (): Chai.Assertion =>
			expect(Login.authorisation("authentication key")).to.equal(
				"Basic authentication key",
			));
	});

	describe("authenticate", (): void => {
		const authenticationKey = "base64(test-user:test-password)",
			options: RequestInit = {
				method: "POST",
				headers: {
					Authorization: `Basic ${authenticationKey}`,
				},
			};

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("", { status: 201 })),
				);
				await Login.authenticate("test-user", "test-password");
			});

			it("should attempt to authenticate", (): Chai.Assertion =>
				expect(WindowMock.fetch).to.have.been.calledWith("/logins", options));

			it("should store the authentication key in local storage", (): Chai.Assertion =>
				expect(WindowMock.localStorage.setItem).to.have.been.calledWith(
					Login["LOCAL_STORAGE_KEY"],
					authenticationKey,
				));

			it("should cache the authentication key", (): Chai.Assertion =>
				expect(Login["cachedAuthenticationKey"]).to.equal(authenticationKey));
		});

		describe("failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("unauthorised", { status: 401 })),
				);

				try {
					await Login.authenticate("test-user", "test-password");
				} catch (e: unknown) {
					expect(WindowMock.fetch).to.have.been.calledWith("/logins", options);
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal("unauthorised");
					expect(WindowMock.localStorage.setItem).to.not.have.been.called;
					expect(Login["cachedAuthenticationKey"]).to.be.null;
				}
			});
		});

		afterEach((): void => WindowMock.localStorage.setItem.reset());
	});
});
