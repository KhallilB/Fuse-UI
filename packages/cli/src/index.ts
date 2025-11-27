#!/usr/bin/env node

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { Command } from "commander"

import { runImportCommand } from "./import-command.js"

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

// Add a placeholder subcommand
program
	.command("import")
	.description(
		"Ingest design tokens from Figma or a local JSON file and store them in .fuseui/tokens.json",
	)
	.option(
		"--figma <fileId>",
		"Import from Figma Variables API (prompts for PAT)",
	)
	.option("--file <path>", "Import from a local DTCG/JSON token file")
	.option(
		"--output <path>",
		"Override output location (defaults to .fuseui/tokens.json)",
	)
	.action(
		async (options: { figma?: string; file?: string; output?: string }) => {
			const hasFigma = Boolean(options.figma)
			const hasFile = Boolean(options.file)
			if ((hasFigma && hasFile) || (!hasFigma && !hasFile)) {
				console.error(
					"Please provide exactly one source: --figma <fileId> or --file <path>",
				)
				process.exitCode = 1
				return
			}

			try {
				const result = await runImportCommand({
					figmaFileId: options.figma,
					dtcgFilePath: options.file,
					outputFile: options.output,
				})

				console.log(
					`Imported ${result.tokenCount} tokens from ${result.sourceDescription}`,
				)
				console.log(`Saved normalized tokens to ${result.outputPath}`)

				if (result.warnings.length > 0) {
					console.warn("Warnings:")
					for (const warning of result.warnings) {
						console.warn(`- ${warning}`)
					}
				}

				if (result.errors.length > 0) {
					console.warn("Non-blocking errors:")
					for (const error of result.errors) {
						console.warn(`- ${error}`)
					}
				}
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown import failure"
				console.error(`Import failed: ${message}`)
				process.exitCode = 1
			}
		},
	)

program.parse(process.argv)

// If no command is provided, show help
if (!process.argv.slice(2).length) {
	program.outputHelp()
}
