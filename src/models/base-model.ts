import DatabaseService from "~/services/database-service";
import type { TVManagerStore } from "~/stores";

export default abstract class Base {
	protected static get db(): Promise<TVManagerStore> {
		// If we don't yet have a db reference, get it from the application controller singleton
		return DatabaseService;
	}

	protected get db(): Promise<TVManagerStore> {
		// Delegate to the static property of the same name
		return Base.db;
	}

	protected makeEnumerable(property: string): void {
		const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), property);

		if (descriptor) {
			descriptor.enumerable = true;
			Object.defineProperty(this, property, descriptor);
		}
	}
}