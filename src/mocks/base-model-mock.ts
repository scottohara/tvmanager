import type { SinonStub } from "sinon";

let error: string | null = null;

export default abstract class BaseMock {
	public static get error(): string | null {
		return error;
	}

	public static set error(message: string | null) {
		error = message;
	}

	protected static stub<T extends unknown[], U>(
		stub: SinonStub<T, Promise<U>>,
		returns: U,
	): SinonStub<T, Promise<U>> {
		return null === BaseMock.error
			? stub.returns(Promise.resolve(returns))
			: stub.throws(new Error(BaseMock.error));
	}
}
