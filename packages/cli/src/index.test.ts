import { beforeEach, describe, expect, it, vi } from "vitest"

import { runImportCommand } from "./import-command"

vi.mock("node:fs", () => ({
	readFileSync: vi.fn().mockReturnValue('{"version": "0.1.0"}'),
}))

vi.mock("./import-command", () => ({
	runImportCommand: vi.fn().mockResolvedValue({
		outputPath: "/tmp/.fuseui/tokens.json",
		tokenCount: 12,
		warnings: [],
		errors: [],
		sourceDescription: "mock source",
	}),
}))

async function importCli(argv: string[]) {
	const originalArgv = process.argv
	process.argv = argv
	try {
		await import("./index")
	} finally {
		process.argv = originalArgv
	}
}

describe("fuseui import command", () => {
	beforeEach(() => {
		vi.resetModules()
		vi.clearAllMocks()
		process.exitCode = 0
	})

	it("passes file imports through to the handler", async () => {
		await importCli(["node", "fuseui", "import", "--file", "./tokens.json"])
		expect(runImportCommand).toHaveBeenCalledWith({
			figmaFileId: undefined,
			dtcgFilePath: "./tokens.json",
			outputFile: undefined,
		})
	})

	it("passes figma imports through to the handler", async () => {
		await importCli(["node", "fuseui", "import", "--figma", "ABC123"])
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

		await importCli([
			"node",
			"fuseui",
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
