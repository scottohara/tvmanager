export function addSlot<T>(values: SlotData<T>, style: "left" | "right" | null, defaultValue: T): void;
export function setDoneAction(doneAction: () => void): void;
export function open(): void;
export function getSelectedValues<T>(): SelectedValues<T>;
export let cellHeight: number;

export interface SelectedValues<T> {
	keys: T[];
	values: string[];
}

export type SlotData<T> = T extends string ? StringSlotData : NumberSlotData;

interface StringSlotData {
	[key: string]: string;
}

interface NumberSlotData {
	[key: number]: string;
}
