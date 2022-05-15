import DatabaseService from "services/database-service";
import type { TVManagerStore } from "stores";

export default abstract class Base {
	protected get db(): Promise<TVManagerStore> {
		// Delegate to the static property of the same name
		return Base.db;
	}

	protected static get db(): Promise<TVManagerStore> {
		// If we don't yet have a db reference, get it from the application controller singleton
		return DatabaseService;
	}

	protected makeEnumerable(property: string): void {
		const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), property);

		if (descriptor) {
			descriptor.enumerable = true;
			Object.defineProperty(this, property, descriptor);
		}
	}
}