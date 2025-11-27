import { Command } from "commander"
import { describe, expect, it, vi } from "vitest"

// Mock the commander package
vi.mock("commander", () => {
	const mockSubCommand = {
		description: vi.fn().mockReturnThis(),
		option: vi.fn().mockReturnThis(),
		action: vi.fn().mockReturnThis(),
		optsWithGlobals: vi.fn().mockReturnValue({}),
	}

	const mockCommand = {
		name: vi.fn().mockReturnThis(),
		description: vi.fn().mockReturnThis(),
		version: vi.fn().mockReturnThis(),
		option: vi.fn().mockReturnThis(),
		command: vi.fn().mockReturnValue(mockSubCommand),
		parseAsync: vi.fn().mockResolvedValue(undefined),
		outputHelp: vi.fn(),
	}

	return {
		Command: vi.fn(() => mockCommand),
	}
})

// Mock the fs module
vi.mock("node:fs", () => ({
	readFileSync: vi.fn().mockReturnValue('{"version": "0.1.0"}'),
}))

describe("CLI", () => {
	it("should initialize properly", async () => {
		// Import the CLI module (which will use our mocks)
		const originalArgv = process.argv
		process.argv = ["node", "fuseui"]

		// We need to reset the module cache to ensure our mocks are used
		vi.resetModules()

		// Import the CLI module
		await import("./index.js")

		// Get the mocked Command instance
		const commandInstance = new Command()

		// Verify the CLI was initialized correctly
		expect(commandInstance.name).toHaveBeenCalledWith("fuseui")
		expect(commandInstance.description).toHaveBeenCalledWith(
			expect.stringContaining("FuseUI CLI"),
		)
		expect(commandInstance.version).toHaveBeenCalledWith("0.1.0")
		expect(commandInstance.command).toHaveBeenCalledWith("import")
		expect(commandInstance.command).toHaveBeenCalledWith("tokens")
		expect(commandInstance.command).toHaveBeenCalledWith("generate")
		expect(commandInstance.parseAsync).toHaveBeenCalledWith(process.argv)

		// Restore original argv
		process.argv = originalArgv
	})
})
