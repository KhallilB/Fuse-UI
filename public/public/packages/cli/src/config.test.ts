import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { loadConfig, ConfigError } from "./config"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

let tempDir: string

beforeEach(() => {
	tempDir = mkdtempSync(join(tmpdir(), "fuseui-cli-"))
})

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe("loadConfig", () => {
	it("returns null when no config file exists", async () => {
		const result = await loadConfig({ cwd: tempDir })
		expect(result).toBeNull()
	})

	it("loads config from fuseui.config.json", async () => {
		const configPath = join(tempDir, "fuseui.config.json")
		writeFileSync(
			configPath,
			JSON.stringify({
				sources: [
					{
						type: "dtcg",
						filePath: "./tokens.json",
					},
				],
			}),
			"utf8",
		)

		const result = await loadConfig({ cwd: tempDir })
		expect(result).not.toBeNull()
		expect(result?.config.sources).toHaveLength(1)
		expect(result?.path).toBe(configPath)
	})

	it("throws ConfigError for invalid exports", async () => {
		const configPath = join(tempDir, "fuseui.config.json")
		writeFileSync(configPath, JSON.stringify("invalid"))

		await expect(loadConfig({ cwd: tempDir })).rejects.toThrow(ConfigError)
	})
})
