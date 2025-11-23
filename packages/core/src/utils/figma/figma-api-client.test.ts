import { describe, expect, it, vi, beforeEach } from "vitest";
import { FigmaApiClient } from "./figma-api-client";

global.fetch = vi.fn();

describe("FigmaApiClient", () => {
	const mockApiKey = "test-token";
	const mockFileKey = "test-file";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("throws if API key is missing", () => {
			expect(() => new FigmaApiClient({ apiKey: "", fileKey: mockFileKey })).toThrow(
				"Figma API key (Personal Access Token) is required",
			);
		});

		it("throws if file key is missing", () => {
			expect(() => new FigmaApiClient({ apiKey: mockApiKey, fileKey: "" })).toThrow(
				"Figma file key is required",
			);
		});
	});

	describe("fetchVariables", () => {
		it("fetches variables successfully", async () => {
			const mockResponse = {
				meta: { variables: { "var-1": { id: "var-1", name: "test" } } },
			};
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const client = new FigmaApiClient({ apiKey: mockApiKey, fileKey: mockFileKey });
			const result = await client.fetchVariables();

			expect(result.meta.variables).toBeDefined();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/variables/local"),
				expect.objectContaining({
					headers: { "X-Figma-Token": mockApiKey },
				}),
			);
		});

		it("handles rate limiting", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 429,
				headers: new Headers({ "Retry-After": "60" }),
			});

			const client = new FigmaApiClient({ apiKey: mockApiKey, fileKey: mockFileKey });
			await expect(client.fetchVariables()).rejects.toThrow("Rate limit exceeded");
		});

		it("handles authentication errors", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const client = new FigmaApiClient({ apiKey: mockApiKey, fileKey: mockFileKey });
			await expect(client.fetchVariables()).rejects.toThrow("Authentication failed");
		});

		it("handles file not found", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			const client = new FigmaApiClient({ apiKey: mockApiKey, fileKey: "invalid" });
			await expect(client.fetchVariables()).rejects.toThrow("File not found");
		});
	});

	describe("fetchVariableCollections", () => {
		it("fetches collections successfully", async () => {
			const mockResponse = {
				meta: { variableCollections: { "col-1": { id: "col-1", name: "test" } } },
			};
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const client = new FigmaApiClient({ apiKey: mockApiKey, fileKey: mockFileKey });
			const result = await client.fetchVariableCollections();

			expect(result.meta.variableCollections).toBeDefined();
		});
	});
});

