#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Command } from "commander"
import { setupImportCommand } from "./commands/import"

// Get package.json for version
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJsonPath = join(__dirname, "..", "package.json")
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

const program = new Command()

program
	.name("fuseui")
	.description("FuseUI CLI - A token-first, adapter-driven release engine")
	.version(packageJson.version)

// Add import command (testing imports without .js extension)
setupImportCommand(program)

// Add a placeholder subcommand
program
	.command("tokens")
	.description("Manage design tokens")
	.action(() => {
		console.log("Token management functionality will be implemented here")
	})

// Add another placeholder subcommand
program
	.command("generate")
	.description("Generate code from design tokens")
	.action(() => {
		console.log("Code generation functionality will be implemented here")
	})

program.parse(process.argv)

// If no command is provided, show help
if (!process.argv.slice(2).length) {
	program.outputHelp()
}
