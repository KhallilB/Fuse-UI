import { existsSync, readFileSync } from "node:fs"
import { extname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type TokenSourceConfig = DTCGSourceConfig | FigmaSourceConfig

export interface DTCGSourceConfig {
	type: "dtcg"
	label?: string
	filePath?: string
	fileUrl?: string
}

export interface FigmaSourceConfig {
	type: "figma"
	label?: string
	fileKey: string
	apiKey?: string
	apiBaseUrl?: string
}

export interface FuseUIConfig {
	sources?: TokenSourceConfig[]
	defaults?: {
		figmaApiKey?: string
	}
}

export interface LoadedConfig {
	path: string
	config: FuseUIConfig
}

export interface LoadConfigOptions {
	cwd?: string
	explicitPath?: string
}

const CONFIG_CANDIDATES = [
	"fuseui.config.ts",
	"fuseui.config.mjs",
	"fuseui.config.cjs",
	"fuseui.config.js",
	"fuseui.config.json",
]

export class ConfigError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ConfigError"
	}
}

/**
 * Attempts to load a FuseUI config file from disk.
 * Searches for standard filenames unless an explicit path is provided.
 */
export async function loadConfig(
	options: LoadConfigOptions = {},
): Promise<LoadedConfig | null> {
	const cwd = options.cwd ? resolve(options.cwd) : process.cwd()
	const candidates = resolveCandidatePaths(cwd, options.explicitPath)

	for (const candidate of candidates) {
		if (!existsSync(candidate)) {
			continue
		}

		try {
			const config = await importConfig(candidate)
			return {
				path: candidate,
				config,
			}
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error)
			throw new ConfigError(`Failed to load config "${candidate}": ${reason}`)
		}
	}

	return null
}

function resolveCandidatePaths(cwd: string, explicitPath?: string): string[] {
	if (explicitPath) {
		return [resolve(cwd, explicitPath)]
	}

	return CONFIG_CANDIDATES.map((filename) => join(cwd, filename))
}

async function importConfig(filePath: string): Promise<FuseUIConfig> {
	const extension = extname(filePath).toLowerCase()

	if (extension === ".json") {
		const raw = readFileSync(filePath, "utf8")
		return normalizeConfig(JSON.parse(raw))
	}

	if (extension === ".ts") {
		return await loadTypeScriptConfig(filePath)
	}

	const module = await import(pathToFileURL(filePath).href)
	const configExport = module.default ?? module.config ?? module

	return normalizeConfig(configExport)
}

function normalizeConfig(value: unknown): FuseUIConfig {
	if (!value || typeof value !== "object") {
		throw new ConfigError("Config file must export an object.")
	}

	const config = value as FuseUIConfig
	return {
		sources: Array.isArray(config.sources) ? config.sources : [],
		defaults: config.defaults ?? {},
	}
}

async function loadTypeScriptConfig(filePath: string): Promise<FuseUIConfig> {
	try {
		// Try to use tsx's programmatic API to load the TypeScript file
		// @ts-expect-error - tsx may not be installed, handled by catch block
		const tsx = await import("tsx")
		if (typeof tsx.load === "function") {
			const module = await tsx.load(filePath)
			const configExport = module.default ?? module.config ?? module
			return normalizeConfig(configExport)
		}

		// Fallback: try using tsx/esm/api
		// @ts-expect-error - tsx may not be installed, handled by catch block
		const tsxApi = await import("tsx/esm/api")
		if (typeof tsxApi.load === "function") {
			const module = await tsxApi.load(filePath)
			const configExport = module.default ?? module.config ?? module
			return normalizeConfig(configExport)
		}

		// Last resort: try to register tsx loader and use standard import
		if (typeof tsxApi.register === "function") {
			tsxApi.register()
			const module = await import(pathToFileURL(filePath).href)
			const configExport = module.default ?? module.config ?? module
			return normalizeConfig(configExport)
		}
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		throw new ConfigError(
			`Failed to load TypeScript config: ${reason}. Ensure "tsx" is installed.`,
		)
	}

	throw new ConfigError(
		'Loading "fuseui.config.ts" requires tsx. Install "tsx" and try again or compile the config to JavaScript.',
	)
}
