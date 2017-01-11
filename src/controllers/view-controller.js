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

/**
 * @class ViewController
 * @classdesc Abstract base view controller
 * @abstract
 * @property {ApplicationController} appController - the application controller singleton
 */
export default class ViewController {
	constructor() {
		// Get a reference to the application controller singleton
		this.appController = new ApplicationController();
	}
}