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

// Get a reference to the application controller singleton
const appController = new ApplicationController();

// Start the application
appController.start();