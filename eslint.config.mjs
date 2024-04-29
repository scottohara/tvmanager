import oharagroup from "eslint-config-oharagroup";
import tseslint from "typescript-eslint";

export default tseslint.config(
	...oharagroup.ts,
	{
		name: "tvmanager/base",
		languageOptions: {
			parserOptions: {
				projectService: {
					maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 9,
				},
			},
		},
		rules: {
			// Disabled to allow for import/export/delete confirmation prompts,
			"no-alert": "off",
			// Temporarily disabled, see https://github.com/scottohara/tvmanager/issues/83
			"@typescript-eslint/no-this-alias": "off",
			// Disabled to allow for PublicInterface & StoreObject
			"@typescript-eslint/no-type-alias": "off",
		},
	},
	{
		name: "tvmanager/tests",
		files: ["**/*.test.ts", "**/mocks/**/*"],
		rules: {
			// Disable to allow Chai assertions (e.g. `expect(..).to.have.been.called`)
			"@typescript-eslint/no-unused-expressions": "off",
			// Disable due to circular type references in model mocks
			"@typescript-eslint/no-use-before-define": "off",
		},
	},
);
