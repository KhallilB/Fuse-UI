import { readFileSync } from "node:fs";
import type { DTCGTokenFile } from "../../types/input-sources";

/**
 * Loads a DTCG token file from a local file path or remote URL.
 * 
 * @throws {Error} If file cannot be loaded, is invalid JSON, or network request fails
 */
export async function loadDTCGFile(
	pathOrUrl: string,
): Promise<DTCGTokenFile> {
	const isUrl = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");

	if (isUrl) {
		try {
			const response = await fetch(pathOrUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch DTCG file from URL: ${response.status} ${response.statusText}`,
				);
			}
			const json = await response.json();
			return json as DTCGTokenFile;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to load DTCG file from URL: ${error.message}`);
			}
			throw new Error(`Failed to load DTCG file from URL: ${String(error)}`);
		}
	}

	// Local file path
	try {
		const fileContent = readFileSync(pathOrUrl, "utf-8");
		const json = JSON.parse(fileContent) as DTCGTokenFile;
		return json;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(`Invalid JSON in DTCG file: ${error.message}`);
		}
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			throw new Error(`DTCG file not found: ${pathOrUrl}`);
		}
		if (error instanceof Error) {
			throw new Error(`Failed to load DTCG file: ${error.message}`);
		}
		throw new Error(`Failed to load DTCG file: ${String(error)}`);
	}
}

