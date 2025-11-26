import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { env, stdin as input, stdout as output } from "node:process"
import { createInterface } from "node:readline/promises"
import { Writable } from "node:stream"

import type { ImporterResult } from "@fuseui-org/core"
import { DTCGImporter, FigmaImporter } from "@fuseui-org/core"

export interface ImportCommandOptions {
	figmaFileId?: string
	dtcgFilePath?: string
	cwd?: string
	outputFile?: string
	figmaApiKey?: string
}

export interface ImportCommandResult {
	outputPath: string
	tokenCount: number
	warnings: string[]
	errors: string[]
	sourceDescription: string
}

class MaskedStdout extends Writable {
	#muted = false
	constructor(private readonly passthrough: Writable) {
		super()
	}

	mute(muted: boolean) {
		this.#muted = muted
	}

	_write(
		chunk: string | Buffer,
		encoding: BufferEncoding,
		callback: (error?: Error | null) => void,
	) {
		if (this.#muted) {
			const length = chunk.toString().replace(/\r?\n/g, "").length
			if (length > 0) {
				this.passthrough.write("*".repeat(length))
			}
		} else {
			this.passthrough.write(chunk, encoding)
		}
		callback()
	}
}

async function promptForFigmaApiKey(): Promise<string> {
	const maskedOutput = new MaskedStdout(output)
	const rl = createInterface({
		input,
		output: maskedOutput,
		terminal: true,
	})

	try {
		maskedOutput.mute(false)
		const promptText = "Figma Personal Access Token: "
		// Print prompt manually so we can control newline behavior.
		output.write(promptText)
		maskedOutput.mute(true)
		const answer = await rl.question("")
		output.write("\n")
		return answer.trim()
	} finally {
		rl.close()
		maskedOutput.mute(false)
	}
}

export async function runImportCommand(
	options: ImportCommandOptions,
): Promise<ImportCommandResult> {
	const cwd = options.cwd ?? process.cwd()
	const outputPath = resolve(
		cwd,
		options.outputFile ?? join(".fuseui", "tokens.json"),
	)

	let importerResult: ImporterResult
	let sourceDescription: string

	if (options.figmaFileId) {
		const apiKey =
			options.figmaApiKey ??
			env.FIGMA_ACCESS_TOKEN ??
			env.FIGMA_PERSONAL_ACCESS_TOKEN ??
			(await promptForFigmaApiKey())

		if (!apiKey) {
			throw new Error("Figma Personal Access Token is required for --figma.")
		}

		const importer = new FigmaImporter({
			apiKey,
			fileKey: options.figmaFileId,
		})
		importerResult = await importer.ingest()
		sourceDescription = `Figma file ${options.figmaFileId}`
	} else if (options.dtcgFilePath) {
		const absolutePath = resolve(cwd, options.dtcgFilePath)
		const importer = new DTCGImporter({
			filePath: absolutePath,
		})
		importerResult = await importer.ingest()
		sourceDescription = `DTCG file ${absolutePath}`
	} else {
		throw new Error("Either figmaFileId or dtcgFilePath must be provided.")
	}

	await mkdir(dirname(outputPath), { recursive: true })
	await writeFile(
		outputPath,
		JSON.stringify(importerResult.tokenSet, null, 2),
		"utf8",
	)

	return {
		outputPath,
		tokenCount: Object.keys(importerResult.tokenSet.tokens).length,
		warnings: importerResult.warnings,
		errors: importerResult.errors,
		sourceDescription,
	}
}
