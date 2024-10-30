export default abstract class Base {
	protected makeEnumerable(property: string): void {
		const descriptor = Object.getOwnPropertyDescriptor(
			Object.getPrototypeOf(this),
			property,
		);

		if (descriptor) {
			descriptor.enumerable = true;
			Object.defineProperty(this, property, descriptor);
		}
	}
}
