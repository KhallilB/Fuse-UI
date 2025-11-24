import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { loadDTCGFile } from "./file-loader";
import type { DTCGTokenFile } from "../../types/input-sources";

vi.mock("node:fs");

global.fetch = vi.fn();

describe("file-loader", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("loadDTCGFile", () => {
		describe("local file path", () => {
			it("loads and parses valid JSON file", async () => {
				const mockFile: DTCGTokenFile = {
					$schema: "https://schemas.design-tokens.com/format/v0.1",
					color: {
						primary: {
							$type: "color",
							$value: "#FF5733",
						},
					},
				};

				vi.mocked(readFileSync).mockReturnValue(
					JSON.stringify(mockFile),
				);

				const result = await loadDTCGFile("./tokens.json");
				expect(result).toEqual(mockFile);
				expect(readFileSync).toHaveBeenCalledWith(
					"./tokens.json",
					"utf-8",
				);
			});

			it("throws on file not found", async () => {
				const error = new Error("ENOENT");
				(error as Error & { code: string }).code = "ENOENT";
				vi.mocked(readFileSync).mockImplementation(() => {
					throw error;
				});

				await expect(loadDTCGFile("./missing.json")).rejects.toThrow(
					"DTCG file not found: ./missing.json",
				);
			});

			it("throws on invalid JSON", async () => {
				vi.mocked(readFileSync).mockReturnValue("invalid json {");

				await expect(loadDTCGFile("./invalid.json")).rejects.toThrow(
					"Invalid JSON in DTCG file",
				);
			});

			it("throws on read error", async () => {
				vi.mocked(readFileSync).mockImplementation(() => {
					throw new Error("Permission denied");
				});

				await expect(loadDTCGFile("./tokens.json")).rejects.toThrow(
					"Failed to load DTCG file: Permission denied",
				);
			});
		});

		describe("remote URL", () => {
			it("loads and parses valid JSON from URL", async () => {
				const mockFile: DTCGTokenFile = {
					color: {
						primary: {
							$type: "color",
							$value: "#FF5733",
						},
					},
				};

				vi.mocked(global.fetch).mockResolvedValue({
					ok: true,
					json: async () => mockFile,
				} as Response);

				const result = await loadDTCGFile(
					"https://example.com/tokens.json",
				);
				expect(result).toEqual(mockFile);
				expect(global.fetch).toHaveBeenCalledWith(
					"https://example.com/tokens.json",
				);
			});

			it("throws on HTTP error", async () => {
				vi.mocked(global.fetch).mockResolvedValue({
					ok: false,
					status: 404,
					statusText: "Not Found",
				} as Response);

				await expect(
					loadDTCGFile("https://example.com/missing.json"),
				).rejects.toThrow(
					"Failed to fetch DTCG file from URL: 404 Not Found",
				);
			});

			it("throws on network error", async () => {
				vi.mocked(global.fetch).mockRejectedValue(
					new Error("Network error"),
				);

				await expect(
					loadDTCGFile("https://example.com/tokens.json"),
				).rejects.toThrow(
					"Failed to load DTCG file from URL: Network error",
				);
			});

			it("handles http:// URLs", async () => {
				const mockFile: DTCGTokenFile = {
					color: {
						primary: {
							$type: "color",
							$value: "#FF5733",
						},
					},
				};

				vi.mocked(global.fetch).mockResolvedValue({
					ok: true,
					json: async () => mockFile,
				} as Response);

				const result = await loadDTCGFile("http://example.com/tokens.json");
				expect(result).toEqual(mockFile);
				expect(global.fetch).toHaveBeenCalledWith(
					"http://example.com/tokens.json",
				);
			});
		});
	});
});

