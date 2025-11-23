import type { ColorValue } from "../../types/token-types";

export function parseColor(colorString: string): ColorValue | null {
	if (!colorString) {
		return null;
	}

	// Handle hex colors (#RRGGBB or #RRGGBBAA)
	if (colorString.startsWith("#")) {
		return parseHexColor(colorString);
	}

	// Handle rgba colors (rgba(r, g, b, a))
	if (colorString.startsWith("rgba(")) {
		return parseRgbaColor(colorString);
	}

	// Handle rgb colors (rgb(r, g, b))
	if (colorString.startsWith("rgb(")) {
		return parseRgbColor(colorString);
	}

	console.warn(`Unsupported color format: ${colorString}`);
	return null;
}

export function parseHexColor(hex: string): ColorValue | null {
	// Remove # if present
	const hexClean = hex.replace("#", "");

	// Handle 3-digit hex (#RGB -> #RRGGBB)
	if (hexClean.length === 3) {
		const r = parseInt((hexClean[0] ?? "") + (hexClean[0] ?? ""), 16);
		const g = parseInt((hexClean[1] ?? "") + (hexClean[1] ?? ""), 16);
		const b = parseInt((hexClean[2] ?? "") + (hexClean[2] ?? ""), 16);
		return {
			r: r / 255,
			g: g / 255,
			b: b / 255,
			a: 1,
		};
	}

	// Handle 6-digit hex (#RRGGBB)
	if (hexClean.length === 6) {
		const r = parseInt(hexClean.substring(0, 2) ?? "00", 16);
		const g = parseInt(hexClean.substring(2, 4) ?? "00", 16);
		const b = parseInt(hexClean.substring(4, 6) ?? "00", 16);
		return {
			r: r / 255,
			g: g / 255,
			b: b / 255,
			a: 1,
		};
	}

	// Handle 8-digit hex (#RRGGBBAA)
	if (hexClean.length === 8) {
		const r = parseInt(hexClean.substring(0, 2) ?? "00", 16);
		const g = parseInt(hexClean.substring(2, 4) ?? "00", 16);
		const b = parseInt(hexClean.substring(4, 6) ?? "00", 16);
		const a = parseInt(hexClean.substring(6, 8) ?? "FF", 16);
		return {
			r: r / 255,
			g: g / 255,
			b: b / 255,
			a: a / 255,
		};
	}

	console.warn(`Invalid hex color format: ${hex}`);
	return null;
}

export function parseRgbaColor(rgba: string): ColorValue | null {
	const match = rgba.match(
		/rgba\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/i,
	);

	if (!match) {
		console.warn(`Invalid rgba color format: ${rgba}`);
		return null;
	}

	const r = Number.parseFloat(match[1] ?? "0");
	const g = Number.parseFloat(match[2] ?? "0");
	const b = Number.parseFloat(match[3] ?? "0");
	const a = match[4] ? Number.parseFloat(match[4]) : 1;

	return {
		r: r / 255,
		g: g / 255,
		b: b / 255,
		a,
	};
}

export function parseRgbColor(rgb: string): ColorValue | null {
	const match = rgb.match(
		/rgb\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)/i,
	);

	if (!match) {
		console.warn(`Invalid rgb color format: ${rgb}`);
		return null;
	}

	const r = Number.parseFloat(match[1] ?? "0");
	const g = Number.parseFloat(match[2] ?? "0");
	const b = Number.parseFloat(match[3] ?? "0");

	return {
		r: r / 255,
		g: g / 255,
		b: b / 255,
		a: 1,
	};
}

