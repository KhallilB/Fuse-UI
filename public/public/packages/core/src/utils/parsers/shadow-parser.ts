import type { ShadowValue } from "../../types/token-types";
import { parseColor } from "./color-parser";

/**
 * Parses a shadow value from various formats.
 * 
 * Supports:
 * - Object format: { color: "#000", offsetX: 0, offsetY: 2, blur: 4, spread: 0 }
 * - Array format: [{ color: "#000", ... }, ...] (takes first shadow)
 * - String format: Not yet fully supported (returns null)
 */
export function parseShadowValue(value: unknown): ShadowValue | null {
	if (typeof value === "string") {
		// String format parsing not yet fully implemented
		// Full implementation would parse CSS shadow strings like "0px 2px 4px rgba(0,0,0,0.1)"
		console.warn("String shadow format not yet fully supported");
		return null;
	}

	if (Array.isArray(value)) {
		// For multiple shadows, take the first one
		// Full implementation would handle multiple shadows
		if (value.length > 0) {
			return parseShadowValue(value[0]);
		}
		return null;
	}

	if (value && typeof value === "object") {
		const shadow = value as Record<string, unknown>;
		const colorStr = shadow.color;
		if (typeof colorStr !== "string") {
			return null;
		}

		const color = parseColor(colorStr);
		if (!color) {
			return null;
		}

		const offsetX = typeof shadow.offsetX === "number" ? shadow.offsetX : 0;
		const offsetY = typeof shadow.offsetY === "number" ? shadow.offsetY : 0;
		const blur = typeof shadow.blur === "number" ? shadow.blur : 0;
		const spread =
			typeof shadow.spread === "number" ? shadow.spread : undefined;
		const inset = typeof shadow.inset === "boolean" ? shadow.inset : undefined;

		return {
			color,
			offsetX,
			offsetY,
			blur,
			spread,
			inset,
		};
	}

	return null;
}

