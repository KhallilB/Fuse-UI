import { describe, expect, it, vi } from "vitest"
import { runImportCommand, ExitCode, CliError } from "./import"
import type { ImporterResult, TokenImporter } from "@fuseui-org/core"
import type { LoadedConfig } from "../config"
import type { Logger } from "../logger"

const createStubLogger = (): Logger => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
})

const createStubImporter = (
	result: ImporterResult,
	reject = false,
): TokenImporter => ({
	ingest: reject
		? vi.fn(() => Promise.reject(new Error("failed")))
		: vi.fn(() => Promise.resolve(result)),
})

describe("runImportCommand", () => {
	it("imports tokens from config-defined DTCG source", async () => {
		const logger = createStubLogger()

		const config: LoadedConfig = {
			path: "/tmp/fuseui.config.json",
			config: {
				sources: [
					{
						type: "dtcg",
						label: "local",
						filePath: "./tokens.json",
					},
				],
			},
		}

		const importerResult: ImporterResult = {
			tokenSet: {
				tokens: {
					primary: {
						id: "1",
						name: "color.primary",
						type: "color",
						value: { type: "value", value: "#fff" },
					},
				},
				metadata: { source: "dtcg" },
			},
			errors: [],
			warnings: [],
		}

		const importer = createStubImporter(importerResult)

		const exitCode = await runImportCommand({
			logger,
			configLoader: () => Promise.resolve(config),
			importerFactories: {
				dtcg: () => importer,
			},
		})

		expect(exitCode).toBe(ExitCode.Success)
		expect(importer.ingest).toHaveBeenCalledTimes(1)
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringMatching(/Imported 1 token/),
		)
	})

	it("throws validation error when config is missing", async () => {
		await expect(
			runImportCommand({
				logger: createStubLogger(),
				configLoader: () => Promise.resolve(null),
			}),
		).rejects.toMatchObject({
			exitCode: ExitCode.Validation,
		})
	})

	it("returns validation exit code when importer reports errors", async () => {
		const logger = createStubLogger()
		const importerResult: ImporterResult = {
			tokenSet: { tokens: {}, metadata: { source: "dtcg" } },
			warnings: [],
			errors: ["bad token"],
		}

		const exitCode = await runImportCommand({
			logger,
			configLoader: () =>
				Promise.resolve({
					path: "config",
					config: {
						sources: [
							{
								type: "dtcg",
								filePath: "./tokens.json",
							},
						],
					},
				}),
			importerFactories: {
				dtcg: () => createStubImporter(importerResult),
			},
		})

		expect(exitCode).toBe(ExitCode.Validation)
		expect(logger.error).toHaveBeenCalledWith("bad token")
	})

	it("throws fatal error when importer rejects", async () => {
		await expect(
			runImportCommand({
				logger: createStubLogger(),
				configLoader: () =>
					Promise.resolve({
						path: "config",
						config: {
							sources: [
								{
									type: "dtcg",
									filePath: "./tokens.json",
								},
							],
						},
					}),
				importerFactories: {
					dtcg: () =>
						createStubImporter(
							{
								tokenSet: { tokens: {}, metadata: { source: "dtcg" } },
								errors: [],
								warnings: [],
							},
							true,
						),
				},
			}),
		).rejects.toBeInstanceOf(CliError)
	})
})
