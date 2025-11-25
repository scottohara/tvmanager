import type { ApiMethod } from "~/services";
import Login from "~/models/login-model";
import window from "~/components/window";

const NO_CONTENT = 204;

async function api<T>(
	method: ApiMethod,
	path: string,
	body?: object,
): Promise<T> {
	const options: RequestInit = {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: Login.authorisation(String(Login.authenticationKey)),
			},
			body: JSON.stringify(body),
		},
		response = await window.fetch(path, options);

	if (!response.ok) {
		const error = await response.text();

		throw new Error(error);
	}

	if (NO_CONTENT === response.status) {
		return undefined as T;
	}

	return response.json() as T;
}

export async function get<T>(path: string): Promise<T> {
	return api<T>("GET", path);
}

export async function create<T>(path: string, body?: object): Promise<T> {
	return api<T>("POST", path, body);
}

export async function update(path: string, body?: object): Promise<void> {
	const success = await api<boolean>("PUT", path, body);

	if (!success) {
		throw new Error("Update was unsuccessful. Please try again.");
	}
}

export async function destroy(path: string): Promise<void> {
	return api("DELETE", path);
}
