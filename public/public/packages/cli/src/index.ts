import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Command } from "commander"

import { handleCliError, setupImportCommand } from "./commands/import.js"
import { createLogger } from "./logger.js"
import { isTruthy } from "./utils/boolean.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJsonPath = join(__dirname, "..", "package.json")
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

const program = new Command()

program
	.name("fuseui")
	.description("FuseUI CLI - A token-first, adapter-driven release engine")
	.version(packageJson.version)

program.option("--debug", "Enable verbose logging")

setupImportCommand(program)

program
	.command("tokens")
	.description("Manage design tokens")
	.action(() => {
		console.log("Token management functionality will be implemented here")
	})

program
	.command("generate")
	.description("Generate code from design tokens")
	.action(() => {
		console.log("Code generation functionality will be implemented here")
	})

program.parseAsync(process.argv).catch((error: unknown) => {
	const debugEnabled = isTruthy(process.env.FUSEUI_DEBUG)
	const logger = createLogger({ debug: debugEnabled })
	const exitCode = handleCliError(error, logger, debugEnabled)
	process.exitCode = exitCode
})
