import type {
	ImporterResult,
	NormalizedToken,
	TokenImporter,
} from "@fuseui-org/core"
import { DTCGImporter, FigmaImporter } from "@fuseui-org/core"
import {
	ConfigError,
	type DTCGSourceConfig,
	type FigmaSourceConfig,
	type FuseUIConfig,
	type LoadedConfig,
	loadConfig,
	type TokenSourceConfig,
} from "../config"
import type { Logger } from "../logger"
import { createLogger } from "../logger"

export enum ExitCode {
	Success = 0,
	Fatal = 1,
	Validation = 2,
}

export interface ImportCommandOptions {
	configPath?: string
	source?: string
	debug?: boolean
	dtcgPath?: string
	dtcgUrl?: string
	figmaApiKey?: string
	figmaFileKey?: string
	figmaBaseUrl?: string
	env?: NodeJS.ProcessEnv
	cwd?: string
	logger?: Logger
	configLoader?: typeof loadConfig
	importerFactories?: Partial<ImporterFactoryMap>
}

export class CliError extends Error {
	constructor(
		message: string,
		public exitCode: ExitCode = ExitCode.Fatal,
		public details?: unknown,
	) {
		super(message)
		this.name = "CliError"
	}
}

type ImporterFactoryMap = {
	dtcg: (source: DTCGSourceConfig) => TokenImporter
	figma: (source: FigmaSourceConfig) => TokenImporter
}

const defaultFactories: ImporterFactoryMap = {
	dtcg: (source) =>
		new DTCGImporter({
			filePath: source.filePath,
			fileUrl: source.fileUrl,
		}),
	figma: (source) =>
		new FigmaImporter({
			apiKey: source.apiKey!,
			fileKey: source.fileKey,
			apiBaseUrl: source.apiBaseUrl,
		}),
}

const ENV_KEYS = {
	configPath: "FUSEUI_CONFIG",
	figmaApiKey: "FUSEUI_FIGMA_API_KEY",
	figmaFileKey: "FUSEUI_FIGMA_FILE_KEY",
	figmaBaseUrl: "FUSEUI_FIGMA_BASE_URL",
	dtcgPath: "FUSEUI_DTCG_FILE_PATH",
	dtcgUrl: "FUSEUI_DTCG_FILE_URL",
	debug: "FUSEUI_DEBUG",
}

export async function runImportCommand(
	options: ImportCommandOptions = {},
): Promise<ExitCode> {
	const env = options.env ?? process.env
	const envOverrides = readEnv(env)
	const debugEnabled = Boolean(options.debug ?? envOverrides.debug ?? false)
	const logger = options.logger ?? createLogger({ debug: debugEnabled })

	const configPath = options.configPath ?? envOverrides.configPath
	const loader = options.configLoader ?? loadConfig

	let loadedConfig: LoadedConfig | null = null
	try {
		loadedConfig = await loader({
			cwd: options.cwd,
			explicitPath: configPath,
		})
	} catch (error: unknown) {
		if (error instanceof ConfigError) {
			throw new CliError(error.message, ExitCode.Validation)
		}
		throw toError(error)
	}

	const config = loadedConfig?.config ?? {}

	const sources = resolveSources({
		config,
		sourceFilter: options.source,
		env: envOverrides,
		options,
	})

	if (!sources.length) {
		throw new CliError(
			"No token sources configured. Provide a fuseui.config.* file or CLI flags.",
			ExitCode.Validation,
		)
	}

	const factories = {
		...defaultFactories,
		...options.importerFactories,
	}

	let exitCode: ExitCode = ExitCode.Success

	for (const source of sources) {
		const sourceLabel = describeSource(source)
		logger.info(`Importing tokens from ${sourceLabel}...`)

		const importer = createImporter(source, factories)

		let result: ImporterResult
		try {
			result = await importer.ingest()
		} catch (error: unknown) {
			const reason = error instanceof Error ? error.message : String(error)
			throw new CliError(
				`Failed to import tokens from ${sourceLabel}: ${reason}`,
				ExitCode.Fatal,
				error,
			)
		}

		reportResult(logger, sourceLabel, result)

		if (result.errors.length > 0) {
			exitCode = ExitCode.Validation
		}
	}

	return exitCode
}

function resolveSources(params: {
	config: FuseUIConfig
	sourceFilter?: string
	env: EnvOverrides
	options: ImportCommandOptions
}): TokenSourceConfig[] {
	const cliSource = buildSourceFromCli(params.options, params.env)
	if (cliSource) {
		return [cliSource]
	}

	const sources = [...(params.config.sources ?? [])]
	const filtered = params.sourceFilter
		? sources.filter((source) =>
				matchesFilter(source, params.sourceFilter as string),
			)
		: sources

	return filtered.map((source) => applyDefaults(source, params))
}

function matchesFilter(source: TokenSourceConfig, filter: string): boolean {
	const normalized = filter.toLowerCase()
	return (
		source.type.toLowerCase() === normalized ||
		(source.label?.toLowerCase() ?? "") === normalized
	)
}

function applyDefaults(
	source: TokenSourceConfig,
	params: {
		config: FuseUIConfig
		env: EnvOverrides
		options: ImportCommandOptions
	},
): TokenSourceConfig {
	if (source.type === "figma") {
		const apiKey =
			source.apiKey ??
			params.options.figmaApiKey ??
			params.env.figmaApiKey ??
			params.config.defaults?.figmaApiKey

		if (!apiKey) {
			throw new CliError(
				`Missing Figma API key for source "${
					source.label ?? source.fileKey
				}". Provide it via config, --figma-api-key, or ${
					ENV_KEYS.figmaApiKey
				}.`,
				ExitCode.Validation,
			)
		}

		return {
			...source,
			apiKey,
			apiBaseUrl:
				source.apiBaseUrl ??
				params.options.figmaBaseUrl ??
				params.env.figmaBaseUrl,
		}
	}

	if (source.type === "dtcg") {
		const filePath =
			source.filePath ?? params.options.dtcgPath ?? params.env.dtcgPath
		const fileUrl =
			source.fileUrl ?? params.options.dtcgUrl ?? params.env.dtcgUrl

		if (!filePath && !fileUrl) {
			throw new CliError(
				`Missing DTCG source location for "${
					source.label ?? "dtcg"
				}". Provide filePath/fileUrl in config or via --dtcg-path/--dtcg-url.`,
				ExitCode.Validation,
			)
		}

		return {
			...source,
			filePath,
			fileUrl,
		}
	}

	throw new CliError(
		`Unsupported token source type: ${(source as TokenSourceConfig).type}`,
		ExitCode.Validation,
	)
}

function buildSourceFromCli(
	options: ImportCommandOptions,
	env: EnvOverrides,
): TokenSourceConfig | null {
	if (
		options.source &&
		!["dtcg", "figma"].includes(options.source.toLowerCase())
	) {
		return null
	}

	const requestedType = options.source?.toLowerCase()

	if (
		requestedType === "dtcg" ||
		options.dtcgPath ||
		options.dtcgUrl ||
		env.dtcgPath ||
		env.dtcgUrl
	) {
		const filePath = options.dtcgPath ?? env.dtcgPath
		const fileUrl = options.dtcgUrl ?? env.dtcgUrl

		if (!filePath && !fileUrl) {
			throw new CliError(
				"Provide --dtcg-path or --dtcg-url to run a DTCG import.",
				ExitCode.Validation,
			)
		}

		return {
			type: "dtcg",
			label: "dtcg-cli",
			filePath,
			fileUrl,
		}
	}

	if (requestedType === "figma" || options.figmaFileKey || env.figmaFileKey) {
		const fileKey = options.figmaFileKey ?? env.figmaFileKey
		const apiKey = options.figmaApiKey ?? env.figmaApiKey

		if (!fileKey) {
			throw new CliError(
				"Provide --figma-file-key (or FUSEUI_FIGMA_FILE_KEY) to run a Figma import.",
				ExitCode.Validation,
			)
		}

		if (!apiKey) {
			throw new CliError(
				"Missing Figma API key. Use --figma-api-key or set FUSEUI_FIGMA_API_KEY.",
				ExitCode.Validation,
			)
		}

		return {
			type: "figma",
			label: "figma-cli",
			fileKey,
			apiKey,
			apiBaseUrl: options.figmaBaseUrl ?? env.figmaBaseUrl,
		}
	}

	return null
}

function createImporter(
	source: TokenSourceConfig,
	factories: ImporterFactoryMap,
): TokenImporter {
	if (source.type === "dtcg") {
		return factories.dtcg(source)
	}

	if (source.type === "figma") {
		return factories.figma(source)
	}

	throw new CliError(
		`Unsupported token source type: ${(source as TokenSourceConfig).type}`,
		ExitCode.Validation,
	)
}

function reportResult(
	logger: Logger,
	sourceLabel: string,
	result: ImporterResult,
): void {
	const tokens = (result.tokenSet.tokens ?? {}) as Record<
		string,
		NormalizedToken
	>
	const tokenCount = Object.keys(tokens).length
	const tokenTypes = new Set(
		Object.values(tokens)
			.map((token) => (token as NormalizedToken).type)
			.filter(Boolean),
	)

	logger.info(
		`Imported ${tokenCount} token${
			tokenCount === 1 ? "" : "s"
		} from ${sourceLabel}.`,
	)
	logger.info(
		`Token types: ${
			tokenTypes.size ? Array.from(tokenTypes).join(", ") : "unknown"
		}`,
	)

	if (result.warnings.length) {
		for (const warning of result.warnings) {
			logger.warn(warning)
		}
	}

	if (result.errors.length) {
		for (const error of result.errors) {
			logger.error(error)
		}
	}
}

function describeSource(source: TokenSourceConfig): string {
	const label = source.label ? ` (${source.label})` : ""

	switch (source.type) {
		case "dtcg": {
			const location = source.filePath ?? source.fileUrl ?? "unspecified path"
			return `DTCG${label} - ${location}`
		}
		case "figma":
			return `Figma${label} - file ${source.fileKey}`
		default: {
			const fallback = source as TokenSourceConfig
			return `${fallback.type ?? "unknown"}${label}`
		}
	}
}

type EnvOverrides = {
	configPath?: string
	figmaApiKey?: string
	figmaFileKey?: string
	figmaBaseUrl?: string
	dtcgPath?: string
	dtcgUrl?: string
	debug?: boolean
}

function readEnv(env: NodeJS.ProcessEnv): EnvOverrides {
	return {
		configPath: env[ENV_KEYS.configPath],
		figmaApiKey: env[ENV_KEYS.figmaApiKey],
		figmaFileKey: env[ENV_KEYS.figmaFileKey],
		figmaBaseUrl: env[ENV_KEYS.figmaBaseUrl],
		dtcgPath: env[ENV_KEYS.dtcgPath],
		dtcgUrl: env[ENV_KEYS.dtcgUrl],
		debug: coerceBoolean(env[ENV_KEYS.debug]),
	}
}

function coerceBoolean(value?: string): boolean | undefined {
	if (value === undefined) {
		return undefined
	}

	return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error))
}
