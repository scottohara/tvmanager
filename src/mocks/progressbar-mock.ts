import type { Section } from "~/components";

export default class ProgressBarMock {
	public constructor(
		private total: number,
		private readonly sections: Section[],
	) {}

	public setTotal(total: number): number {
		this.total = total;

		return this.total;
	}

	public setSection(index: number, section: Section): string {
		this.sections[index] = section;

		return JSON.stringify(this.sections[index]);
	}
}
