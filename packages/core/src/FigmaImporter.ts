/**
 * Figma Importer Module
 *
 * Authenticates with Figma and fetches Variables (tokens) from a file.
 * Normalizes tokens to the internal FuseUI schema.
 */

import type { FigmaVariable, FigmaVariableCollection } from "./types/figma-api"
import type {
	NormalizedToken,
	NormalizedTokenSet,
	TokenSetMetadata,
} from "./types/token-types"
import { FigmaApiClient } from "./utils/figma/figma-api-client"
import {
	normalizeVariable,
	normalizeVariableName,
} from "./utils/figma/figma-normalizers"

/**
 * Configuration for Figma import
 */
export interface FigmaImporterConfig {
	/** Figma Personal Access Token */
	apiKey: string
	/** Figma file key (ID) */
	fileKey: string
	/** Optional: Custom API base URL (defaults to https://api.figma.com) */
	apiBaseUrl?: string
}

/**
 * Result of importing Figma variables
 */
export interface FigmaImporterResult {
	/** Normalized token set */
	tokenSet: NormalizedTokenSet
	/** Warnings encountered during import */
	warnings: string[]
	/** Errors encountered during import */
	errors: string[]
}

/**
 * Figma importer orchestrator
 *
 * Coordinates fetching and normalizing Figma variables into tokens.
 */
export class FigmaImporter {
	private readonly apiClient: FigmaApiClient
	private readonly fileKey: string

	constructor(config: FigmaImporterConfig) {
		this.fileKey = config.fileKey
		this.apiClient = new FigmaApiClient({
			apiKey: config.apiKey,
			fileKey: config.fileKey,
			apiBaseUrl: config.apiBaseUrl,
		})
	}

	/**
	 * Fetches all variables and collections from Figma and normalizes them
	 */
	async ingest(): Promise<FigmaImporterResult> {
		const warnings: string[] = []
		const errors: string[] = []

		try {
			// Fetch variables and collections in parallel
			const [variablesResponse, collectionsResponse] = await Promise.all([
				this.apiClient.fetchVariables(),
				this.apiClient.fetchVariableCollections(),
			])

			const variables = variablesResponse.meta.variables
			const collections = collectionsResponse.meta.variableCollections

			// Build a map of variable ID to name for alias resolution
			const variableIdToName = new Map<string, string>()
			for (const [id, variable] of Object.entries(variables)) {
				variableIdToName.set(id, normalizeVariableName(variable.name))
			}

			// Build a map of mode ID to mode name for each collection
			const modeIdToName = new Map<string, string>()
			for (const collection of Object.values(
				collections,
			) as FigmaVariableCollection[]) {
				for (const mode of collection.modes) {
					modeIdToName.set(mode.mode_id, mode.name)
				}
			}

			// Normalize variables to tokens
			const tokens: Record<string, NormalizedToken> = {}
			for (const [id, variable] of Object.entries(variables) as [
				string,
				FigmaVariable,
			][]) {
				try {
					const token = normalizeVariable(
						variable,
						variableIdToName,
						modeIdToName,
						warnings,
					)
					if (token) {
						tokens[token.name] = token
					}
				} catch (error: unknown) {
					const errorMessage = `Failed to normalize variable "${variable.name}" (${id}): ${error instanceof Error ? error.message : String(error)}`
					warnings.push(errorMessage)
					console.warn(errorMessage)
				}
			}

			const metadata: TokenSetMetadata = {
				source: "figma",
				name: `Figma Variables - ${this.fileKey}`,
			}

			return {
				tokenSet: {
					tokens,
					metadata,
				},
				warnings,
				errors,
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			errors.push(errorMessage)
			throw new Error(`Figma import failed: ${errorMessage}`)
		}
	}
}

