import { Command } from "commander"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ImportCommandOptions } from "./commands/import"
import { ExitCode, setupImportCommand } from "./commands/import"

const createLoggerMock = vi.hoisted(() => vi.fn())

vi.mock("./logger.js", () => ({
	createLogger: createLoggerMock,
}))

const runImportCommandMock = vi.fn<
	(options: ImportCommandOptions) => Promise<ExitCode>
>(async () => ExitCode.Success)

const createLoggerStub = () => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
})

async function executeImportCommand(args: string[]): Promise<void> {
	const program = new Command()
	program.name("fuseui")
	setupImportCommand(program, { runImport: runImportCommandMock })
	await program.parseAsync(["node", "fuseui", ...args], { from: "node" })
}

describe("fuseui import CLI wiring", () => {
	let logger: ReturnType<typeof createLoggerStub>

	beforeEach(() => {
		logger = createLoggerStub()
		createLoggerMock.mockClear()
		createLoggerMock.mockImplementation(() => logger)
		runImportCommandMock.mockClear()
		runImportCommandMock.mockResolvedValue(ExitCode.Success)
		process.exitCode = undefined
	})

	it("passes DTCG imports through to runImportCommand", async () => {
		await executeImportCommand(["import", "--dtcg-path", "./tokens.json"])

		expect(runImportCommandMock).toHaveBeenCalledWith(
			expect.objectContaining({
				dtcgPath: "./tokens.json",
				debug: false,
			}),
		)
		expect(process.exitCode).toBe(ExitCode.Success)
	})

	it("passes Figma imports through to runImportCommand", async () => {
		await executeImportCommand([
			"import",
			"--figma-file-key",
			"ABC123",
			"--figma-api-key",
			"secret",
		])

		expect(runImportCommandMock).toHaveBeenCalledWith(
			expect.objectContaining({
				figmaFileKey: "ABC123",
				figmaApiKey: "secret",
				debug: false,
			}),
		)
		expect(process.exitCode).toBe(ExitCode.Success)
	})

	it("sets validation exit code when conflicting CLI sources are provided", async () => {
		await executeImportCommand([
			"import",
			"--dtcg-path",
			"./tokens.json",
			"--figma-file-key",
			"ABC123",
			"--figma-api-key",
			"secret",
		])

		expect(runImportCommandMock).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledWith(
			"Provide either Figma overrides or DTCG overrides, not both at once.",
		)
		expect(process.exitCode).toBe(ExitCode.Validation)
	})
})
