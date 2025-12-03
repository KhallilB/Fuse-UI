import type { SpacingValue } from "../../types/token-types";

/**
 * Parses a dimension string (e.g., "16px", "1rem") into a SpacingValue.
 * 
 * @throws {Error} If the dimension string format is invalid
 */
export function parseDimension(dimension: string): SpacingValue | null {
	if (!dimension || typeof dimension !== "string") {
		return null;
	}

	// Match pattern: number followed by unit (px, rem, em, pt)
	const match = dimension.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|pt)$/i);

	if (!match) {
		console.warn(`Invalid dimension format: ${dimension}`);
		return null;
	}

	const value = Number.parseFloat(match[1] ?? "0");
	const unit = (match[2]?.toLowerCase() ?? "px") as SpacingValue["unit"];

	if (Number.isNaN(value)) {
		console.warn(`Invalid dimension value: ${dimension}`);
		return null;
	}

	return { value, unit };
}

