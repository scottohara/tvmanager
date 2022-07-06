import { defineConfig } from "cypress";

export default defineConfig({
	viewportHeight: 812,
	viewportWidth: 375,
	chromeWebSecurity: false,
	e2e: {
		baseUrl: "http://localhost:3001"
	}
});
