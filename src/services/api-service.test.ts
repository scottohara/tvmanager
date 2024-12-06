import * as API from "./api-service";
import sinon, { type SinonStub } from "sinon";
import Login from "~/models/login-model";
import WindowMock from "~/mocks/window-mock";

describe("API", (): void => {
	let options: RequestInit, fakeAuthorisation: SinonStub, json: object;

	beforeEach((): void => {
		fakeAuthorisation = sinon
			.stub(Login, "authorisation")
			.returns("Basic authentication key");
		options = {
			headers: {
				Accept: "application/json",
				Authorization: "Basic authentication key",
				"Content-Type": "application/json",
			},
			body: undefined,
		};
	});

	describe("get", (): void => {
		beforeEach((): string => (options.method = "GET"));

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response('{ "get": "response" }')),
				);
				json = await API.get<object>("/example");
			});

			it("should make a GET request", (): Chai.Assertion =>
				expect(WindowMock.fetch).to.have.been.calledWith("/example", options));
			it("should return a JSON response", (): Chai.Assertion =>
				expect(json).to.deep.equal({ get: "response" }));
		});

		describe("failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("get error", { status: 500 })),
				);

				try {
					await API.get<object>("/example");
				} catch (e: unknown) {
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal("get error");
				}
			});
		});
	});

	describe("create", (): void => {
		beforeEach((): void => {
			options.method = "POST";
			options.body = "{}";
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response('{ "post": "response" }')),
				);
				json = await API.create<object>("/example", {});
			});

			it("should make a POST request", (): Chai.Assertion =>
				expect(WindowMock.fetch).to.have.been.calledWith("/example", options));
			it("should return a JSON response", (): Chai.Assertion =>
				expect(json).to.deep.equal({ post: "response" }));
		});

		describe("failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("post error", { status: 500 })),
				);

				try {
					await API.create<object>("/example", {});
				} catch (e: unknown) {
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal("post error");
				}
			});
		});
	});

	describe("update", (): void => {
		beforeEach((): void => {
			options.method = "PUT";
			options.body = "{}";
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				WindowMock.fetch.returns(Promise.resolve(new Response("true")));
				await API.update("/example", {});
			});

			it("should make a PUT request", (): Chai.Assertion =>
				expect(WindowMock.fetch).to.have.been.calledWith("/example", options));
		});

		describe("update failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(Promise.resolve(new Response("false")));

				try {
					await API.update("/example", {});
				} catch (e: unknown) {
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal(
						"Update was unsuccessful. Please try again.",
					);
				}
			});
		});
		describe("failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("put error", { status: 500 })),
				);

				try {
					await API.update("/example", {});
				} catch (e: unknown) {
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal("put error");
				}
			});
		});
	});

	describe("destroy", (): void => {
		beforeEach((): string => (options.method = "DELETE"));

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response(null, { status: 204 })),
				);
				await API.destroy("/example");
			});

			it("should make a DELETE request", (): Chai.Assertion =>
				expect(WindowMock.fetch).to.have.been.calledWith("/example", options));
		});

		describe("failure", (): void => {
			it("should throw an error", async (): Promise<void> => {
				WindowMock.fetch.returns(
					Promise.resolve(new Response("delete error", { status: 500 })),
				);

				try {
					await API.destroy("/example");
				} catch (e: unknown) {
					expect(e).to.be.an.instanceOf(Error);
					expect((e as Error).message).to.equal("delete error");
				}
			});
		});
	});

	afterEach((): void => fakeAuthorisation.restore());
});
