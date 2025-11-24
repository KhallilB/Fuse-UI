import { describe, expect, it } from "vitest";
import { parseDimension } from "./dimension-parser";

describe("dimension-parser", () => {
	it("parses valid dimensions", () => {
		expect(parseDimension("16px")).toEqual({ value: 16, unit: "px" });
		expect(parseDimension("1.5rem")).toEqual({ value: 1.5, unit: "rem" });
		expect(parseDimension("2em")).toEqual({ value: 2, unit: "em" });
		expect(parseDimension("12pt")).toEqual({ value: 12, unit: "pt" });
		expect(parseDimension("-4px")).toEqual({ value: -4, unit: "px" });
	});

	it("handles case-insensitive units", () => {
		expect(parseDimension("16PX")).toEqual({ value: 16, unit: "px" });
		expect(parseDimension("1.5REM")).toEqual({ value: 1.5, unit: "rem" });
	});

	it("returns null for invalid formats", () => {
		expect(parseDimension("")).toBeNull();
		expect(parseDimension("16")).toBeNull();
		expect(parseDimension("px")).toBeNull();
		expect(parseDimension("16px extra")).toBeNull();
		expect(parseDimension("16vh")).toBeNull();
		expect(parseDimension("invalid")).toBeNull();
	});

	it("returns null for non-string input", () => {
		expect(parseDimension(null as unknown as string)).toBeNull();
		expect(parseDimension(undefined as unknown as string)).toBeNull();
		expect(parseDimension(16 as unknown as string)).toBeNull();
	});
});

