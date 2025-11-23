import { describe, expect, it } from "vitest";
import { parseColor, parseHexColor, parseRgbColor, parseRgbaColor } from "./color-parser";

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
	});

	describe("parseRgbColor", () => {
		it("parses rgb format", () => {
			const result = parseRgbColor("rgb(255, 87, 51)");
			expect(result?.r).toBeCloseTo(1, 2);
			expect(result?.g).toBeCloseTo(0.34, 2);
			expect(result?.b).toBeCloseTo(0.2, 2);
			expect(result?.a).toBe(1);
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
	});
});

