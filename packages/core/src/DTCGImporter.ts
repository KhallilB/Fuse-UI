import type { ImporterResult } from "./types/importer-types";
import type { DTCGTokenFile } from "./types/input-sources";
import type { NormalizedToken, TokenSetMetadata } from "./types/token-types";
import {
  flattenDTCGTokens,
  normalizeDTCGToken,
} from "./utils/dtcg/dtcg-normalizers";
import { validateDTCGFile } from "./utils/dtcg/dtcg-validators";
import { loadDTCGFile } from "./utils/dtcg/file-loader";

export interface DTCGImporterConfig {
  filePath?: string; // Local file path
  fileUrl?: string; // Remote URL
}

export type DTCGImporterResult = ImporterResult;

/**
 * Imports design tokens from DTCG (Design Tokens Community Group) format.
 *
 * Supports loading from local file paths or remote URLs, validates the structure,
 * and normalizes tokens to the internal token schema.
 */
export class DTCGImporter {
  private readonly filePath?: string;
  private readonly fileUrl?: string;

  constructor(config: DTCGImporterConfig) {
    if (!config.filePath && !config.fileUrl) {
      throw new Error("Either filePath or fileUrl must be provided");
    }
    if (config.filePath && config.fileUrl) {
      throw new Error("Cannot specify both filePath and fileUrl");
    }
    this.filePath = config.filePath;
    this.fileUrl = config.fileUrl;
  }

  /**
   * Loads, validates, and normalizes DTCG tokens into a token set.
   *
   * @throws {Error} If file cannot be loaded or validation fails
   */
  async ingest(): Promise<ImporterResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Load file
    let file: DTCGTokenFile;
    try {
      file = await loadDTCGFile(this.filePath ?? this.fileUrl ?? "");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(`Failed to load DTCG file: ${errorMessage}`);
      throw new Error(`DTCG import failed: ${errorMessage}`);
    }

    // Validate file structure
    const validation = validateDTCGFile(file);
    if (!validation.valid) {
      const errorMessage = `DTCG file validation failed: ${validation.errors.join(
        "; "
      )}`;
      errors.push(...validation.errors);
      throw new Error(`DTCG import failed: ${errorMessage}`);
    }

    // Flatten tokens
    const flattenedTokens = flattenDTCGTokens(file);

    // Normalize tokens
    const tokens: Record<string, NormalizedToken> = {};
    for (const [path, token] of flattenedTokens.entries()) {
      try {
        const normalizedToken = normalizeDTCGToken(
          path,
          token,
          flattenedTokens,
          warnings
        );
        if (normalizedToken) {
          // Check for name collisions
          if (normalizedToken.name in tokens) {
            const warning = `Token name collision: Multiple tokens normalize to "${normalizedToken.name}". The later token will overwrite the earlier one.`;
            warnings.push(warning);
            console.warn(warning);
          }
          tokens[normalizedToken.name] = normalizedToken;
        }
      } catch (error: unknown) {
        const errorMessage = `Failed to normalize token at path "${path}": ${
          error instanceof Error ? error.message : String(error)
        }`;
        warnings.push(errorMessage);
        console.warn(errorMessage);
      }
    }

    const metadata: TokenSetMetadata = {
      source: "dtcg",
      name: this.filePath
        ? `DTCG Tokens - ${this.filePath}`
        : `DTCG Tokens - ${this.fileUrl}`,
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
