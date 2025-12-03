import { describe, expect, it } from "vitest";
import {
  parseColor,
  parseHexColor,
  parseRgbaColor,
  parseRgbColor,
} from "./color-parser";

describe("color-parser", () => {
  describe("parseColor", () => {
    it("parses hex, rgb, rgba", () => {
      const hex = parseColor("#FF5733");
      expect(hex?.r).toBeCloseTo(1, 2);
      expect(hex?.g).toBeCloseTo(0.341, 2);
      expect(hex?.b).toBeCloseTo(0.2, 2);
      expect(hex?.a).toBe(1);

      const rgb = parseColor("rgb(255, 87, 51)");
      expect(rgb?.r).toBeCloseTo(1, 2);
      expect(rgb?.g).toBeCloseTo(0.341, 2);
      expect(rgb?.b).toBeCloseTo(0.2, 2);
      expect(rgb?.a).toBe(1);

      const rgba = parseColor("rgba(255, 87, 51, 0.5)");
      expect(rgba?.r).toBeCloseTo(1, 2);
      expect(rgba?.g).toBeCloseTo(0.341, 2);
      expect(rgba?.b).toBeCloseTo(0.2, 2);
      expect(rgba?.a).toBe(0.5);
    });

    it("returns null for invalid/empty", () => {
      expect(parseColor("invalid")).toBeNull();
      expect(parseColor("")).toBeNull();
    });
  });

  describe("parseHexColor", () => {
    it("parses 3/6/8 digit hex", () => {
      const hex3 = parseHexColor("#F73");
      expect(hex3?.r).toBeCloseTo(1, 2);
      expect(hex3?.g).toBeCloseTo(0.467, 2);
      expect(hex3?.b).toBeCloseTo(0.2, 2);
      expect(hex3?.a).toBe(1);

      const hex6 = parseHexColor("#FF5733");
      expect(hex6?.r).toBeCloseTo(1, 2);
      expect(hex6?.g).toBeCloseTo(0.341, 2);
      expect(hex6?.b).toBeCloseTo(0.2, 2);
      expect(hex6?.a).toBe(1);

      const hex8 = parseHexColor("#FF573380");
      expect(hex8?.r).toBeCloseTo(1, 2);
      expect(hex8?.g).toBeCloseTo(0.341, 2);
      expect(hex8?.b).toBeCloseTo(0.2, 2);
      expect(hex8?.a).toBeCloseTo(0.502, 2);
    });

    it("returns null for invalid hex", () => {
      expect(parseHexColor("#GGG")).toBeNull();
      expect(parseHexColor("#FF")).toBeNull();
      expect(parseHexColor("")).toBeNull();
    });
  });

  describe("parseRgbColor", () => {
    it("parses rgb with/without whitespace", () => {
      const rgb1 = parseRgbColor("rgb(255, 87, 51)");
      expect(rgb1?.r).toBeCloseTo(1, 2);
      expect(rgb1?.g).toBeCloseTo(0.341, 2);
      expect(rgb1?.b).toBeCloseTo(0.2, 2);
      expect(rgb1?.a).toBe(1);

      const rgb2 = parseRgbColor("rgb( 255 , 87 , 51 )");
      expect(rgb2?.r).toBeCloseTo(1, 2);
      expect(rgb2?.g).toBeCloseTo(0.341, 2);
      expect(rgb2?.b).toBeCloseTo(0.2, 2);
      expect(rgb2?.a).toBe(1);
    });

    it("returns null for invalid format", () => {
      expect(parseRgbColor("invalid")).toBeNull();
      expect(parseRgbColor("rgb()")).toBeNull();
    });
  });

  describe("parseRgbaColor", () => {
    it("parses rgba with/without alpha", () => {
      const rgba1 = parseRgbaColor("rgba(255, 87, 51, 0.5)");
      expect(rgba1?.r).toBeCloseTo(1, 2);
      expect(rgba1?.g).toBeCloseTo(0.341, 2);
      expect(rgba1?.b).toBeCloseTo(0.2, 2);
      expect(rgba1?.a).toBe(0.5);

      const rgba2 = parseRgbaColor("rgba(255, 87, 51)");
      expect(rgba2?.r).toBeCloseTo(1, 2);
      expect(rgba2?.g).toBeCloseTo(0.341, 2);
      expect(rgba2?.b).toBeCloseTo(0.2, 2);
      expect(rgba2?.a).toBe(1);
    });

    it("returns null for invalid format", () => {
      expect(parseRgbaColor("invalid")).toBeNull();
      expect(parseRgbaColor("rgba()")).toBeNull();
    });
  });
});
