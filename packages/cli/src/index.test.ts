import { beforeEach, describe, expect, it, vi } from "vitest"
import { Command } from "commander"

import { setupImportCommand } from "./commands/import"
import { runImportCommand } from "./import-command.js"

vi.mock("./import-command", () => ({
	runImportCommand: vi.fn().mockResolvedValue({
		outputPath: "/tmp/.fuseui/tokens.json",
		tokenCount: 12,
		warnings: [],
		errors: [],
		sourceDescription: "mock source",
	}),
}))

async function executeCommand(program: Command, args: string[]): Promise<void> {
	await program.parseAsync(["node", "fuseui", ...args], { from: "node" })
}

describe("fuseui import command", () => {
	let program: Command

	beforeEach(() => {
		program = new Command()
		program.name("fuseui")
		setupImportCommand(program)
		vi.clearAllMocks()
		process.exitCode = 0
	})

	it("passes file imports through to the handler", async () => {
		await executeCommand(program, ["import", "--file", "./tokens.json"])
		expect(runImportCommand).toHaveBeenCalledWith({
			figmaFileId: undefined,
			dtcgFilePath: "./tokens.json",
			outputFile: undefined,
		})
	})

	it("passes figma imports through to the handler", async () => {
		await executeCommand(program, ["import", "--figma", "ABC123"])
		expect(runImportCommand).toHaveBeenCalledWith({
			figmaFileId: "ABC123",
			dtcgFilePath: undefined,
			outputFile: undefined,
		})
	})

	it("sets exit code when both options are provided", async () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined)

		await executeCommand(program, [
			"import",
			"--figma",
			"ABC123",
			"--file",
			"tokens.json",
		])

		expect(runImportCommand).not.toHaveBeenCalled()
		expect(process.exitCode).toBe(1)

		errorSpy.mockRestore()
	})
})
