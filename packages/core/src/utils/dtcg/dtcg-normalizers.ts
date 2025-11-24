import type {
	DTCGToken,
	DTCGTokenFile,
	DTCGTokenGroup,
} from "../../types/input-sources"
import type {
	NormalizedToken,
	SpacingValue,
	TokenAlias,
	TokenType,
	TokenValue,
	TokenValueOrAlias,
	TypographyValue,
} from "../../types/token-types"
import { parseColor } from "../parsers/color-parser"
import { parseDimension } from "../parsers/dimension-parser"
import { parseShadowValue } from "../parsers/shadow-parser"

/**
 * Maps DTCG token type to normalized token type.
 *
 * @param dtcgType - The DTCG token type
 * @param tokenPath - Optional token path for context-based mapping (e.g., "spacing.small" → "spacing")
 */
export function mapDTCGTypeToTokenType(
	dtcgType: string,
	tokenPath?: string,
): TokenType | null {
	switch (dtcgType) {
		case "color":
			return "color"
		case "dimension": {
			// Context-based: if path contains "spacing", use "spacing", otherwise "dimension"
			if (tokenPath && /spacing/i.test(tokenPath)) {
				return "spacing"
			}
			return "dimension"
		}
		case "fontFamily":
		case "fontSize":
		case "fontWeight":
		case "lineHeight":
		case "letterSpacing":
			// These are typography property tokens - should only be used when composing typography groups
			// Individual tokens of these types should not be normalized directly
			return null
		case "borderRadius":
			return "borderRadius"
		case "shadow":
			return "shadow"
		default:
			return null
	}
}

/**
 * Parses a DTCG token value based on its type.
 */
export function parseDTCGValue(
	value: unknown,
	type: string,
): TokenValue["value"] | null {
	if (value === null || value === undefined) {
		return null
	}

	switch (type) {
		case "color": {
			if (typeof value !== "string") {
				return null
			}
			return parseColor(value)
		}

		case "dimension":
		case "fontSize":
		case "letterSpacing":
		case "borderRadius": {
			if (typeof value !== "string") {
				return null
			}
			return parseDimension(value)
		}

		case "lineHeight": {
			// lineHeight can be a unitless number (1.5) or a dimension string ("24px")
			if (typeof value === "number") {
				return value
			}
			if (typeof value === "string") {
				return parseDimension(value)
			}
			return null
		}

		case "fontWeight": {
			if (typeof value === "number") {
				return value
			}
			if (typeof value === "string") {
				// Try to parse as number
				const num = Number.parseFloat(value)
				if (!Number.isNaN(num)) {
					return num
				}
				// Return as string for named weights like "bold"
				return value
			}
			return null
		}

		case "fontFamily": {
			return typeof value === "string" ? value : null
		}

		case "shadow": {
			if (typeof value === "string") {
				// String format parsing not yet fully implemented
				console.warn("String shadow format not yet fully supported")
				return null
			}
			return parseShadowValue(value)
		}

		default:
			return null
	}
}

/**
 * Parses an alias reference from DTCG format ({token.path}).
 */
export function parseAliasReference(value: string): string | null {
	if (typeof value !== "string") {
		return null
	}

	// Match {token.path} pattern
	const match = value.match(/^\{([^}]+)\}$/)
	if (!match) {
		return null
	}

	return match[1] ?? null
}

/**
 * Normalizes a DTCG token value to TokenValueOrAlias.
 * Handles alias resolution and value parsing.
 */
export function normalizeDTCGTokenValue(
	value: unknown,
	type: string,
	tokenPath: string,
	allTokens: Map<string, DTCGToken>,
): TokenValueOrAlias | null {
	if (typeof value === "string") {
		// Check if it's an alias
		const aliasRef = parseAliasReference(value)
		if (aliasRef) {
			// Verify the referenced token exists
			if (!allTokens.has(aliasRef)) {
				console.warn(
					`Alias reference "${aliasRef}" in token "${tokenPath}" points to non-existent token`,
				)
				return null
			}

			const alias: TokenAlias = {
				type: "alias",
				reference: aliasRef,
			}
			return alias
		}
	}

	// Parse as concrete value
	const parsedValue = parseDTCGValue(value, type)
	if (parsedValue === null) {
		return null
	}

	const tokenValue: TokenValue = {
		type: "value",
		value: parsedValue,
	}
	return tokenValue
}

/**
 * Checks if a group contains only typography-related tokens.
 * In DTCG, typography properties are identified by their property names,
 * not just their types (e.g., fontSize has type "dimension", not "fontSize").
 *
 * A typography group must have at least fontFamily and fontSize (required for TypographyValue).
 */
function isTypographyGroup(group: DTCGTokenGroup): boolean {
	const typographyPropertyNames = new Set([
		"fontFamily",
		"fontSize",
		"fontWeight",
		"lineHeight",
		"letterSpacing",
	])

	const typographyPropertyTypes = new Set([
		"fontFamily",
		"fontSize",
		"fontWeight",
		"lineHeight",
		"letterSpacing",
		"dimension", // fontSize, lineHeight, letterSpacing can be dimension
	])

	let hasFontFamily = false
	let hasFontSize = false
	let hasAnyTypographyProperty = false

	for (const [key, value] of Object.entries(group)) {
		// Skip metadata keys
		if (key.startsWith("$")) {
			continue
		}

		// If it's not an object, it's not a typography property token
		if (!value || typeof value !== "object") {
			return false
		}

		// Check if it's a typography property by name
		if (!typographyPropertyNames.has(key)) {
			return false
		}

		// Track required properties
		if (key === "fontFamily") {
			hasFontFamily = true
		}
		if (key === "fontSize") {
			hasFontSize = true
		}
		hasAnyTypographyProperty = true

		// Check if it's a token (has $type)
		const token = value as DTCGToken
		if (token.$type && typeof token.$type === "string") {
			// For typography properties, the type should be a typography property type
			// or dimension (for fontSize, lineHeight, letterSpacing)
			if (!typographyPropertyTypes.has(token.$type)) {
				return false
			}
		} else {
			// If it's a nested group, it's not a typography property token
			return false
		}
	}

	// Must have at least fontFamily and fontSize (required for TypographyValue)
	return hasAnyTypographyProperty && hasFontFamily && hasFontSize
}

/**
 * Composes a typography group into a TypographyValue.
 */
function composeTypographyGroup(
	group: DTCGTokenGroup,
	allTokens: Map<string, DTCGToken>,
	path: string,
): TypographyValue | null {
	const typography: Partial<TypographyValue> = {}

	for (const [key, value] of Object.entries(group)) {
		// Skip metadata keys
		if (key.startsWith("$")) {
			continue
		}

		if (!value || typeof value !== "object") {
			continue
		}

		const token = value as DTCGToken
		if (!token.$type || typeof token.$type !== "string") {
			continue
		}

		const propertyPath = path ? `${path}.${key}` : key
		const normalizedValue = normalizeDTCGTokenValue(
			token.$value,
			token.$type,
			propertyPath,
			allTokens,
		)

		if (!normalizedValue || normalizedValue.type !== "value") {
			continue
		}

		// Check property name, not just type (fontSize/lineHeight/letterSpacing have type "dimension")
		switch (key) {
			case "fontFamily":
				if (
					token.$type === "fontFamily" &&
					typeof normalizedValue.value === "string"
				) {
					typography.fontFamily = normalizedValue.value
				}
				break
			case "fontSize":
				if (
					(token.$type === "fontSize" || token.$type === "dimension") &&
					normalizedValue.value &&
					typeof normalizedValue.value === "object" &&
					"value" in normalizedValue.value &&
					"unit" in normalizedValue.value
				) {
					typography.fontSize = normalizedValue.value as SpacingValue
				}
				break
			case "fontWeight":
				if (token.$type === "fontWeight") {
					typography.fontWeight = normalizedValue.value as number | string
				}
				break
			case "lineHeight": {
				if (token.$type === "lineHeight" || token.$type === "dimension") {
					const lineHeightValue = normalizedValue.value
					if (
						lineHeightValue &&
						typeof lineHeightValue === "object" &&
						"value" in lineHeightValue &&
						"unit" in lineHeightValue
					) {
						typography.lineHeight = lineHeightValue as SpacingValue
					} else if (typeof lineHeightValue === "number") {
						typography.lineHeight = lineHeightValue
					}
				}
				break
			}
			case "letterSpacing":
				if (
					(token.$type === "letterSpacing" || token.$type === "dimension") &&
					normalizedValue.value &&
					typeof normalizedValue.value === "object" &&
					"value" in normalizedValue.value &&
					"unit" in normalizedValue.value
				) {
					typography.letterSpacing = normalizedValue.value as SpacingValue
				}
				break
		}
	}

	// TypographyValue requires at least fontFamily and fontSize
	if (!typography.fontFamily || !typography.fontSize) {
		return null
	}

	return typography as TypographyValue
}

/**
 * Flattens nested DTCG token structure into a map of path → token.
 * Detects and composes typography groups, skipping individual typography property tokens.
 */
export function flattenDTCGTokens(
	file: DTCGTokenFile,
	prefix = "",
): Map<string, DTCGToken> {
	const tokens = new Map<string, DTCGToken>()
	const typographyGroups = new Map<string, DTCGTokenGroup>()

	const processNode = (
		node: DTCGToken | DTCGTokenGroup,
		currentPath: string,
	): void => {
		// Check if this is a token (has $type)
		if ("$type" in node && typeof node.$type === "string") {
			// Only skip typography property tokens if they're children of a typography group
			const typographyPropertyNames = new Set([
				"fontFamily",
				"fontSize",
				"fontWeight",
				"lineHeight",
				"letterSpacing",
			])
			const pathSegments = currentPath.split(".")
			const lastSegment = pathSegments[pathSegments.length - 1]
			const parentPath =
				pathSegments.length > 1
					? pathSegments.slice(0, -1).join(".")
					: undefined

			// Skip only if:
			// 1. The token name is a typography property name
			// 2. AND its parent path is a typography group
			const shouldSkip =
				typographyPropertyNames.has(lastSegment ?? "") &&
				parentPath !== undefined &&
				typographyGroups.has(parentPath)

			if (!shouldSkip) {
				tokens.set(currentPath, node as DTCGToken)
			}
			return
		}

		// Check if this is a typography group
		if (isTypographyGroup(node as DTCGTokenGroup)) {
			typographyGroups.set(currentPath, node as DTCGTokenGroup)
			// Process children to identify typography property tokens, but don't add them to tokens map yet
			// They'll be composed into the typography group later
			for (const [key, value] of Object.entries(node)) {
				if (
					key !== "$type" &&
					key !== "$value" &&
					key !== "$description" &&
					key !== "$extensions" &&
					value &&
					typeof value === "object"
				) {
					const childPath = currentPath ? `${currentPath}.${key}` : key
					// Recursively process children to handle nested structures
					processNode(value as DTCGToken | DTCGTokenGroup, childPath)
				}
			}
			return
		}

		// Otherwise, it's a regular group - recurse into children
		for (const [key, value] of Object.entries(node)) {
			if (
				key !== "$type" &&
				key !== "$value" &&
				key !== "$description" &&
				key !== "$extensions" &&
				value &&
				typeof value === "object"
			) {
				const childPath = currentPath ? `${currentPath}.${key}` : key
				processNode(value as DTCGToken | DTCGTokenGroup, childPath)
			}
		}
	}

	// Process all root-level entries
	for (const [key, value] of Object.entries(file)) {
		if (key !== "$schema" && value && typeof value === "object") {
			const path = prefix ? `${prefix}.${key}` : key
			processNode(value as DTCGToken | DTCGTokenGroup, path)
		}
	}

	// Compose typography groups and add them as composite tokens
	for (const [path, group] of typographyGroups.entries()) {
		// Create a temporary token map for alias resolution
		const tempTokens = new Map<string, DTCGToken>()
		// Add all existing tokens to temp map for alias resolution
		for (const [tokenPath, token] of tokens.entries()) {
			tempTokens.set(tokenPath, token)
		}
		// Add typography property tokens from this group for alias resolution
		for (const [key, value] of Object.entries(group)) {
			if (
				!key.startsWith("$") &&
				value &&
				typeof value === "object" &&
				"$type" in value
			) {
				const propertyPath = path ? `${path}.${key}` : key
				tempTokens.set(propertyPath, value as DTCGToken)
			}
		}

		const composed = composeTypographyGroup(group, tempTokens, path)
		if (composed) {
			// Create a synthetic token for the composed typography value
			const syntheticToken: DTCGToken = {
				$type: "typography",
				$value: composed,
			}
			tokens.set(path, syntheticToken)
		}
	}

	return tokens
}

/**
 * Normalizes a DTCG token to the internal token schema.
 */
export function normalizeDTCGToken(
	path: string,
	token: DTCGToken,
	allTokens: Map<string, DTCGToken>,
	warnings: string[],
): NormalizedToken | null {
	const tokenType = token.$type
	if (!tokenType || typeof tokenType !== "string") {
		warnings.push(`Token at path "${path}" missing $type`)
		return null
	}

	// Handle composed typography tokens
	if (tokenType === "typography") {
		const typographyValue = token.$value
		if (
			!typographyValue ||
			typeof typographyValue !== "object" ||
			!("fontFamily" in typographyValue) ||
			!("fontSize" in typographyValue)
		) {
			warnings.push(
				`Token at path "${path}" has invalid typography composition`,
			)
			return null
		}

		const id = path.replace(/\./g, "-").toLowerCase()
		const metadata = {
			source: "dtcg" as const,
		}

		return {
			id,
			name: path,
			type: "typography",
			value: {
				type: "value",
				value: typographyValue as TypographyValue,
			},
			description: token.$description,
			metadata,
		}
	}

	const normalizedType = mapDTCGTypeToTokenType(tokenType, path)
	if (!normalizedType) {
		warnings.push(`Token at path "${path}" has unsupported type "${tokenType}"`)
		return null
	}

	// Extract default value
	const defaultValue = normalizeDTCGTokenValue(
		token.$value,
		tokenType,
		path,
		allTokens,
	)

	if (!defaultValue) {
		warnings.push(`Token at path "${path}" has invalid or missing $value`)
		return null
	}

	// Extract mode-specific values (nested objects that aren't $type, $value, etc.)
	// Exclude typography property tokens from mode detection
	const typographyPropertyTypes = new Set([
		"fontFamily",
		"fontSize",
		"fontWeight",
		"lineHeight",
		"letterSpacing",
	])
	const modes: Record<string, TokenValueOrAlias> = {}
	for (const [key, value] of Object.entries(token)) {
		if (
			key !== "$type" &&
			key !== "$value" &&
			key !== "$description" &&
			key !== "$extensions" &&
			value &&
			typeof value === "object"
		) {
			// Check if this looks like a mode (has $value and is not a typography property token)
			const modeToken = value as DTCGToken
			if (
				"$value" in modeToken &&
				(!modeToken.$type || !typographyPropertyTypes.has(modeToken.$type))
			) {
				const modeValue = normalizeDTCGTokenValue(
					modeToken.$value,
					tokenType,
					path,
					allTokens,
				)
				if (modeValue) {
					modes[key] = modeValue
				}
			}
		}
	}

	// Generate ID from path
	const id = path.replace(/\./g, "-").toLowerCase()

	const metadata = {
		source: "dtcg" as const,
	}

	return {
		id,
		name: path,
		type: normalizedType,
		value: defaultValue,
		modes: Object.keys(modes).length > 0 ? modes : undefined,
		description: token.$description,
		metadata,
	}
}
