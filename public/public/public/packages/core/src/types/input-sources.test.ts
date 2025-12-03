import { describe, expect, it } from "vitest";
import {
  type DTCGJsonInput,
  type FigmaVariablesInput,
  isDTCGInput,
  isFigmaInput,
  type TokenInputSource,
} from "./input-sources";

describe("Input Source Types", () => {
  describe("FigmaVariablesInput", () => {
    it("should accept valid Figma Variables API structure", () => {
      const figmaInput: FigmaVariablesInput = {
        type: "figma",
        fileKey: "abc123",
        apiKey: "figd_xxx",
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
      };

      expect(figmaInput.type).toBe("figma");
      expect(figmaInput.variables?.["VariableID:123"]?.resolved_type).toBe(
        "COLOR",
      );
    });

    it("should handle ALIAS type values correctly", () => {
      const figmaInput: FigmaVariablesInput = {
        type: "figma",
        fileKey: "abc123",
        apiKey: "figd_xxx",
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
                value: "VariableID:123", // Variable ID reference
                resolvedType: "COLOR",
              },
            },
            remote: false,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      };

      const aliasValue =
        figmaInput.variables?.["VariableID:124"]?.values_by_mode["ModeID:light"];
      expect(aliasValue?.type).toBe("ALIAS");
      expect(aliasValue?.value).toBe("VariableID:123");
    });

    it("should handle all variable types", () => {
      const figmaInput: FigmaVariablesInput = {
        type: "figma",
        fileKey: "abc123",
        apiKey: "figd_xxx",
        variables: {
          bool: {
            id: "bool",
            name: "feature/enabled",
            key: "enabled",
            variable_collection_id: "coll",
            resolved_type: "BOOLEAN",
            description: "",
            hidden_from_publishing: false,
            scopes: [],
            code_syntax: {},
            values_by_mode: {
              mode: { type: "VALUE", value: true },
            },
            remote: false,
            created_at: "",
            updated_at: "",
          },
          float: {
            id: "float",
            name: "spacing/base",
            key: "base",
            variable_collection_id: "coll",
            resolved_type: "FLOAT",
            description: "",
            hidden_from_publishing: false,
            scopes: [],
            code_syntax: {},
            values_by_mode: {
              mode: { type: "VALUE", value: 16 },
            },
            remote: false,
            created_at: "",
            updated_at: "",
          },
          string: {
            id: "string",
            name: "text/label",
            key: "label",
            variable_collection_id: "coll",
            resolved_type: "STRING",
            description: "",
            hidden_from_publishing: false,
            scopes: [],
            code_syntax: {},
            values_by_mode: {
              mode: { type: "VALUE", value: "Hello" },
            },
            remote: false,
            created_at: "",
            updated_at: "",
          },
        },
      };

      expect(figmaInput.variables?.bool?.resolved_type).toBe("BOOLEAN");
      expect(figmaInput.variables?.float?.resolved_type).toBe("FLOAT");
      expect(figmaInput.variables?.string?.resolved_type).toBe("STRING");
    });
  });

  describe("DTCGJsonInput", () => {
    it("should accept valid DTCG JSON structure", () => {
      const dtcgInput: DTCGJsonInput = {
        type: "dtcg",
        content: {
          $schema: "https://schemas.w3.org/tr/design-tokens/format/v0.4.0",
          color: {
            primary: {
              $type: "color",
              $value: "#FF5733",
              $description: "Primary brand color",
              light: {
                $value: "#FF5733",
              },
              dark: {
                $value: "#FF8C66",
              },
            },
          },
        },
      };

      expect(dtcgInput.type).toBe("dtcg");
      const colorGroup = dtcgInput.content.color as Record<
        string,
        { $type?: string }
      >;
      expect(colorGroup?.primary?.$type).toBe("color");
    });

    it("should handle DTCG aliases with {token.path} syntax", () => {
      const dtcgInput: DTCGJsonInput = {
        type: "dtcg",
        content: {
          color: {
            primary: {
              $type: "color",
              $value: "#FF5733",
            },
            secondary: {
              $type: "color",
              $value: "{color.primary}", // Alias reference
            },
          },
        },
      };

      const colorGroup = dtcgInput.content.color as Record<
        string,
        { $value?: string }
      >;
      const secondaryValue = colorGroup?.secondary;
      expect(secondaryValue?.$value).toBe("{color.primary}");
    });

    it("should handle DTCG typography tokens (individual types)", () => {
      const dtcgInput: DTCGJsonInput = {
        type: "dtcg",
        content: {
          typography: {
            body: {
              fontFamily: {
                $type: "fontFamily",
                $value: "Inter, sans-serif",
              },
              fontSize: {
                $type: "dimension",
                $value: "16px",
              },
              fontWeight: {
                $type: "fontWeight",
                $value: "400",
              },
              lineHeight: {
                $type: "dimension",
                $value: "24px",
              },
            },
          },
        },
      };

      const typographyGroup = dtcgInput.content.typography as Record<
        string,
        Record<string, { $type?: string; $value?: string }>
      >;
      const body = typographyGroup?.body;
      expect(body?.fontFamily?.$type).toBe("fontFamily");
      expect(body?.fontSize?.$type).toBe("dimension");
      expect(body?.fontWeight?.$type).toBe("fontWeight");
    });

    it("should handle spacing and dimension tokens", () => {
      const dtcgInput: DTCGJsonInput = {
        type: "dtcg",
        content: {
          spacing: {
            small: {
              $type: "dimension",
              $value: "8px",
            },
            medium: {
              $type: "dimension",
              $value: "16px",
            },
            large: {
              $type: "dimension",
              $value: "24px",
            },
          },
        },
      };

      const spacing = dtcgInput.content.spacing as Record<
        string,
        { $type?: string; $value?: string }
      >;
      expect(spacing.small?.$type).toBe("dimension");
      expect(spacing.small?.$value).toBe("8px");
    });
  });

  describe("Type Guards", () => {
    it("should correctly identify Figma input", () => {
      const input: TokenInputSource = {
        type: "figma",
        fileKey: "abc123",
        apiKey: "figd_xxx",
      };

      expect(isFigmaInput(input)).toBe(true);
      expect(isDTCGInput(input)).toBe(false);

      if (isFigmaInput(input)) {
        // TypeScript should narrow the type here
        expect(input.fileKey).toBe("abc123");
      }
    });

    it("should correctly identify DTCG input", () => {
      const input: TokenInputSource = {
        type: "dtcg",
        content: {
          color: {
            primary: {
              $type: "color",
              $value: "#FF5733",
            },
          },
        },
      };

      expect(isDTCGInput(input)).toBe(true);
      expect(isFigmaInput(input)).toBe(false);

      if (isDTCGInput(input)) {
        // TypeScript should narrow the type here
        expect(input.content).toBeDefined();
      }
    });
  });
});

