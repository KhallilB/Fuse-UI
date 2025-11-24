import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DTCGToken,
  DTCGTokenFile,
} from "../../types/input-sources";
import type { NormalizedToken } from "../../types/token-types";
import {
  flattenDTCGTokens,
  mapDTCGTypeToTokenType,
  normalizeDTCGToken,
  normalizeDTCGTokenValue,
  parseAliasReference,
  parseDTCGValue,
} from "./dtcg-normalizers";

describe("dtcg-normalizers", () => {
  describe("mapDTCGTypeToTokenType", () => {
    it("maps color to color", () => {
      expect(mapDTCGTypeToTokenType("color")).toBe("color");
    });

    it("maps dimension to spacing when path contains 'spacing'", () => {
      expect(mapDTCGTypeToTokenType("dimension", "spacing.small")).toBe(
        "spacing"
      );
      expect(mapDTCGTypeToTokenType("dimension", "spacing.medium")).toBe(
        "spacing"
      );
      expect(mapDTCGTypeToTokenType("dimension", "spacing.large")).toBe(
        "spacing"
      );
    });

    it("maps dimension to dimension when path does not contain 'spacing'", () => {
      expect(mapDTCGTypeToTokenType("dimension", "size.width")).toBe(
        "dimension"
      );
      expect(mapDTCGTypeToTokenType("dimension", "borderRadius.small")).toBe(
        "dimension"
      );
      expect(mapDTCGTypeToTokenType("dimension")).toBe("dimension");
    });

    it("returns null for typography property types (should be composed)", () => {
      expect(mapDTCGTypeToTokenType("fontFamily")).toBeNull();
      expect(mapDTCGTypeToTokenType("fontSize")).toBeNull();
      expect(mapDTCGTypeToTokenType("fontWeight")).toBeNull();
      expect(mapDTCGTypeToTokenType("lineHeight")).toBeNull();
      expect(mapDTCGTypeToTokenType("letterSpacing")).toBeNull();
    });

    it("maps borderRadius to borderRadius", () => {
      expect(mapDTCGTypeToTokenType("borderRadius")).toBe("borderRadius");
    });

    it("maps shadow to shadow", () => {
      expect(mapDTCGTypeToTokenType("shadow")).toBe("shadow");
    });

    it("returns null for unsupported types", () => {
      expect(mapDTCGTypeToTokenType("unknown")).toBeNull();
    });
  });

  describe("parseDTCGValue", () => {
    it("parses color values", () => {
      expect(parseDTCGValue("#FF5733", "color")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
        a: 1,
      });
      expect(parseDTCGValue("rgba(255, 87, 51, 0.5)", "color")).toEqual({
        r: 1,
        g: 0.3411764705882353,
        b: 0.2,
        a: 0.5,
      });
    });

    it("parses dimension values", () => {
      expect(parseDTCGValue("16px", "dimension")).toEqual({
        value: 16,
        unit: "px",
      });
      expect(parseDTCGValue("1rem", "dimension")).toEqual({
        value: 1,
        unit: "rem",
      });
    });

    it("parses fontWeight as number", () => {
      expect(parseDTCGValue(400, "fontWeight")).toBe(400);
      expect(parseDTCGValue(700, "fontWeight")).toBe(700);
    });

    it("parses fontWeight as string number", () => {
      expect(parseDTCGValue("400", "fontWeight")).toBe(400);
      expect(parseDTCGValue("700", "fontWeight")).toBe(700);
    });

    it("parses fontWeight as named string", () => {
      expect(parseDTCGValue("bold", "fontWeight")).toBe("bold");
      expect(parseDTCGValue("normal", "fontWeight")).toBe("normal");
    });

    it("parses fontFamily as string", () => {
      expect(parseDTCGValue("Inter, sans-serif", "fontFamily")).toBe(
        "Inter, sans-serif"
      );
    });

    it("returns null for invalid values", () => {
      expect(parseDTCGValue(null, "color")).toBeNull();
      expect(parseDTCGValue(undefined, "color")).toBeNull();
      expect(parseDTCGValue("invalid", "dimension")).toBeNull();
    });
  });

  describe("parseAliasReference", () => {
    it("parses valid alias references", () => {
      expect(parseAliasReference("{color.primary}")).toBe("color.primary");
      expect(parseAliasReference("{spacing.small}")).toBe("spacing.small");
      expect(parseAliasReference("{typography.body}")).toBe("typography.body");
    });

    it("returns null for non-alias strings", () => {
      expect(parseAliasReference("color.primary")).toBeNull();
      expect(parseAliasReference("#FF5733")).toBeNull();
      expect(parseAliasReference("")).toBeNull();
    });

    it("returns null for non-string values", () => {
      expect(parseAliasReference(123 as never)).toBeNull();
      expect(parseAliasReference(null as never)).toBeNull();
    });
  });

  describe("normalizeDTCGTokenValue", () => {
    const allTokens = new Map<string, DTCGToken>();

    it("normalizes concrete color values", () => {
      const result = normalizeDTCGTokenValue(
        "#FF5733",
        "color",
        "color.primary",
        allTokens
      );
      expect(result).toEqual({
        type: "value",
        value: {
          r: 1,
          g: 0.3411764705882353,
          b: 0.2,
          a: 1,
        },
      });
    });

    it("normalizes alias references", () => {
      allTokens.set("color.primary", {
        $type: "color",
        $value: "#FF5733",
      });
      const result = normalizeDTCGTokenValue(
        "{color.primary}",
        "color",
        "color.secondary",
        allTokens
      );
      expect(result).toEqual({
        type: "alias",
        reference: "color.primary",
      });
    });

    it("returns null for alias to non-existent token", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = normalizeDTCGTokenValue(
        "{color.missing}",
        "color",
        "color.secondary",
        allTokens
      );
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("returns null for invalid values", () => {
      const result = normalizeDTCGTokenValue(
        null,
        "color",
        "color.primary",
        allTokens
      );
      expect(result).toBeNull();
    });
  });

  describe("flattenDTCGTokens", () => {
    it("flattens simple token structure", () => {
      const file: DTCGTokenFile = {
        color: {
          primary: {
            $type: "color",
            $value: "#FF5733",
          },
        },
        spacing: {
          small: {
            $type: "dimension",
            $value: "8px",
          },
        },
      };

      const tokens = flattenDTCGTokens(file);
      expect(tokens.size).toBe(2);
      expect(tokens.get("color.primary")).toEqual({
        $type: "color",
        $value: "#FF5733",
      });
      expect(tokens.get("spacing.small")).toEqual({
        $type: "dimension",
        $value: "8px",
      });
    });

    it("composes typography groups into composite tokens", () => {
      const file: DTCGTokenFile = {
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
      };

      const tokens = flattenDTCGTokens(file);
      expect(tokens.size).toBe(1);
      const typographyToken = tokens.get("typography.body");
      expect(typographyToken).toBeDefined();
      expect(typographyToken?.$type).toBe("typography");
      expect(typographyToken?.$value).toBeDefined();
      const typographyValue = typographyToken?.$value as {
        fontFamily: string;
        fontSize: { value: number; unit: string };
        fontWeight: number | string;
        lineHeight: { value: number; unit: string };
      };
      expect(typographyValue.fontFamily).toBe("Inter, sans-serif");
      expect(typographyValue.fontSize).toEqual({ value: 16, unit: "px" });
      expect(typographyValue.fontWeight).toBe(400);
      expect(typographyValue.lineHeight).toEqual({ value: 24, unit: "px" });
    });

    it("skips individual typography property tokens when part of a group", () => {
      const file: DTCGTokenFile = {
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
          },
        },
      };

      const tokens = flattenDTCGTokens(file);
      // Should only have the composed typography token, not individual property tokens
      expect(tokens.size).toBe(1);
      expect(tokens.has("typography.body")).toBe(true);
      expect(tokens.has("typography.body.fontFamily")).toBe(false);
      expect(tokens.has("typography.body.fontSize")).toBe(false);
    });

    it("handles mixed typography and non-typography tokens", () => {
      const file: DTCGTokenFile = {
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
          },
        },
        color: {
          primary: {
            $type: "color",
            $value: "#FF5733",
          },
        },
      };

      const tokens = flattenDTCGTokens(file);
      expect(tokens.size).toBe(2);
      expect(tokens.has("typography.body")).toBe(true);
      expect(tokens.has("color.primary")).toBe(true);
    });

    it("does not compose incomplete typography groups", () => {
      const file: DTCGTokenFile = {
        typography: {
          body: {
            // Missing fontFamily and fontSize (required)
            fontWeight: {
              $type: "fontWeight",
              $value: "400",
            },
          },
        },
      };

      const tokens = flattenDTCGTokens(file);
      // Should not create a composed token for incomplete groups
      expect(tokens.size).toBe(0);
    });

    it("handles nested groups correctly", () => {
      const file: DTCGTokenFile = {
        design: {
          tokens: {
            color: {
              primary: {
                $type: "color",
                $value: "#FF5733",
              },
            },
          },
        },
      };

      const tokens = flattenDTCGTokens(file);
      expect(tokens.size).toBe(1);
      expect(tokens.has("design.tokens.color.primary")).toBe(true);
    });
  });

  describe("normalizeDTCGToken", () => {
    const allTokens = new Map<string, DTCGToken>();
    const warnings: string[] = [];

    beforeEach(() => {
      allTokens.clear();
      warnings.length = 0;
    });

    it("normalizes color tokens", () => {
      const token: DTCGToken = {
        $type: "color",
        $value: "#FF5733",
        $description: "Primary color",
      };

      const result = normalizeDTCGToken(
        "color.primary",
        token,
        allTokens,
        warnings
      );

      expect(result).toEqual({
        id: "color-primary",
        name: "color.primary",
        type: "color",
        value: {
          type: "value",
          value: {
            r: 1,
            g: 0.3411764705882353,
            b: 0.2,
            a: 1,
          },
        },
        description: "Primary color",
        metadata: {
          source: "dtcg",
        },
      });
      expect(warnings).toHaveLength(0);
    });

    it("normalizes spacing tokens (dimension in spacing path)", () => {
      const token: DTCGToken = {
        $type: "dimension",
        $value: "16px",
      };

      const result = normalizeDTCGToken(
        "spacing.medium",
        token,
        allTokens,
        warnings
      );

      expect(result?.type).toBe("spacing");
      expect(result?.value).toEqual({
        type: "value",
        value: { value: 16, unit: "px" },
      });
    });

    it("normalizes dimension tokens (dimension in non-spacing path)", () => {
      const token: DTCGToken = {
        $type: "dimension",
        $value: "100px",
      };

      const result = normalizeDTCGToken(
        "size.width",
        token,
        allTokens,
        warnings
      );

      expect(result?.type).toBe("dimension");
      expect(result?.value).toEqual({
        type: "value",
        value: { value: 100, unit: "px" },
      });
    });

    it("normalizes composed typography tokens", () => {
      const token: DTCGToken = {
        $type: "typography",
        $value: {
          fontFamily: "Inter, sans-serif",
          fontSize: { value: 16, unit: "px" },
          fontWeight: 400,
          lineHeight: { value: 24, unit: "px" },
        },
      };

      const result = normalizeDTCGToken(
        "typography.body",
        token,
        allTokens,
        warnings
      );

      expect(result).toEqual({
        id: "typography-body",
        name: "typography.body",
        type: "typography",
        value: {
          type: "value",
          value: {
            fontFamily: "Inter, sans-serif",
            fontSize: { value: 16, unit: "px" },
            fontWeight: 400,
            lineHeight: { value: 24, unit: "px" },
          },
        },
        metadata: {
          source: "dtcg",
        },
      });
    });

    it("handles mode-specific values", () => {
      const token: DTCGToken = {
        $type: "color",
        $value: "#FF5733",
        light: {
          $value: "#FFFFFF",
        },
        dark: {
          $value: "#000000",
        },
      };

      allTokens.set("color.primary", token);

      const result = normalizeDTCGToken(
        "color.primary",
        token,
        allTokens,
        warnings
      );

      expect(result?.modes).toBeDefined();
      expect(result?.modes?.light).toEqual({
        type: "value",
        value: {
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        },
      });
      expect(result?.modes?.dark).toEqual({
        type: "value",
        value: {
          r: 0,
          g: 0,
          b: 0,
          a: 1,
        },
      });
    });

    it("excludes typography property tokens from mode detection", () => {
      const token: DTCGToken = {
        $type: "color",
        $value: "#FF5733",
        light: {
          $value: "#FFFFFF",
        },
        // This should not be treated as a mode
        fontFamily: {
          $type: "fontFamily",
          $value: "Inter",
        },
      };

      allTokens.set("color.primary", token);

      const result = normalizeDTCGToken(
        "color.primary",
        token,
        allTokens,
        warnings
      );

      expect(result?.modes).toBeDefined();
      expect(result?.modes?.light).toBeDefined();
      expect(result?.modes?.fontFamily).toBeUndefined();
    });

    it("handles alias references in values", () => {
      allTokens.set("color.primary", {
        $type: "color",
        $value: "#FF5733",
      });

      const token: DTCGToken = {
        $type: "color",
        $value: "{color.primary}",
      };

      const result = normalizeDTCGToken(
        "color.secondary",
        token,
        allTokens,
        warnings
      );

      expect(result?.value).toEqual({
        type: "alias",
        reference: "color.primary",
      });
    });

    it("returns null and adds warning for missing $type", () => {
      const token: DTCGToken = {
        $value: "#FF5733",
      };

      const result = normalizeDTCGToken(
        "color.primary",
        token,
        allTokens,
        warnings
      );

      expect(result).toBeNull();
      expect(warnings).toContain(
        'Token at path "color.primary" missing $type'
      );
    });

    it("returns null and adds warning for unsupported type", () => {
      const token: DTCGToken = {
        $type: "unsupported",
        $value: "value",
      };

      const result = normalizeDTCGToken(
        "token.unsupported",
        token,
        allTokens,
        warnings
      );

      expect(result).toBeNull();
      expect(warnings).toContain(
        'Token at path "token.unsupported" has unsupported type "unsupported"'
      );
    });

    it("returns null and adds warning for invalid value", () => {
      const token: DTCGToken = {
        $type: "color",
        $value: null,
      };

      const result = normalizeDTCGToken(
        "color.primary",
        token,
        allTokens,
        warnings
      );

      expect(result).toBeNull();
      expect(warnings).toContain(
        'Token at path "color.primary" has invalid or missing $value'
      );
    });

    it("returns null for invalid typography composition", () => {
      const token: DTCGToken = {
        $type: "typography",
        $value: {
          // Missing required fontFamily and fontSize
          fontWeight: 400,
        },
      };

      const result = normalizeDTCGToken(
        "typography.body",
        token,
        allTokens,
        warnings
      );

      expect(result).toBeNull();
      expect(warnings).toContain(
        'Token at path "typography.body" has invalid typography composition'
      );
    });
  });

  describe("integration: full token file normalization", () => {
    it("normalizes a complete DTCG token file", () => {
      const file: DTCGTokenFile = {
        color: {
          primary: {
            $type: "color",
            $value: "#FF5733",
            $description: "Primary brand color",
          },
          secondary: {
            $type: "color",
            $value: "{color.primary}",
          },
        },
        spacing: {
          small: {
            $type: "dimension",
            $value: "8px",
          },
          medium: {
            $type: "dimension",
            $value: "16px",
          },
        },
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
      };

      const flattened = flattenDTCGTokens(file);
      expect(flattened.size).toBe(5); // 2 colors + 2 spacing + 1 typography

      const warnings: string[] = [];
      const tokens: Record<string, NormalizedToken> = {};

      for (const [path, token] of flattened.entries()) {
        const normalized = normalizeDTCGToken(
          path,
          token,
          flattened,
          warnings
        );
        if (normalized) {
          tokens[normalized.name] = normalized;
        }
      }

      expect(Object.keys(tokens)).toHaveLength(5);
      expect(tokens["color.primary"]).toBeDefined();
      expect(tokens["color.secondary"]?.value).toEqual({
        type: "alias",
        reference: "color.primary",
      });
      expect(tokens["spacing.small"]?.type).toBe("spacing");
      expect(tokens["spacing.medium"]?.type).toBe("spacing");
      expect(tokens["typography.body"]?.type).toBe("typography");
      expect(warnings).toHaveLength(0);
    });
  });
});

