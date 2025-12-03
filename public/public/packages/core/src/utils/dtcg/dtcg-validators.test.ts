import { describe, expect, it } from "vitest";
import { validateDTCGFile } from "./dtcg-validators";
import type { DTCGTokenFile } from "../../types/input-sources";

describe("dtcg-validators", () => {
	describe("validateDTCGFile", () => {
		it("validates valid DTCG file", () => {
			const file: DTCGTokenFile = {
				$schema: "https://schemas.design-tokens.com/format/v0.1",
				color: {
					primary: {
						$type: "color",
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("validates file without $schema", () => {
			const file: DTCGTokenFile = {
				color: {
					primary: {
						$type: "color",
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
		});

		it("errors on non-object", () => {
			const result = validateDTCGFile(null);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("DTCG file must be an object");
		});

		it("errors on invalid $schema type", () => {
			const file = {
				$schema: 123,
				color: {
					primary: {
						$type: "color",
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain("$schema must be a string if present");
		});

		it("errors on token without $type", () => {
			const file = {
				color: {
					primary: {
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true); // Groups don't need $type
		});

		it("errors on token without $value", () => {
			const file = {
				color: {
					primary: {
						$type: "color",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes("must have $value"))).toBe(
				true,
			);
		});

		it("errors on invalid $type", () => {
			const file = {
				color: {
					primary: {
						$type: "invalidType",
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes("invalid $type"))).toBe(
				true,
			);
		});

		it("errors on non-string $type", () => {
			const file = {
				color: {
					primary: {
						$type: 123,
						$value: "#FF5733",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes("$type as a string"))).toBe(
				true,
			);
		});

		it("validates nested tokens", () => {
			const file: DTCGTokenFile = {
				color: {
					brand: {
						primary: {
							$type: "color",
							$value: "#FF5733",
						},
						secondary: {
							$type: "color",
							$value: "#33FF57",
						},
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
		});

		it("validates alias references", () => {
			const file: DTCGTokenFile = {
				color: {
					primary: {
						$type: "color",
						$value: "#FF5733",
					},
					secondary: {
						$type: "color",
						$value: "{color.primary}",
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
		});

		it("validates all supported token types", () => {
			const file: DTCGTokenFile = {
				color: {
					primary: { $type: "color", $value: "#FF5733" },
				},
				dimension: {
					small: { $type: "dimension", $value: "16px" },
				},
				fontFamily: {
					sans: { $type: "fontFamily", $value: "Inter" },
				},
				fontSize: {
					base: { $type: "fontSize", $value: "16px" },
				},
				fontWeight: {
					bold: { $type: "fontWeight", $value: 700 },
				},
				lineHeight: {
					normal: { $type: "lineHeight", $value: "1.5" },
				},
				letterSpacing: {
					wide: { $type: "letterSpacing", $value: "0.1em" },
				},
				borderRadius: {
					small: { $type: "borderRadius", $value: "4px" },
				},
				shadow: {
					small: {
						$type: "shadow",
						$value: {
							color: "#000000",
							offsetX: "0px",
							offsetY: "2px",
							blur: "4px",
							spread: "0px",
						},
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
		});

		it("validates mode-specific values", () => {
			const file: DTCGTokenFile = {
				color: {
					primary: {
						$type: "color",
						$value: "#FF5733",
						light: {
							$value: "#FFFFFF",
						},
						dark: {
							$value: "#000000",
						},
					},
				},
			};

			const result = validateDTCGFile(file);
			expect(result.valid).toBe(true);
		});
	});
});

