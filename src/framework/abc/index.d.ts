declare class Abc {
	private readonly element: HTMLElement;

	private readonly scrollElement: JQuery<HTMLElement>;

	public constructor(el: HTMLElement, scrollEl: JQuery<HTMLElement>);
}

export default Abc;