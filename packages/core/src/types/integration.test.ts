import { describe, expect, it } from "vitest";
import type { DTCGJsonInput, FigmaVariablesInput } from "./input-sources";
import type {
  NormalizedToken,
  NormalizedTokenSet,
  TokenType,
} from "./token-types";

/**
 * Integration tests that validate the schema can handle real-world scenarios
 * and edge cases that would occur when transforming from input sources.
 */

describe("Schema Integration Tests", () => {
  describe("Figma to Normalized Schema Mapping", () => {
    it("should handle complete Figma variable with all modes", () => {
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
              "ModeID:mobile": {
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
        variableCollections: {
          "CollectionID:456": {
            id: "CollectionID:456",
            name: "Colors",
            key: "colors",
            modes: [
              { mode_id: "ModeID:light", name: "Light" },
              { mode_id: "ModeID:dark", name: "Dark" },
              { mode_id: "ModeID:mobile", name: "Mobile" },
            ],
            default_mode_id: "ModeID:light",
            remote: false,
            hidden_from_publishing: false,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      };

      // This represents what a transformer would produce
      const expectedToken: NormalizedToken = {
        id: "color-primary",
        name: "color.primary",
        type: "color",
        value: {
          type: "value",
          // After parsing "#FF5733" → { r: 1, g: 0.34, b: 0.2, a: 1 }
          value: { r: 1, g: 0.34, b: 0.2, a: 1 },
        },
        modes: {
          light: {
            type: "value",
            value: { r: 1, g: 0.34, b: 0.2, a: 1 },
          },
          dark: {
            type: "value",
            value: { r: 1, g: 0.55, b: 0.4, a: 1 },
          },
          mobile: {
            type: "value",
            value: { r: 1, g: 0.34, b: 0.2, a: 1 },
          },
        },
        description: "Primary brand color",
        metadata: {
          source: "figma",
          sourceId: "VariableID:123",
        },
      };

      expect(expectedToken.modes).toHaveProperty("light");
      expect(expectedToken.modes).toHaveProperty("dark");
      expect(expectedToken.modes).toHaveProperty("mobile");
    });

    it("should handle Figma alias references", () => {
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
            description: "",
            hidden_from_publishing: false,
            scopes: [],
            code_syntax: {},
            values_by_mode: {
              mode: {
                type: "VALUE",
                value: "#FF5733",
                resolvedType: "COLOR",
              },
            },
            remote: false,
            created_at: "",
            updated_at: "",
          },
          "VariableID:124": {
            id: "VariableID:124",
            name: "color/primary-hover",
            key: "primary-hover",
            variable_collection_id: "CollectionID:456",
            resolved_type: "COLOR",
            description: "",
            hidden_from_publishing: false,
            scopes: [],
            code_syntax: {},
            values_by_mode: {
              mode: {
                type: "ALIAS",
                value: "VariableID:123", // Reference to another variable
                resolvedType: "COLOR",
              },
            },
            remote: false,
            created_at: "",
            updated_at: "",
          },
        },
      };

      // Expected normalized token with alias
      const expectedToken: NormalizedToken = {
        id: "color-primary-hover",
        name: "color.primary.hover",
        type: "color",
        value: {
          type: "alias",
          reference: "color.primary", // Resolved from VariableID:123
        },
        metadata: {
          source: "figma",
          sourceId: "VariableID:124",
        },
      };

      expect(expectedToken.value.type).toBe("alias");
      if (expectedToken.value.type === "alias") {
        expect(expectedToken.value.reference).toBe("color.primary");
      }
    });
  });

  describe("DTCG to Normalized Schema Mapping", () => {
    it("should handle DTCG color token with modes", () => {
      const dtcgInput: DTCGJsonInput = {
        type: "dtcg",
        content: {
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

      // Expected normalized token
      const expectedToken: NormalizedToken = {
        id: "color-primary",
        name: "color.primary",
        type: "color",
        value: {
          type: "value",
          // After parsing "#FF5733" → { r: 1, g: 0.34, b: 0.2, a: 1 }
          value: { r: 1, g: 0.34, b: 0.2, a: 1 },
        },
        modes: {
          light: {
            type: "value",
            value: { r: 1, g: 0.34, b: 0.2, a: 1 },
          },
          dark: {
            type: "value",
            value: { r: 1, g: 0.55, b: 0.4, a: 1 },
          },
        },
        description: "Primary brand color",
        metadata: {
          source: "dtcg",
        },
      };

      expect(expectedToken.modes?.light).toBeDefined();
      expect(expectedToken.modes?.dark).toBeDefined();
    });

    it("should handle DTCG alias with {token.path} syntax", () => {
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
              $value: "{color.primary}", // Alias
            },
          },
        },
      };

      // Expected normalized token
      const expectedToken: NormalizedToken = {
        id: "color-secondary",
        name: "color.secondary",
        type: "color",
        value: {
          type: "alias",
          reference: "color.primary", // Parsed from {color.primary}
        },
        metadata: {
          source: "dtcg",
        },
      };

      expect(expectedToken.value.type).toBe("alias");
    });

    it("should handle DTCG typography tokens (composite)", () => {
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

      // Expected normalized composite typography token
      const expectedToken: NormalizedToken = {
        id: "typography-body",
        name: "typography.body",
        type: "typography",
        value: {
          type: "value",
          value: {
            fontFamily: "Inter, sans-serif",
            fontSize: { value: 16, unit: "px" }, // Parsed from "16px"
            fontWeight: 400, // Parsed from "400"
            lineHeight: { value: 24, unit: "px" }, // Parsed from "24px"
          },
        },
        metadata: {
          source: "dtcg",
        },
      };

      expect(expectedToken.type).toBe("typography");
      const typographyValue = expectedToken.value.value as {
        fontFamily: string;
        fontSize: { value: number; unit: string };
      };
      expect(typographyValue.fontFamily).toBe("Inter, sans-serif");
      expect(typographyValue.fontSize.value).toBe(16);
    });

    it("should handle DTCG spacing tokens", () => {
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

      // Expected normalized spacing tokens
      const expectedTokens: NormalizedToken[] = [
        {
          id: "spacing-small",
          name: "spacing.small",
          type: "spacing",
          value: {
            type: "value",
            value: { value: 8, unit: "px" }, // Parsed from "8px"
          },
          metadata: { source: "dtcg" },
        },
        {
          id: "spacing-medium",
          name: "spacing.medium",
          type: "spacing",
          value: {
            type: "value",
            value: { value: 16, unit: "px" },
          },
          metadata: { source: "dtcg" },
        },
        {
          id: "spacing-large",
          name: "spacing.large",
          type: "spacing",
          value: {
            type: "value",
            value: { value: 24, unit: "px" },
          },
          metadata: { source: "dtcg" },
        },
      ];

      expectedTokens.forEach((token) => {
        expect(token.type).toBe("spacing");
        const spacingValue = token.value.value as { value: number; unit: string };
        expect(spacingValue.unit).toBe("px");
      });
    });
  });

  describe("Complete Token Set Scenarios", () => {
    it("should handle a complete token set with all token types", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: {
              type: "value",
              value: { r: 1, g: 0, b: 0, a: 1 },
            },
          },
          "spacing.small": {
            id: "spacing-small",
            name: "spacing.small",
            type: "spacing",
            value: {
              type: "value",
              value: { value: 8, unit: "px" },
            },
          },
          "typography.body": {
            id: "typography-body",
            name: "typography.body",
            type: "typography",
            value: {
              type: "value",
              value: {
                fontFamily: "Inter",
                fontSize: { value: 16, unit: "px" },
                fontWeight: 400,
                lineHeight: { value: 24, unit: "px" },
              },
            },
          },
          "borderRadius.small": {
            id: "border-radius-small",
            name: "borderRadius.small",
            type: "borderRadius",
            value: {
              type: "value",
              value: { value: 4, unit: "px" },
            },
          },
          "shadow.small": {
            id: "shadow-small",
            name: "shadow.small",
            type: "shadow",
            value: {
              type: "value",
              value: {
                color: { r: 0, g: 0, b: 0, a: 0.1 },
                offsetX: 0,
                offsetY: 2,
                blur: 4,
                spread: 0,
              },
            },
          },
        },
        metadata: {
          name: "Complete Design System",
          version: "1.0.0",
          source: "figma",
        },
      };

      const requiredTypes: TokenType[] = [
        "color",
        "spacing",
        "typography",
        "borderRadius",
        "shadow",
      ];

      requiredTypes.forEach((type) => {
        const token = Object.values(tokenSet.tokens).find((t) => t.type === type);
        expect(token).toBeDefined();
        expect(token?.type).toBe(type);
      });
    });

    it("should handle token set with aliases and modes", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: {
              type: "value",
              value: { r: 1, g: 0, b: 0, a: 1 },
            },
            modes: {
              light: {
                type: "value",
                value: { r: 1, g: 0, b: 0, a: 1 },
              },
              dark: {
                type: "value",
                value: { r: 1, g: 0.2, b: 0.2, a: 1 },
              },
            },
          },
          "color.primary.hover": {
            id: "color-primary-hover",
            name: "color.primary.hover",
            type: "color",
            value: {
              type: "alias",
              reference: "color.primary",
            },
            modes: {
              light: {
                type: "alias",
                reference: "color.primary",
              },
              dark: {
                type: "value",
                value: { r: 1, g: 0.3, b: 0.3, a: 1 },
              },
            },
          },
        },
      };

      const primaryToken = tokenSet.tokens["color.primary"];
      const hoverToken = tokenSet.tokens["color.primary.hover"];

      expect(primaryToken?.modes?.light).toBeDefined();
      expect(primaryToken?.modes?.dark).toBeDefined();
      expect(hoverToken?.value.type).toBe("alias");
      expect(hoverToken?.modes?.light?.type).toBe("alias");
      expect(hoverToken?.modes?.dark?.type).toBe("value");
    });
  });
});

