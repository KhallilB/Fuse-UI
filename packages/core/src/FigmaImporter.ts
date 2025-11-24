import type { FigmaVariable, FigmaVariableCollection } from "./types/figma-api";
import type { ImporterResult, TokenImporter } from "./types/importer-types";
import type { NormalizedToken, TokenSetMetadata } from "./types/token-types";
import { FigmaApiClient } from "./utils/figma/figma-api-client";
import {
  normalizeVariable,
  normalizeVariableName,
} from "./utils/figma/figma-normalizers";

/** Configuration for Figma importer. */
export interface FigmaImporterConfig {
  apiKey: string;
  fileKey: string;
  /** @default "https://api.figma.com" */
  apiBaseUrl?: string;
}

export type FigmaImporterResult = ImporterResult;

/**
 * Imports design tokens from Figma Variables API.
 *
 * Fetches variables and collections, normalizes them to the internal token schema,
 * and resolves alias references between variables.
 */
export class FigmaImporter implements TokenImporter {
  private readonly apiClient: FigmaApiClient;
  private readonly fileKey: string;

  constructor(config: FigmaImporterConfig) {
    this.fileKey = config.fileKey;
    this.apiClient = new FigmaApiClient({
      apiKey: config.apiKey,
      fileKey: config.fileKey,
      apiBaseUrl: config.apiBaseUrl,
    });
  }

  /**
   * Fetches and normalizes Figma variables into a token set.
   *
   * @throws {Error} If variables cannot be fetched (collections are optional)
   */
  async ingest(): Promise<ImporterResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Fetch variables and collections in parallel, allowing partial failures
    const [variablesResult, collectionsResult] = await Promise.allSettled([
      this.apiClient.fetchVariables(),
      this.apiClient.fetchVariableCollections(),
    ]);

    // Variables are required - fail if we can't get them
    if (variablesResult.status === "rejected") {
      const errorMessage =
        variablesResult.reason instanceof Error
          ? variablesResult.reason.message
          : String(variablesResult.reason);
      errors.push(errorMessage);
      throw new Error(`Figma import failed: ${errorMessage}`);
    }

    const variables = variablesResult.value.meta.variables;

    // Collections are optional - if they fail, we can still process variables
    let collections: Record<string, FigmaVariableCollection> = {};
    if (collectionsResult.status === "rejected") {
      const errorMessage =
        collectionsResult.reason instanceof Error
          ? collectionsResult.reason.message
          : String(collectionsResult.reason);
      warnings.push(
        `Failed to fetch variable collections: ${errorMessage}. Continuing with mode IDs instead of names.`
      );
    } else {
      collections = collectionsResult.value.meta.variableCollections;
    }

    // Build a map of variable ID to name for alias resolution
    const variableIdToName = new Map<string, string>();
    for (const [id, variable] of Object.entries(variables)) {
      variableIdToName.set(id, normalizeVariableName(variable.name));
    }

    // Build a map of mode ID to mode name for each collection
    const modeIdToName = new Map<string, string>();
    // Build a map of collection ID to default mode ID
    const collectionIdToDefaultModeId = new Map<string, string>();
    for (const collection of Object.values(
      collections
    ) as FigmaVariableCollection[]) {
      collectionIdToDefaultModeId.set(
        collection.id,
        collection.default_mode_id
      );
      for (const mode of collection.modes) {
        modeIdToName.set(mode.mode_id, mode.name);
      }
    }

    // Normalize variables to tokens
    const tokens: Record<string, NormalizedToken> = {};
    for (const [id, variable] of Object.entries(variables) as [
      string,
      FigmaVariable
    ][]) {
      try {
        const token = normalizeVariable(
          variable,
          variableIdToName,
          modeIdToName,
          warnings,
          collectionIdToDefaultModeId.get(variable.variable_collection_id)
        );
        if (token) {
          // Detect name collisions
          if (token.name in tokens) {
            const warning = `Token name collision: Variable "${variable.name}" (${id}) normalizes to "${token.name}" which already exists. The later variable will overwrite the earlier one.`;
            warnings.push(warning);
            console.warn(warning);
          }
          tokens[token.name] = token;
        }
      } catch (error: unknown) {
        const errorMessage = `Failed to normalize variable "${
          variable.name
        }" (${id}): ${error instanceof Error ? error.message : String(error)}`;
        warnings.push(errorMessage);
        console.warn(errorMessage);
      }
    }

    const metadata: TokenSetMetadata = {
      source: "figma",
      name: `Figma Variables - ${this.fileKey}`,
    };

    return {
      tokenSet: {
        tokens,
        metadata,
      },
      warnings,
      errors,
    };
  }
}
