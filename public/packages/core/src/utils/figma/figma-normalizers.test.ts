import { describe, expect, it } from "vitest"
import type { FigmaVariableValue } from "../../types/figma-api"
import {
	mapFigmaTypeToTokenType,
	normalizeVariableName,
	normalizeVariableValue,
	parseValue,
} from "./figma-normalizers"

describe("figma-normalizers", () => {
	describe("mapFigmaTypeToTokenType", () => {
		it("maps COLOR to color", () => {
			expect(mapFigmaTypeToTokenType("COLOR")).toBe("color")
		})

		it("maps FLOAT to number", () => {
			expect(mapFigmaTypeToTokenType("FLOAT")).toBe("number")
		})

		it("maps STRING to string", () => {
			expect(mapFigmaTypeToTokenType("STRING")).toBe("string")
		})

		it("maps BOOLEAN to boolean", () => {
			expect(mapFigmaTypeToTokenType("BOOLEAN")).toBe("boolean")
		})

		it("returns null for unsupported types", () => {
			expect(mapFigmaTypeToTokenType("UNKNOWN" as never)).toBeNull()
		})
	})

	describe("normalizeVariableName", () => {
		it("converts slashes to dots", () => {
			expect(normalizeVariableName("color/primary")).toBe("color.primary")
		})

		it("converts spaces to hyphens", () => {
			expect(normalizeVariableName("color primary")).toBe("color-primary")
		})

		it("lowercases the name", () => {
			expect(normalizeVariableName("Color/Primary")).toBe("color.primary")
		})
	})

	describe("parseValue", () => {
		it("parses boolean values", () => {
			expect(parseValue(true, "BOOLEAN")).toBe(true)
		})

		it("parses number values", () => {
			expect(parseValue(42, "FLOAT")).toBe(42)
		})

		it("parses numeric string values to numbers", () => {
			expect(parseValue("42", "FLOAT")).toBe(42)
			expect(parseValue("3.14", "FLOAT")).toBe(3.14)
		})

		it("returns null for invalid numeric strings that produce NaN", () => {
			expect(parseValue("invalid", "FLOAT")).toBeNull()
			expect(parseValue("not-a-number", "FLOAT")).toBeNull()
			expect(parseValue("abc", "FLOAT")).toBeNull()
		})

		it("returns null for NaN number values", () => {
			expect(parseValue(NaN, "FLOAT")).toBeNull()
		})

		it("parses string values", () => {
			expect(parseValue("test", "STRING")).toBe("test")
		})

		it("parses color values", () => {
			const result = parseValue("#FF5733", "COLOR")
			expect(result).toMatchObject({
				r: expect.any(Number),
				g: expect.any(Number),
				b: expect.any(Number),
				a: 1,
			})
		})
	})

	describe("normalizeVariableValue", () => {
		it("creates alias for ALIAS type", () => {
			const variableIdToName = new Map([["var-123", "color.primary"]])
			const value: FigmaVariableValue = { type: "ALIAS", value: "var-123" }
			const result = normalizeVariableValue(value, "COLOR", variableIdToName)
			expect(result).toEqual({ type: "alias", reference: "color.primary" })
		})

		it("creates value for VALUE type", () => {
			const variableIdToName = new Map()
			const value: FigmaVariableValue = { type: "VALUE", value: "#FF5733" }
			const result = normalizeVariableValue(value, "COLOR", variableIdToName)
			expect(result).toMatchObject({
				type: "value",
				value: {
					r: expect.any(Number),
					g: expect.any(Number),
					b: expect.any(Number),
					a: 1,
				},
			})
		})

		it("returns null for invalid alias reference", () => {
			const variableIdToName = new Map()
			const value: FigmaVariableValue = { type: "ALIAS", value: "unknown-id" }
			expect(
				normalizeVariableValue(value, "COLOR", variableIdToName),
			).toBeNull()
		})
	})
})
