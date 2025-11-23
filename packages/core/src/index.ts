export type {
	FigmaImporterConfig,
	FigmaImporterResult,
} from "./FigmaImporter"
export { FigmaImporter } from "./FigmaImporter"
export { TokenEngine } from "./TokenEngine"

export type {
	DTCGJsonInput,
	DTCGToken,
	DTCGTokenFile,
	DTCGTokenGroup,
	FigmaVariableCollectionInput,
	FigmaVariableInput,
	FigmaVariablesInput,
	FigmaVariableValueInput,
	TokenInputSource,
} from "./types/input-sources"

export { isDTCGInput, isFigmaInput } from "./types/input-sources"
export type {
	BorderRadiusValue,
	ColorValue,
	NormalizedToken,
	NormalizedTokenSet,
	ShadowValue,
	SpacingValue,
	TokenAlias,
	TokenMetadata,
	TokenSetMetadata,
	TokenType,
	TokenValue,
	TokenValueOrAlias,
	TokenValueType,
	TypographyValue,
} from "./types/token-types"
// Export validation utilities
export {
	detectCircularReferences,
	hasRequiredTokenTypes,
	isValidNormalizedToken,
	isValidNormalizedTokenSet,
	isValidTokenType,
	isValidTokenValueOrAlias,
	validateAliasReferences,
} from "./types/validators"

/** Token source configuration for processing. */
export type TokenSource = {
	type: string
	path?: string
	content?: unknown
}

/** Supported token output formats. */
export type TokenFormat =
	| "css"
	| "js"
	| "json"
	| "tailwind"
	| "mui"
	| "chakra"
	| string

/** Options for exporting tokens to a destination. */
export type TokenExportOptions = {
	format: TokenFormat
	destination: string
	prefix?: string
}
