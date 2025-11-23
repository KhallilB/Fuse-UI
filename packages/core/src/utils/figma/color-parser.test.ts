import { describe, expect, it } from "vitest";
import {
  parseColor,
  parseHexColor,
  parseRgbaColor,
  parseRgbColor,
} from "./color-parser";

describe("color-parser", () => {
  describe("parseColor", () => {
    it("parses hex colors", () => {
      const result = parseColor("#FF5733");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses rgb colors", () => {
      const result = parseColor("rgb(255, 87, 51)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses rgba colors", () => {
      const result = parseColor("rgba(255, 87, 51, 0.5)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(0.5);
    });

    it("returns null for invalid formats", () => {
      expect(parseColor("invalid")).toBeNull();
      expect(parseColor("")).toBeNull();
    });

    it("never returns ColorValue with NaN values for any input", () => {
      const invalidInputs = [
        "#GGG",
        "#ZZZZZZ",
        "#FFGG33",
        "rgb(invalid, 87, 51)",
        "rgba(255, invalid, 51, 0.5)",
        "invalid",
        "",
      ];

      for (const input of invalidInputs) {
        const result = parseColor(input);
        if (result !== null) {
          expect(Number.isNaN(result.r)).toBe(false);
          expect(Number.isNaN(result.g)).toBe(false);
          expect(Number.isNaN(result.b)).toBe(false);
          expect(Number.isNaN(result.a)).toBe(false);
        }
      }
    });
  });

  describe("parseHexColor", () => {
    it("parses 3-digit hex", () => {
      const result = parseHexColor("#F73");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.47, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses 6-digit hex", () => {
      const result = parseHexColor("#FF5733");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses 8-digit hex with alpha", () => {
      const result = parseHexColor("#FF573380");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBeCloseTo(0.5, 2);
    });

    it("returns null for invalid hex length", () => {
      expect(parseHexColor("#FF")).toBeNull();
      expect(parseHexColor("#FFFF")).toBeNull();
      expect(parseHexColor("#FFFFF")).toBeNull();
      expect(parseHexColor("#FFFFFFF")).toBeNull();
      expect(parseHexColor("#FFFFFFFFF")).toBeNull();
    });

    it("returns null for invalid hex characters (produces NaN)", () => {
      expect(parseHexColor("#GGG")).toBeNull();
      expect(parseHexColor("#ZZZZZZ")).toBeNull();
      expect(parseHexColor("#FFGG33")).toBeNull();
      expect(parseHexColor("#FF5733XX")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseHexColor("")).toBeNull();
      expect(parseHexColor("#")).toBeNull();
    });

    it("never returns ColorValue with NaN values", () => {
      const invalidInputs = [
        "#GGG",
        "#ZZZZZZ",
        "#FFGG33",
        "#FF5733XX",
        "#",
        "",
      ];

      for (const input of invalidInputs) {
        const result = parseHexColor(input);
        if (result !== null) {
          expect(Number.isNaN(result.r)).toBe(false);
          expect(Number.isNaN(result.g)).toBe(false);
          expect(Number.isNaN(result.b)).toBe(false);
          expect(Number.isNaN(result.a)).toBe(false);
        }
      }
    });
  });

  describe("parseRgbColor", () => {
    it("parses rgb format", () => {
      const result = parseRgbColor("rgb(255, 87, 51)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses rgb with whitespace", () => {
      const result = parseRgbColor("rgb( 255 , 87 , 51 )");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
    });

    it("parses rgb with decimal values", () => {
      const result = parseRgbColor("rgb(255.5, 87.2, 51.8)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
    });

    it("returns null for invalid format", () => {
      expect(parseRgbColor("invalid")).toBeNull();
      expect(parseRgbColor("rgb()")).toBeNull();
      expect(parseRgbColor("rgb(255)")).toBeNull();
      expect(parseRgbColor("rgb(255, 87)")).toBeNull();
    });

    it("never returns ColorValue with NaN values", () => {
      // Even if regex matches but parseFloat fails, should return null
      const invalidInputs = [
        "rgb(invalid, 87, 51)",
        "rgb(255, invalid, 51)",
        "rgb(255, 87, invalid)",
      ];

      for (const input of invalidInputs) {
        const result = parseRgbColor(input);
        if (result !== null) {
          expect(Number.isNaN(result.r)).toBe(false);
          expect(Number.isNaN(result.g)).toBe(false);
          expect(Number.isNaN(result.b)).toBe(false);
          expect(Number.isNaN(result.a)).toBe(false);
        }
      }
    });
  });

  describe("parseRgbaColor", () => {
    it("parses rgba format", () => {
      const result = parseRgbaColor("rgba(255, 87, 51, 0.5)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(0.5);
    });

    it("parses rgba with default alpha (1) when omitted", () => {
      const result = parseRgbaColor("rgba(255, 87, 51)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(1);
    });

    it("parses rgba with whitespace", () => {
      const result = parseRgbaColor("rgba( 255 , 87 , 51 , 0.5 )");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(0.5);
    });

    it("parses rgba with decimal RGB values", () => {
      const result = parseRgbaColor("rgba(255.5, 87.2, 51.8, 0.5)");
      expect(result?.r).toBeCloseTo(1, 2);
      expect(result?.g).toBeCloseTo(0.34, 2);
      expect(result?.b).toBeCloseTo(0.2, 2);
      expect(result?.a).toBe(0.5);
    });

    it("returns null for invalid format", () => {
      expect(parseRgbaColor("invalid")).toBeNull();
      expect(parseRgbaColor("rgba()")).toBeNull();
      expect(parseRgbaColor("rgba(255)")).toBeNull();
      expect(parseRgbaColor("rgba(255, 87)")).toBeNull();
      expect(parseRgbaColor("rgba(255, 87, 51)")).not.toBeNull(); // Valid without alpha
    });

    it("never returns ColorValue with NaN values", () => {
      const invalidInputs = [
        "rgba(invalid, 87, 51, 0.5)",
        "rgba(255, invalid, 51, 0.5)",
        "rgba(255, 87, invalid, 0.5)",
        "rgba(255, 87, 51, invalid)",
      ];

      for (const input of invalidInputs) {
        const result = parseRgbaColor(input);
        if (result !== null) {
          expect(Number.isNaN(result.r)).toBe(false);
          expect(Number.isNaN(result.g)).toBe(false);
          expect(Number.isNaN(result.b)).toBe(false);
          expect(Number.isNaN(result.a)).toBe(false);
        }
      }
    });
  });
});
