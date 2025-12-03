import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
	},
	resolve: {
		alias: {
			"@fuseui-org/core": resolve(__dirname, "../core/src/index.ts"),
		},
	},
})
