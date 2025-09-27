/**
 * FuseUI SDK
 * 
 * This SDK provides programmatic access to the FuseUI API.
 * It is designed to work in both browser and Node.js environments.
 */

/**
 * Configuration options for the FuseClient
 */
export interface FuseClientOptions {
  /**
   * API base URL
   * @default "https://api.fuseui.com"
   */
  baseUrl?: string;
  
  /**
   * API version
   * @default "v1"
   */
  apiVersion?: string;
  
  /**
   * API key for authentication
   */
  apiKey?: string;
}

/**
 * Main client class for interacting with the FuseUI API
 */
export class FuseClient {
  private baseUrl: string;
  private apiVersion: string;
  private apiKey?: string;
  
  /**
   * Create a new FuseClient instance
   * @param options Configuration options
   */
  constructor(options: FuseClientOptions = {}) {
    this.baseUrl = options.baseUrl || "https://api.fuseui.com";
    this.apiVersion = options.apiVersion || "v1";
    this.apiKey = options.apiKey;
  }

  /**
   * Get the full API URL for a given endpoint
   * @param endpoint API endpoint path
   * @returns Full API URL
   */
  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${this.apiVersion}/${endpoint}`;
  }

  /**
   * Make an API request
   * @param endpoint API endpoint path
   * @param options Fetch options
   * @returns Response data
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);

    const headers = new Headers(options.headers);

    // Add API key if available
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    // Add content type if not specified
    if (!headers.has("Content-Type") && options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Example method - Get user information
   * @returns User information
   */
  async getUser(): Promise<{ id: string; name: string }> {
    return this.request<{ id: string; name: string }>("user");
  }

  /**
   * Example method - Ping the API
   * @returns Ping response
   */
  async ping(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>("ping");
  }
}

// Export main client
export default FuseClient;
