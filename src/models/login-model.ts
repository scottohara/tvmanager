import window from "~/components/window";

export default class Login {
	private static readonly LOCAL_STORAGE_KEY = "tvManagerAuthenticationKey";

	private static cachedAuthenticationKey: string | null;

	public static get isAuthenticated(): boolean {
		return null !== this.authenticationKey;
	}

	public static get authenticationKey(): string | null {
		this.cachedAuthenticationKey ??= window.localStorage.getItem(
			this.LOCAL_STORAGE_KEY,
		);

		return this.cachedAuthenticationKey;
	}

	public static authorisation(authenticationKey: string): string {
		return `Basic ${authenticationKey}`;
	}

	public static async authenticate(
		username: string,
		password: string,
	): Promise<void> {
		const authenticationKey: string = window.btoa(`${username}:${password}`),
			response = await window.fetch("/logins", {
				method: "POST",
				headers: {
					Authorization: this.authorisation(authenticationKey),
				},
			});

		if (!response.ok) {
			const error = await response.text();

			throw new Error(error);
		}

		window.localStorage.setItem(this.LOCAL_STORAGE_KEY, authenticationKey);
		this.cachedAuthenticationKey = authenticationKey;
	}
}
