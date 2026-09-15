import { defineConfig } from "cypress";
import { execFileSync } from "node:child_process";

export default defineConfig({
	viewportHeight: 812,
	viewportWidth: 375,
	chromeWebSecurity: false,
	defaultBrowser: "chrome",
	e2e: {
		setupNodeEvents(
			on: Cypress.PluginEvents,
			config: Cypress.PluginConfigOptions,
		): Cypress.PluginConfigOptions {
			on("task", {
				createData(name: string): Buffer | string {
					return execFileSync("bundle", ["exec", "rake", `db:e2e:${name}`]);
				},
			});

			const { TVMANAGER_USERNAME, TVMANAGER_PASSWORD } = process.env;

			config.env = { ...config.env, TVMANAGER_USERNAME, TVMANAGER_PASSWORD };

			return config;
		},
		baseUrl: "http://localhost:3000",
		experimentalRunAllSpecs: true,
	},
});
