import type {
	FigmaVariable,
	FigmaVariableValue,
} from "../../types/figma-api";
import type {
	NormalizedToken,
	TokenAlias,
	TokenMetadata,
	TokenType,
	TokenValue,
	TokenValueOrAlias,
} from "../../types/token-types";
import { parseColor } from "./color-parser";

export function mapFigmaTypeToTokenType(
	figmaType: FigmaVariable["resolved_type"],
): TokenType | null {
	switch (figmaType) {
		case "COLOR":
			return "color";
		case "FLOAT":
			return "number";
		case "STRING":
			return "string";
		case "BOOLEAN":
			return "boolean";
		default:
			return null;
	}
}

export function normalizeVariableName(name: string): string {
	return name.replace(/\//g, ".").replace(/\s+/g, "-").toLowerCase();
}

export function parseValue(
	value: string | number | boolean | undefined,
	resolvedType: FigmaVariable["resolved_type"],
): TokenValue["value"] | null {
	if (value === undefined || value === null) {
		return null;
	}

	switch (resolvedType) {
		case "BOOLEAN":
			return typeof value === "boolean" ? value : Boolean(value);
		case "FLOAT":
			return typeof value === "number" ? value : Number(value);
		case "STRING":
			return String(value);
		case "COLOR":
			return parseColor(String(value));
		default:
			console.warn(`Unsupported resolved type: ${resolvedType}`);
			return null;
	}
}

/**
 * Normalizes a Figma variable value to TokenValueOrAlias.
 * Handles alias resolution by mapping variable IDs to token names.
 */
export function normalizeVariableValue(
	value: FigmaVariableValue,
	resolvedType: FigmaVariable["resolved_type"],
	variableIdToName: Map<string, string>,
): TokenValueOrAlias | null {
	if (value.type === "ALIAS") {
		// Handle alias: resolve variable ID to token name
		if (typeof value.value !== "string") {
			console.warn(
				`Invalid alias value: expected string variable ID, got ${typeof value.value}`,
			);
			return null;
		}

		const referencedName = variableIdToName.get(value.value);
		if (!referencedName) {
			console.warn(
				`Alias references unknown variable ID: ${value.value}`,
			);
			return null;
		}

		const alias: TokenAlias = {
			type: "alias",
			reference: referencedName,
		};
		return alias;
	}

	// Handle concrete value
	if (value.type !== "VALUE") {
		console.warn(`Unsupported value type: ${value.type}`);
		return null;
	}

	const normalizedValue = parseValue(value.value, resolvedType);
	if (normalizedValue === null) {
		return null;
	}

	const tokenValue: TokenValue = {
		type: "value",
		value: normalizedValue,
	};
	return tokenValue;
}

/**
 * Normalizes a Figma variable to the internal token schema.
 * Processes default value from collection's default mode, or first mode if default mode is not available.
 */
export function normalizeVariable(
	variable: FigmaVariable,
	variableIdToName: Map<string, string>,
	modeIdToName: Map<string, string>,
	warnings: string[],
	defaultModeId?: string,
): NormalizedToken | null {
	const tokenName = normalizeVariableName(variable.name);
	const tokenType = mapFigmaTypeToTokenType(variable.resolved_type);

	if (!tokenType) {
		const warning = `Unsupported variable type "${variable.resolved_type}" for variable "${variable.name}" (${variable.id}). Skipping.`;
		warnings.push(warning);
		console.warn(warning);
		return null;
	}

	// Process default value (use default mode from collection, or first mode as fallback)
	const modeEntries = Object.entries(variable.values_by_mode);
	if (modeEntries.length === 0) {
		console.warn(
			`Variable "${variable.name}" (${variable.id}) has no values. Skipping.`,
		);
		return null;
	}

	// Find the default mode value, or fall back to first mode
	let defaultModeValue: FigmaVariableValue | undefined;
	let selectedDefaultModeId: string;

	if (defaultModeId && variable.values_by_mode[defaultModeId]) {
		// Use the collection's designated default mode
		selectedDefaultModeId = defaultModeId;
		defaultModeValue = variable.values_by_mode[defaultModeId];
	} else {
		// Fall back to first mode if default mode is not available or not found
		const firstEntry = modeEntries[0];
		if (!firstEntry) {
			return null;
		}
		[selectedDefaultModeId, defaultModeValue] = firstEntry;
	}

	if (!defaultModeValue) {
		console.warn(
			`Variable "${variable.name}" (${variable.id}) has no default value. Skipping.`,
		);
		return null;
	}

	const defaultValue = normalizeVariableValue(
		defaultModeValue,
		variable.resolved_type,
		variableIdToName,
	);

	if (!defaultValue) {
		console.warn(
			`Failed to normalize default value for variable "${variable.name}" (${variable.id}). Skipping.`,
		);
		return null;
	}

	// Process mode-specific values
	const modes: Record<string, TokenValueOrAlias> = {};
	for (const [modeId, modeValue] of Object.entries(variable.values_by_mode)) {
		// Skip the default mode as it's already used as the default value
		if (modeId === selectedDefaultModeId) {
			continue;
		}

		const normalizedValue = normalizeVariableValue(
			modeValue,
			variable.resolved_type,
			variableIdToName,
		);

		if (normalizedValue) {
			const modeName = modeIdToName.get(modeId) || modeId;
			modes[modeName] = normalizedValue;
		}
	}

	const metadata: TokenMetadata = {
		source: "figma",
		sourceId: variable.id,
		createdAt: variable.created_at,
		updatedAt: variable.updated_at,
	};

	return {
		id: variable.id,
		name: tokenName,
		type: tokenType,
		value: defaultValue,
		modes: Object.keys(modes).length > 0 ? modes : undefined,
		description: variable.description || undefined,
		metadata,
	};
}

