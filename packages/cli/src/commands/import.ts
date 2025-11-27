import { TokenEngine } from "@fuseui-org/core"
import type { Command } from "commander"

export function setupImportCommand(program: Command): void {
	program
		.command("import")
		.description("Import design tokens from various sources")
		.action(() => {
			console.log("Import functionality will be implemented here")
			// Test that imports work
			const _engine = new TokenEngine()
			console.log("TokenEngine imported successfully", _engine)
		})
}
