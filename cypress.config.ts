import { defineConfig } from "cypress";

export default defineConfig({
	viewportHeight: 812,
	viewportWidth: 375,
	chromeWebSecurity: false,
	e2e: {
		setupNodeEvents(
			_on: Cypress.PluginEvents,
			config: Cypress.PluginConfigOptions,
		): Cypress.PluginConfigOptions {
			const { TVMANAGER_USERNAME, TVMANAGER_PASSWORD } = process.env;

			config.env = { ...config.env, TVMANAGER_USERNAME, TVMANAGER_PASSWORD };

			return config;
		},
		baseUrl: "http://localhost:3000",
		experimentalRunAllSpecs: true,
	},
});
