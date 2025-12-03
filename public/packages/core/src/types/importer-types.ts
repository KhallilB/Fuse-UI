import type { NormalizedTokenSet } from "./token-types";

/**
 * Base interface for importer results.
 * All importers should return a result conforming to this structure.
 */
export interface ImporterResult {
	tokenSet: NormalizedTokenSet;
	warnings: string[];
	errors: string[];
}

/**
 * Base interface for importer classes.
 * Provides a common contract for all token importers.
 */
export interface TokenImporter {
	/**
	 * Ingests tokens from the source and returns a normalized token set.
	 * 
	 * @throws {Error} If ingestion fails critically (file load, validation, etc.)
	 */
	ingest(): Promise<ImporterResult>;
}

