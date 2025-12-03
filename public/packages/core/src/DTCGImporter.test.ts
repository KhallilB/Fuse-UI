import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DTCGImporter } from "./DTCGImporter";
import type { DTCGTokenFile } from "./types/input-sources";
import {
  flattenDTCGTokens,
  normalizeDTCGToken,
} from "./utils/dtcg/dtcg-normalizers";
import { validateDTCGFile } from "./utils/dtcg/dtcg-validators";
import { loadDTCGFile } from "./utils/dtcg/file-loader";

vi.mock("./utils/dtcg/file-loader");
vi.mock("./utils/dtcg/dtcg-validators");
vi.mock("./utils/dtcg/dtcg-normalizers");

describe("DTCGImporter", () => {
  const mockTokenData = { $type: "color", $value: "#FF5733" } as const;
  const mockFile: DTCGTokenFile = {
    color: { primary: mockTokenData },
  };

  const mockToken = {
    id: "color-primary",
    name: "color.primary",
    type: "color" as const,
    value: { type: "value" as const, value: { r: 1, g: 0.34, b: 0.2, a: 1 } },
    metadata: { source: "dtcg" as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadDTCGFile).mockResolvedValue(mockFile);
    vi.mocked(validateDTCGFile).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(flattenDTCGTokens).mockReturnValue(
      new Map([["color.primary", mockTokenData]])
    );
    vi.mocked(normalizeDTCGToken).mockReturnValue(mockToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("initializes with filePath or fileUrl", () => {
      expect(new DTCGImporter({ filePath: "./tokens.json" })).toBeInstanceOf(
        DTCGImporter
      );
      expect(
        new DTCGImporter({ fileUrl: "https://example.com/tokens.json" })
      ).toBeInstanceOf(DTCGImporter);
    });

    it("throws on invalid config", () => {
      expect(() => new DTCGImporter({})).toThrow(
        "Either filePath or fileUrl must be provided"
      );
      expect(
        () =>
          new DTCGImporter({
            filePath: "./tokens.json",
            fileUrl: "https://example.com/tokens.json",
          })
      ).toThrow("Cannot specify both filePath and fileUrl");
    });
  });

  describe("ingest", () => {
    it("ingests valid tokens", async () => {
      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      const result = await importer.ingest();

      expect(result.tokenSet.tokens["color.primary"]).toEqual(mockToken);
      expect(result.tokenSet.metadata?.source).toBe("dtcg");
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("handles multiple tokens", async () => {
      const token1Data = { $type: "color", $value: "#FF5733" };
      const token2Data = { $type: "color", $value: "#33FF57" };
      const multiFile: DTCGTokenFile = {
        color: {
          primary: token1Data,
          secondary: token2Data,
        },
      };

      const token2 = {
        ...mockToken,
        id: "color-secondary",
        name: "color.secondary",
      };

      vi.mocked(loadDTCGFile).mockResolvedValue(multiFile);
      vi.mocked(flattenDTCGTokens).mockReturnValue(
        new Map([
          ["color.primary", token1Data],
          ["color.secondary", token2Data],
        ] as [string, typeof token1Data][])
      );
      vi.mocked(normalizeDTCGToken)
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(token2);

      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      const result = await importer.ingest();

      expect(Object.keys(result.tokenSet.tokens)).toHaveLength(2);
    });

    it("throws on file load failure", async () => {
      vi.mocked(loadDTCGFile).mockRejectedValue(new Error("File not found"));

      const importer = new DTCGImporter({ filePath: "./missing.json" });
      await expect(importer.ingest()).rejects.toThrow("DTCG import failed");
    });

    it("throws on validation failure", async () => {
      vi.mocked(validateDTCGFile).mockReturnValue({
        valid: false,
        errors: ["Invalid token"],
      });

      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      await expect(importer.ingest()).rejects.toThrow("validation failed");
    });

    it("skips tokens that fail normalization", async () => {
      vi.mocked(flattenDTCGTokens).mockReturnValue(
        new Map([
          ["color.primary", mockTokenData],
          ["color.invalid", mockTokenData],
        ])
      );
      vi.mocked(normalizeDTCGToken)
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(null);

      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      const result = await importer.ingest();

      expect(result.tokenSet.tokens).toHaveProperty("color.primary");
      expect(result.tokenSet.tokens).not.toHaveProperty("color.invalid");
    });

    it("collects warnings on normalization errors", async () => {
      vi.mocked(normalizeDTCGToken).mockImplementation(() => {
        throw new Error("Normalization failed");
      });

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      const result = await importer.ingest();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.includes("Failed to normalize"))
      ).toBe(true);

      consoleWarnSpy.mockRestore();
    });

    it("handles token name collisions", async () => {
      vi.mocked(flattenDTCGTokens).mockReturnValue(
        new Map([
          ["color.primary", mockTokenData],
          ["color.primary.duplicate", mockTokenData],
        ])
      );

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const importer = new DTCGImporter({ filePath: "./tokens.json" });
      const result = await importer.ingest();

      expect(
        result.warnings.some((w) => w.includes("Token name collision"))
      ).toBe(true);

      consoleWarnSpy.mockRestore();
    });

    it("uses fileUrl in metadata", async () => {
      vi.mocked(flattenDTCGTokens).mockReturnValue(new Map());
      vi.mocked(normalizeDTCGToken).mockReturnValue(null);

      const importer = new DTCGImporter({
        fileUrl: "https://example.com/tokens.json",
      });
      const result = await importer.ingest();

      expect(result.tokenSet.metadata?.name).toContain(
        "https://example.com/tokens.json"
      );
    });
  });
});
