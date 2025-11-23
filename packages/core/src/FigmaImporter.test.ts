import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FigmaImporter } from "./FigmaImporter";
import type { FigmaVariable } from "./types/figma-api";

// Mock fetch globally
global.fetch = vi.fn();

describe("FigmaImporter", () => {
  const mockApiKey = "figd_test_token_123";
  const mockFileKey = "test-file-key-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with valid config", () => {
      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });
      expect(importer).toBeInstanceOf(FigmaImporter);
    });

    it("should throw error if API key is missing", () => {
      expect(() => {
        new FigmaImporter({
          apiKey: "",
          fileKey: mockFileKey,
        });
      }).toThrow("Figma API key (Personal Access Token) is required");
    });

    it("should throw error if file key is missing", () => {
      expect(() => {
        new FigmaImporter({
          apiKey: mockApiKey,
          fileKey: "",
        });
      }).toThrow("Figma file key is required");
    });

    it("should use custom API base URL if provided", () => {
      const customUrl = "https://custom-figma-api.com";
      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
        apiBaseUrl: customUrl,
      });
      expect(importer).toBeInstanceOf(FigmaImporter);
    });
  });

  describe("ingest", () => {
    it("should successfully ingest variables and collections", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:123": {
              id: "VariableID:123",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "Primary brand color",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Colors",
              key: "colors",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      expect(result.tokenSet.tokens).toHaveProperty("color.primary");
      const primaryToken = result.tokenSet.tokens["color.primary"];
      expect(primaryToken).toBeDefined();
      expect(primaryToken?.type).toBe("color");
      expect(primaryToken?.value.type).toBe("value");
      expect(result.warnings).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("should handle multiple modes correctly", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:123": {
              id: "VariableID:123",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "Primary brand color",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
                "ModeID:dark": {
                  type: "VALUE",
                  value: "#FF8C66",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Colors",
              key: "colors",
              modes: [
                { mode_id: "ModeID:light", name: "Light" },
                { mode_id: "ModeID:dark", name: "Dark" },
              ],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      const token = result.tokenSet.tokens["color.primary"];
      if (token) {
        expect(token.modes).toBeDefined();
        expect(token.modes?.Dark).toBeDefined();
        if (token.modes?.Dark) {
          expect(token.modes?.Dark.type).toBe("value");
        }
      }
    });

    it("should handle aliases correctly", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:123": {
              id: "VariableID:123",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "Primary brand color",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:124": {
              id: "VariableID:124",
              name: "color/primary-hover",
              key: "primary-hover",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "Primary hover color",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "ALIAS",
                  value: "VariableID:123",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Colors",
              key: "colors",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      const aliasToken = result.tokenSet.tokens["color.primary-hover"];
      if (aliasToken) {
        expect(aliasToken.value.type).toBe("alias");
        if (aliasToken.value.type === "alias") {
          expect(aliasToken.value.reference).toBe("color.primary");
        }
      }
    });

    it("should handle all variable types (COLOR, FLOAT, STRING, BOOLEAN)", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:1": {
              id: "VariableID:1",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:2": {
              id: "VariableID:2",
              name: "spacing/base",
              key: "base",
              variable_collection_id: "CollectionID:456",
              resolved_type: "FLOAT",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: 16,
                  resolvedType: "FLOAT",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:3": {
              id: "VariableID:3",
              name: "text/label",
              key: "label",
              variable_collection_id: "CollectionID:456",
              resolved_type: "STRING",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "Hello World",
                  resolvedType: "STRING",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:4": {
              id: "VariableID:4",
              name: "feature/enabled",
              key: "enabled",
              variable_collection_id: "CollectionID:456",
              resolved_type: "BOOLEAN",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: true,
                  resolvedType: "BOOLEAN",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Tokens",
              key: "tokens",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      expect(result.tokenSet.tokens["color.primary"]?.type).toBe("color");
      expect(result.tokenSet.tokens["spacing.base"]?.type).toBe("number");
      expect(result.tokenSet.tokens["text.label"]?.type).toBe("string");
      expect(result.tokenSet.tokens["feature.enabled"]?.type).toBe("boolean");
    });

    it("should handle color formats (hex, rgba, rgb)", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:1": {
              id: "VariableID:1",
              name: "color/hex",
              key: "hex",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:2": {
              id: "VariableID:2",
              name: "color/rgba",
              key: "rgba",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "rgba(255, 87, 51, 0.5)",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:3": {
              id: "VariableID:3",
              name: "color/rgb",
              key: "rgb",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "rgb(255, 87, 51)",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Colors",
              key: "colors",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      // Check hex color
      const hexToken = result.tokenSet.tokens["color.hex"];
      expect(hexToken).toBeDefined();
      expect(hexToken?.value.type).toBe("value");
      if (hexToken?.value.type === "value") {
        const color = hexToken.value.value as {
          r: number;
          g: number;
          b: number;
          a?: number;
        };
        expect(color.r).toBeCloseTo(1, 2);
        expect(color.g).toBeCloseTo(0.34, 2);
        expect(color.b).toBeCloseTo(0.2, 2);
      }

      // Check rgba color
      const rgbaToken = result.tokenSet.tokens["color.rgba"];
      expect(rgbaToken).toBeDefined();
      expect(rgbaToken?.value.type).toBe("value");
      if (rgbaToken?.value.type === "value") {
        const color = rgbaToken.value.value as {
          r: number;
          g: number;
          b: number;
          a?: number;
        };
        expect(color.a).toBeCloseTo(0.5, 2);
      }

      // Check rgb color
      const rgbToken = result.tokenSet.tokens["color.rgb"];
      expect(rgbToken).toBeDefined();
      expect(rgbToken?.value.type).toBe("value");
      if (rgbToken?.value.type === "value") {
        const color = rgbToken.value.value as {
          r: number;
          g: number;
          b: number;
          a?: number;
        };
        expect(color.a).toBe(1);
      }
    });

    it("should handle rate limiting errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "60" }),
        json: async () => ({ err: "Rate limit exceeded" }),
      });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      await expect(importer.ingest()).rejects.toThrow(
        "Rate limit exceeded. Retry after 60 seconds"
      );
    });

    it("should handle authentication errors (401)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ err: "Unauthorized" }),
      });

      const importer = new FigmaImporter({
        apiKey: "invalid-token",
        fileKey: mockFileKey,
      });

      await expect(importer.ingest()).rejects.toThrow(
        "Authentication failed: Invalid or expired Personal Access Token"
      );
    });

    it("should handle authentication errors (403)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ err: "Forbidden" }),
      });

      const importer = new FigmaImporter({
        apiKey: "invalid-token",
        fileKey: mockFileKey,
      });

      await expect(importer.ingest()).rejects.toThrow(
        "Authentication failed: Invalid or expired Personal Access Token"
      );
    });

    it("should handle file not found errors (404)", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ err: "File not found" }),
      });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: "invalid-file-key",
      });

      await expect(importer.ingest()).rejects.toThrow(
        'File not found: Invalid file key "invalid-file-key"'
      );
    });

    it("should handle other API errors", async () => {
      // Mock both API calls - both fail
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ err: "Internal server error" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ err: "Internal server error" }),
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      await expect(importer.ingest()).rejects.toThrow("Internal server error");
    });

    it("should return partial results when collections fail but variables succeed", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:123": {
              id: "VariableID:123",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "Primary brand color",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ err: "Collections API error" }),
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      // Should return tokens even though collections failed
      expect(result.tokenSet.tokens).toHaveProperty("color.primary");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("collections"))).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should log warnings for unsupported variable types", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:123": {
              id: "VariableID:123",
              name: "unknown/type",
              key: "type",
              variable_collection_id: "CollectionID:456",
              resolved_type: "UNKNOWN_TYPE" as FigmaVariable["resolved_type"],
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "test",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Tokens",
              key: "tokens",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported variable type "UNKNOWN_TYPE"')
      );
      expect(result.tokenSet.tokens).not.toHaveProperty("unknown.type");
      expect(result.warnings.length).toBeGreaterThan(0);

      consoleWarnSpy.mockRestore();
    });

    it("should include metadata in token set", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {},
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {},
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      expect(result.tokenSet.metadata).toBeDefined();
      expect(result.tokenSet.metadata?.source).toBe("figma");
      expect(result.tokenSet.metadata?.name).toContain(mockFileKey);
    });

    it("should use X-Figma-Token header for authentication", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {},
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {},
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      await importer.ingest();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v1/files/${mockFileKey}/variables/local`),
        expect.objectContaining({
          headers: {
            "X-Figma-Token": mockApiKey,
          },
        })
      );
    });

    it("should detect and warn about token name collisions", async () => {
      const mockVariablesResponse = {
        meta: {
          variables: {
            "VariableID:1": {
              id: "VariableID:1",
              name: "color/primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#FF5733",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:2": {
              id: "VariableID:2",
              name: "color.primary",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#00FF00",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
            "VariableID:3": {
              id: "VariableID:3",
              name: "COLOR/PRIMARY",
              key: "primary",
              variable_collection_id: "CollectionID:456",
              resolved_type: "COLOR",
              description: "",
              hidden_from_publishing: false,
              scopes: [],
              code_syntax: {},
              values_by_mode: {
                "ModeID:light": {
                  type: "VALUE",
                  value: "#0000FF",
                  resolvedType: "COLOR",
                },
              },
              remote: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      const mockCollectionsResponse = {
        meta: {
          variableCollections: {
            "CollectionID:456": {
              id: "CollectionID:456",
              name: "Colors",
              key: "colors",
              modes: [{ mode_id: "ModeID:light", name: "Light" }],
              default_mode_id: "ModeID:light",
              remote: false,
              hidden_from_publishing: false,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockVariablesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCollectionsResponse,
        });

      const importer = new FigmaImporter({
        apiKey: mockApiKey,
        fileKey: mockFileKey,
      });

      const result = await importer.ingest();

      // Should have warnings for collisions
      const collisionWarnings = result.warnings.filter((w) =>
        w.includes("Token name collision")
      );
      expect(collisionWarnings.length).toBeGreaterThan(0);

      // All three variables normalize to "color.primary"
      expect(collisionWarnings.some((w) => w.includes("color/primary"))).toBe(
        true
      );
      expect(collisionWarnings.some((w) => w.includes("color.primary"))).toBe(
        true
      );
      expect(collisionWarnings.some((w) => w.includes("COLOR/PRIMARY"))).toBe(
        true
      );

      // Only one token should exist (the last one overwrites)
      expect(Object.keys(result.tokenSet.tokens)).toContain("color.primary");
      expect(Object.keys(result.tokenSet.tokens).length).toBe(1);
    });
  });
});
