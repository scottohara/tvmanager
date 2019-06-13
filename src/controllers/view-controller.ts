/**
 * @file (Controllers) ViewController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/view-controller
 * @requires controllers/application-controller
 */
import ApplicationController from "controllers/application-controller";
import {HeaderFooter} from "controllers";

/**
 * @class ViewController
 * @classdesc Abstract base view controller
 * @abstract
 * @property {ApplicationController} appController - the application controller singleton
 */
export default abstract class ViewController {
	public header!: HeaderFooter;

	public footer?: HeaderFooter;

	protected appController: ApplicationController;

	public constructor() {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
	}

	public activate?(args?: object): void;

	public abstract setup(): void;

	public abstract get view(): string;
}