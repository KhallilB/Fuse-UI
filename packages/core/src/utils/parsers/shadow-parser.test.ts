import { describe, expect, it } from "vitest";
import { parseShadowValue } from "./shadow-parser";

describe("shadow-parser", () => {
	it("parses object format", () => {
		const result = parseShadowValue({
			color: "#000000",
			offsetX: 0,
			offsetY: 2,
			blur: 4,
			spread: 0,
		});

		expect(result).toMatchObject({
			color: { r: 0, g: 0, b: 0, a: 1 },
			offsetX: 0,
			offsetY: 2,
			blur: 4,
			spread: 0,
		});
	});

	it("handles optional fields", () => {
		const result = parseShadowValue({
			color: "#FF0000",
			offsetX: 1,
			offsetY: 1,
			blur: 2,
		});

		expect(result).toMatchObject({
			color: { r: 1, g: 0, b: 0, a: 1 },
			offsetX: 1,
			offsetY: 1,
			blur: 2,
		});
		expect(result?.spread).toBeUndefined();
	});

	it("handles inset shadows", () => {
		const result = parseShadowValue({
			color: "#000000",
			offsetX: 0,
			offsetY: 2,
			blur: 4,
			inset: true,
		});

		expect(result?.inset).toBe(true);
	});

	it("takes first shadow from array", () => {
		const result = parseShadowValue([
			{ color: "#000000", offsetX: 0, offsetY: 2, blur: 4 },
			{ color: "#FF0000", offsetX: 1, offsetY: 1, blur: 2 },
		]);

		expect(result?.color).toMatchObject({ r: 0, g: 0, b: 0, a: 1 });
	});

	it("returns null for invalid inputs", () => {
		expect(parseShadowValue("0px 2px 4px rgba(0,0,0,0.1)")).toBeNull();
		expect(parseShadowValue({ color: "invalid" })).toBeNull();
		expect(parseShadowValue({ offsetX: 0 })).toBeNull();
		expect(parseShadowValue([])).toBeNull();
		expect(parseShadowValue(null)).toBeNull();
		expect(parseShadowValue(undefined)).toBeNull();
	});
});

