export type { DTCGImporterConfig, DTCGImporterResult } from "./DTCGImporter";
export { DTCGImporter } from "./DTCGImporter";
export type { FigmaImporterConfig, FigmaImporterResult } from "./FigmaImporter";
export { FigmaImporter } from "./FigmaImporter";

export { TokenEngine } from "./TokenEngine";

export type { ImporterResult, TokenImporter } from "./types/importer-types";

export type {
  DTCGJsonInput,
  DTCGToken,
  DTCGTokenFile,
  DTCGTokenGroup,
  FigmaVariableCollectionInput,
  FigmaVariableInput,
  FigmaVariablesInput,
  FigmaVariableValueInput,
  isDTCGInput,
  isFigmaInput,
  TokenInputSource,
} from "./types/input-sources";

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
} from "./types/token-types";

// Export validation utilities
export {
  detectCircularReferences,
  hasRequiredTokenTypes,
  isValidNormalizedToken,
  isValidNormalizedTokenSet,
  isValidTokenType,
  isValidTokenValueOrAlias,
  validateAliasReferences,
} from "./types/validators";

export type TokenSource = {
  type: string;
  path?: string;
  content?: unknown;
};

export type TokenFormat =
  | "css"
  | "js"
  | "json"
  | "tailwind"
  | "mui"
  | "chakra"
  | string;

export type TokenExportOptions = {
  format: TokenFormat;
  destination: string;
  prefix?: string;
};
