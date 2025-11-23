import { describe, expect, it } from "vitest";
import type {
  BorderRadiusValue,
  ColorValue,
  NormalizedToken,
  NormalizedTokenSet,
  ShadowValue,
  SpacingValue,
  TokenAlias,
  TokenType,
  TokenValue,
  TypographyValue,
} from "./token-types";

describe("Token Types", () => {
  describe("ColorValue", () => {
    it("should accept valid RGBA color values", () => {
      const color: ColorValue = {
        r: 1,
        g: 0.34,
        b: 0.2,
        a: 1,
      };

      expect(color.r).toBe(1);
      expect(color.g).toBe(0.34);
      expect(color.b).toBe(0.2);
      expect(color.a).toBe(1);
    });

    it("should accept color without alpha", () => {
      const color: ColorValue = {
        r: 0,
        g: 0,
        b: 0,
      };

      expect(color.a).toBeUndefined();
    });
  });

  describe("SpacingValue", () => {
    it("should accept valid spacing values with units", () => {
      const spacing: SpacingValue = {
        value: 16,
        unit: "px",
      };

      expect(spacing.value).toBe(16);
      expect(spacing.unit).toBe("px");
    });

    it("should support all unit types", () => {
      const units: SpacingValue["unit"][] = ["px", "rem", "em", "pt"];

      units.forEach((unit) => {
        const spacing: SpacingValue = { value: 1, unit };
        expect(spacing.unit).toBe(unit);
      });
    });
  });

  describe("TypographyValue", () => {
    it("should accept valid typography values", () => {
      const typography: TypographyValue = {
        fontFamily: "Inter, sans-serif",
        fontSize: { value: 16, unit: "px" },
        fontWeight: 400,
        lineHeight: { value: 24, unit: "px" },
        letterSpacing: { value: 0, unit: "px" },
        textCase: "none",
        textDecoration: "none",
      };

      expect(typography.fontFamily).toBe("Inter, sans-serif");
      expect(typography.fontSize.value).toBe(16);
      expect(typography.fontWeight).toBe(400);
    });

    it("should accept lineHeight as number", () => {
      const typography: TypographyValue = {
        fontFamily: "Inter",
        fontSize: { value: 16, unit: "px" },
        fontWeight: 400,
        lineHeight: 1.5, // Unitless line height
      };

      expect(typography.lineHeight).toBe(1.5);
    });
  });

  describe("BorderRadiusValue", () => {
    it("should accept uniform border radius", () => {
      const radius: BorderRadiusValue = {
        value: 8,
        unit: "px",
      };

      expect(radius.value).toBe(8);
      expect(radius.unit).toBe("px");
    });

    it("should accept individual corner values", () => {
      const radius: BorderRadiusValue = {
        value: 8,
        unit: "px",
        topLeft: 8,
        topRight: 4,
        bottomLeft: 4,
        bottomRight: 8,
      };

      expect(radius.topLeft).toBe(8);
      expect(radius.topRight).toBe(4);
    });
  });

  describe("ShadowValue", () => {
    it("should accept valid shadow values", () => {
      const shadow: ShadowValue = {
        color: { r: 0, g: 0, b: 0, a: 0.25 },
        offsetX: 0,
        offsetY: 2,
        blur: 4,
        spread: 0,
        inset: false,
      };

      expect(shadow.color.a).toBe(0.25);
      expect(shadow.offsetY).toBe(2);
      expect(shadow.blur).toBe(4);
    });

    it("should accept shadow without spread or inset", () => {
      const shadow: ShadowValue = {
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offsetX: 1,
        offsetY: 1,
        blur: 2,
      };

      expect(shadow.spread).toBeUndefined();
      expect(shadow.inset).toBeUndefined();
    });
  });

  describe("TokenValue and TokenAlias", () => {
    it("should create a token value", () => {
      const value: TokenValue = {
        type: "value",
        value: { r: 1, g: 0, b: 0, a: 1 },
      };

      expect(value.type).toBe("value");
      expect("r" in (value.value as ColorValue)).toBe(true);
    });

    it("should create a token alias", () => {
      const alias: TokenAlias = {
        type: "alias",
        reference: "color.primary",
      };

      expect(alias.type).toBe("alias");
      expect(alias.reference).toBe("color.primary");
    });
  });

  describe("NormalizedToken", () => {
    it("should create a valid normalized token", () => {
      const token: NormalizedToken = {
        id: "color-primary",
        name: "color.primary",
        type: "color",
        value: {
          type: "value",
          value: { r: 1, g: 0.34, b: 0.2, a: 1 },
        },
        description: "Primary brand color",
        metadata: {
          source: "figma",
          sourceId: "VariableID:123",
        },
      };

      expect(token.id).toBe("color-primary");
      expect(token.type).toBe("color");
      expect(token.value.type).toBe("value");
    });

    it("should support modes/themes", () => {
      const token: NormalizedToken = {
        id: "color-primary",
        name: "color.primary",
        type: "color",
        value: {
          type: "value",
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
      };

      expect(token.modes?.light).toBeDefined();
      expect(token.modes?.dark).toBeDefined();
    });

    it("should support token aliases in modes", () => {
      const token: NormalizedToken = {
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
            value: { r: 1, g: 0.6, b: 0.5, a: 1 },
          },
        },
      };

      expect(token.value.type).toBe("alias");
      if (token.value.type === "alias") {
        expect(token.value.reference).toBe("color.primary");
      }
    });

    it("should support all token types", () => {
      const types: TokenType[] = [
        "color",
        "spacing",
        "typography",
        "borderRadius",
        "shadow",
        "dimension",
        "number",
        "string",
        "boolean",
      ];

      types.forEach((type) => {
        const token: NormalizedToken = {
          id: `test-${type}`,
          name: `test.${type}`,
          type,
          value: {
            type: "value",
            value: type === "boolean" ? true : type === "number" ? 42 : "test",
          },
        };

        expect(token.type).toBe(type);
      });
    });
  });

  describe("NormalizedTokenSet", () => {
    it("should create a valid token set", () => {
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
        },
        metadata: {
          name: "Design Tokens",
          version: "1.0.0",
          source: "figma",
        },
      };

      expect(Object.keys(tokenSet.tokens)).toHaveLength(2);
      expect(tokenSet.metadata?.name).toBe("Design Tokens");
    });

    it("should support token set without metadata", () => {
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
        },
      };

      expect(tokenSet.metadata).toBeUndefined();
    });
  });
});
