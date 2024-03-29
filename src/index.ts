import "~/stylesheets/default.css";
import ApplicationController from "~/controllers/application-controller";
import window from "~/components/window";

if ("serviceWorker" in window.navigator) {
	window.navigator.serviceWorker.register("/service-worker.js").then(
		(registration: ServiceWorkerRegistration): void =>
			window.console.log(
				`ServiceWorker registration successful with scope: ${registration.scope}`,
			),
		(error: string): void =>
			window.console.log(`ServiceWorker registration failed: ${error}`),
	);
}

if ("storage" in window.navigator) {
	window.navigator.storage
		.persist()
		.catch((error: string): void => window.console.log(error));
}

// Get a reference to the application controller singleton
const appController = new ApplicationController();

// Start the application
appController
	.start()
	.catch(
		(error: Error): string =>
			((document.querySelector("#content") as HTMLDivElement).textContent =
				error.message),
	);
