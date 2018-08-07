/**
 * @file Index
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @requires stylesheets/default.css
 * @requires controllers/application-controller
 */
import "stylesheets/default.css";
import ApplicationController from "controllers/application-controller";
import window from "components/window";

if ("serviceWorker" in window.navigator) {
	window.navigator.serviceWorker.register("/service-worker.js").then((registration: ServiceWorkerRegistration): void => window.console.log(`ServiceWorker registration successful with scope: ${registration.scope}`), (error: string): void => window.console.log(`ServiceWorker registration failed: ${error}`));
}

// Get a reference to the application controller singleton
const appController: ApplicationController = new ApplicationController();

// Start the application
appController.start();