import { describe, expect, it } from "vitest";
import type { NormalizedToken, NormalizedTokenSet } from "./token-types";
import {
  detectCircularReferences,
  hasRequiredTokenTypes,
  isValidNormalizedToken,
  isValidNormalizedTokenSet,
  isValidTokenType,
  isValidTokenValueOrAlias,
  validateAliasReferences,
} from "./validators";

describe("Validators", () => {
  describe("isValidTokenType", () => {
    it("should validate valid token types", () => {
      expect(isValidTokenType("color")).toBe(true);
      expect(isValidTokenType("spacing")).toBe(true);
      expect(isValidTokenType("typography")).toBe(true);
    });

    it("should reject invalid token types", () => {
      expect(isValidTokenType("invalid")).toBe(false);
      expect(isValidTokenType(123)).toBe(false);
      expect(isValidTokenType(null)).toBe(false);
    });
  });

  describe("isValidTokenValueOrAlias", () => {
    it("should validate token values", () => {
      expect(
        isValidTokenValueOrAlias({
          type: "value",
          value: { r: 1, g: 0, b: 0, a: 1 },
        })
      ).toBe(true);
    });

    it("should validate token aliases", () => {
      expect(
        isValidTokenValueOrAlias({
          type: "alias",
          reference: "color.primary",
        })
      ).toBe(true);
    });

    it("should reject invalid structures", () => {
      expect(isValidTokenValueOrAlias(null)).toBe(false);
      expect(isValidTokenValueOrAlias({ type: "invalid" })).toBe(false);
      expect(isValidTokenValueOrAlias({ type: "alias" })).toBe(false); // Missing reference
    });
  });

  describe("isValidNormalizedToken", () => {
    it("should validate valid tokens", () => {
      const token: NormalizedToken = {
        id: "test",
        name: "test.token",
        type: "color",
        value: {
          type: "value",
          value: { r: 1, g: 0, b: 0, a: 1 },
        },
      };

      expect(isValidNormalizedToken(token)).toBe(true);
    });

    it("should validate tokens with modes", () => {
      const token: NormalizedToken = {
        id: "test",
        name: "test.token",
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
        },
      };

      expect(isValidNormalizedToken(token)).toBe(true);
    });

    it("should reject invalid tokens", () => {
      expect(isValidNormalizedToken(null)).toBe(false);
      expect(isValidNormalizedToken({})).toBe(false);
      expect(
        isValidNormalizedToken({
          id: "test",
          name: "test",
          type: "invalid",
          value: { type: "value", value: "test" },
        })
      ).toBe(false);
    });
  });

  describe("isValidNormalizedTokenSet", () => {
    it("should validate valid token sets", () => {
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

      expect(isValidNormalizedTokenSet(tokenSet)).toBe(true);
    });

    it("should reject invalid token sets", () => {
      expect(isValidNormalizedTokenSet(null)).toBe(false);
      expect(isValidNormalizedTokenSet({})).toBe(false);
      expect(
        isValidNormalizedTokenSet({
          tokens: {
            invalid: {} as NormalizedToken,
          },
        })
      ).toBe(false);
    });
  });

  describe("hasRequiredTokenTypes", () => {
    it("should pass when all required types are present", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: { type: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
          },
          "spacing.small": {
            id: "spacing-small",
            name: "spacing.small",
            type: "spacing",
            value: { type: "value", value: { value: 8, unit: "px" } },
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
            value: { type: "value", value: { value: 4, unit: "px" } },
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
              },
            },
          },
        },
      };

      const result = hasRequiredTokenTypes(tokenSet);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should fail when required types are missing", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: { type: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
          },
        },
      };

      const result = hasRequiredTokenTypes(tokenSet);
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe("validateAliasReferences", () => {
    it("should pass when all aliases reference existing tokens", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: { type: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
          },
          "color.secondary": {
            id: "color-secondary",
            name: "color.secondary",
            type: "color",
            value: {
              type: "alias",
              reference: "color.primary",
            },
          },
        },
      };

      const result = validateAliasReferences(tokenSet);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when aliases reference non-existent tokens", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: {
              type: "alias",
              reference: "color.nonexistent",
            },
          },
        },
      };

      const result = validateAliasReferences(tokenSet);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate alias references in modes", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: { type: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
          },
          "color.secondary": {
            id: "color-secondary",
            name: "color.secondary",
            type: "color",
            value: { type: "value", value: { r: 0, g: 1, b: 0, a: 1 } },
            modes: {
              light: {
                type: "alias",
                reference: "color.primary",
              },
              dark: {
                type: "alias",
                reference: "color.nonexistent",
              },
            },
          },
        },
      };

      const result = validateAliasReferences(tokenSet);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]?.tokenName).toContain("dark");
    });
  });

  describe("detectCircularReferences", () => {
    it("should detect circular references", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: {
              type: "alias",
              reference: "color.secondary",
            },
          },
          "color.secondary": {
            id: "color-secondary",
            name: "color.secondary",
            type: "color",
            value: {
              type: "alias",
              reference: "color.primary",
            },
          },
        },
      };

      const result = detectCircularReferences(tokenSet);
      expect(result.hasCircular).toBe(true);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it("should pass when no circular references exist", () => {
      const tokenSet: NormalizedTokenSet = {
        tokens: {
          "color.primary": {
            id: "color-primary",
            name: "color.primary",
            type: "color",
            value: { type: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
          },
          "color.secondary": {
            id: "color-secondary",
            name: "color.secondary",
            type: "color",
            value: {
              type: "alias",
              reference: "color.primary",
            },
          },
        },
      };

      const result = detectCircularReferences(tokenSet);
      expect(result.hasCircular).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });
  });
});
