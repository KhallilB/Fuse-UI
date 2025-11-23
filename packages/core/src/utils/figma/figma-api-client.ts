import type {
	FigmaErrorResponse,
	FigmaVariableCollectionsResponse,
	FigmaVariablesResponse,
} from "../../types/figma-api";

export interface FigmaApiClientConfig {
	apiKey: string;
	fileKey: string;
	/** @default "https://api.figma.com" */
	apiBaseUrl?: string;
}

/**
 * Client for Figma REST API Variables endpoints.
 * 
 * @see https://developers.figma.com/docs/rest-api/variables-endpoints/
 */
export class FigmaApiClient {
	private readonly apiKey: string;
	private readonly fileKey: string;
	private readonly apiBaseUrl: string;

	/**
	 * @throws {Error} If apiKey or fileKey is missing
	 */
	constructor(config: FigmaApiClientConfig) {
		if (!config.apiKey) {
			throw new Error("Figma API key (Personal Access Token) is required");
		}
		if (!config.fileKey) {
			throw new Error("Figma file key is required");
		}

		this.apiKey = config.apiKey;
		this.fileKey = config.fileKey;
		this.apiBaseUrl = config.apiBaseUrl || "https://api.figma.com";
	}

	/**
	 * Fetches all local variables from the Figma file.
	 * 
	 * @throws {Error} If API request fails, rate limit exceeded (429), authentication fails (401/403), or file not found (404)
	 * @throws {Error} If response is missing variables data
	 */
	async fetchVariables(): Promise<FigmaVariablesResponse> {
		const url = `${this.apiBaseUrl}/v1/files/${this.fileKey}/variables/local`;
		const response = await this.makeRequest<FigmaVariablesResponse>(url);

		if (!response.meta?.variables) {
			throw new Error("Invalid response: missing variables");
		}

		return response;
	}

	/**
	 * Fetches all variable collections from the Figma file.
	 * 
	 * @throws {Error} If API request fails, rate limit exceeded (429), authentication fails (401/403), or file not found (404)
	 * @throws {Error} If response is missing variableCollections data
	 */
	async fetchVariableCollections(): Promise<FigmaVariableCollectionsResponse> {
		const url = `${this.apiBaseUrl}/v1/files/${this.fileKey}/variable-collections`;
		const response = await this.makeRequest<FigmaVariableCollectionsResponse>(url);

		if (!response.meta?.variableCollections) {
			throw new Error("Invalid response: missing variableCollections");
		}

		return response;
	}

	private async makeRequest<T>(url: string): Promise<T> {
		const response = await fetch(url, {
			headers: {
				"X-Figma-Token": this.apiKey,
			},
		});

		// Handle rate limiting
		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After");
			const message = `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ""}`;
			throw new Error(message);
		}

		// Handle authentication errors
		if (response.status === 401 || response.status === 403) {
			throw new Error("Authentication failed: Invalid or expired Personal Access Token");
		}

		// Handle file not found
		if (response.status === 404) {
			throw new Error(`File not found: Invalid file key "${this.fileKey}"`);
		}

		// Handle other errors
		if (!response.ok) {
			let errorMessage = `API request failed with status ${response.status}`;
			try {
				const errorData = (await response.json()) as FigmaErrorResponse;
				if (errorData.err) {
					errorMessage = errorData.err;
				}
			} catch {
				// Ignore JSON parse errors
			}
			throw new Error(errorMessage);
		}

		return (await response.json()) as T;
	}
}

