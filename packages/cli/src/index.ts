#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Command } from "commander"
import { CliError, ExitCode, runImportCommand } from "./commands/import.js"
import { createLogger } from "./logger.js"

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

program
	.command("import")
	.description("Ingest design tokens from configured sources")
	.option("-c, --config <path>", "Path to fuseui.config file")
	.option("-s, --source <source>", "Filter by source label or type")
	.option("--dtcg-path <path>", "Override DTCG file path for imports")
	.option("--dtcg-url <url>", "Override DTCG file URL for imports")
	.option("--figma-api-key <key>", "Override Figma API key")
	.option("--figma-file-key <fileKey>", "Override Figma file key")
	.option("--figma-base-url <url>", "Override Figma API base URL")
	.action(async (commandOptions, command) => {
		const globalOptions = command.optsWithGlobals()
		const debugEnabled = Boolean(
			globalOptions.debug ?? isTruthy(process.env.FUSEUI_DEBUG),
		)
		const logger = createLogger({ debug: debugEnabled })

		try {
			const exitCode = await runImportCommand({
				...commandOptions,
				debug: debugEnabled,
				logger,
			})
			process.exitCode = exitCode
		} catch (error: unknown) {
			const exitCode = handleError(error, logger, debugEnabled)
			process.exitCode = exitCode
		}
	})

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
	const logger = createLogger()
	const exitCode = handleError(error, logger, false)
	process.exitCode = exitCode
})

if (!process.argv.slice(2).length) {
	program.outputHelp()
}

function handleError(
	error: unknown,
	logger: ReturnType<typeof createLogger>,
	debugEnabled: boolean,
): ExitCode {
	if (error instanceof CliError) {
		logger.error(error.message)
		if (debugEnabled && error.details instanceof Error && error.details.stack) {
			logger.debug(error.details.stack)
		} else if (debugEnabled && error.stack) {
			logger.debug(error.stack)
		}
		return error.exitCode
	}

	const message = error instanceof Error ? error.message : String(error)
	logger.error(message)
	if (debugEnabled && error instanceof Error && error.stack) {
		logger.debug(error.stack)
	}
	return ExitCode.Fatal
}

function isTruthy(value: string | undefined): boolean {
	if (!value) {
		return false
	}
	return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}
