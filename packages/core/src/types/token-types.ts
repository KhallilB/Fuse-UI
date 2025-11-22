/**
 * Token Type Definitions
 *
 * Core type definitions for the normalized token data model.
 */

/**
 * Supported token types
 */
export type TokenType =
  | "color"
  | "spacing"
  | "typography"
  | "borderRadius"
  | "shadow"
  | "dimension"
  | "number"
  | "string"
  | "boolean";

/**
 * Color value representation (RGBA, normalized 0-1)
 */
export interface ColorValue {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a?: number; // 0-1, optional
}

/**
 * Spacing value with unit
 */
export interface SpacingValue {
  value: number;
  unit: "px" | "rem" | "em" | "pt";
}

/**
 * Typography value
 */
export interface TypographyValue {
  fontFamily: string;
  fontSize: SpacingValue;
  fontWeight: number | string;
  lineHeight: number | SpacingValue;
  letterSpacing?: SpacingValue;
  textCase?: "uppercase" | "lowercase" | "capitalize" | "none";
  textDecoration?: "underline" | "strikethrough" | "none";
}

/**
 * Border radius value
 */
export interface BorderRadiusValue {
  value: number;
  unit: "px" | "rem" | "em" | "%";
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

/**
 * Shadow value
 */
export interface ShadowValue {
  color: ColorValue;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  inset?: boolean;
}

/**
 * Union type for all possible token value types
 */
export type TokenValueType =
  | string
  | number
  | boolean
  | ColorValue
  | SpacingValue
  | TypographyValue
  | BorderRadiusValue
  | ShadowValue;

/**
 * Token value (concrete value)
 */
export interface TokenValue {
  type: "value";
  value: TokenValueType;
}

/**
 * Token alias (reference to another token)
 */
export interface TokenAlias {
  type: "alias";
  reference: string; // Dot-separated path to referenced token (e.g., "color.primary")
}

/**
 * Token value or alias
 */
export type TokenValueOrAlias = TokenValue | TokenAlias;

/**
 * Token metadata
 */
export interface TokenMetadata {
  source: "figma" | "dtcg";
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Allow additional metadata
}

/**
 * Normalized token representation
 */
export interface NormalizedToken {
  id: string;
  name: string; // Dot-separated path (e.g., "color.primary")
  type: TokenType;
  value: TokenValueOrAlias;
  modes?: Record<string, TokenValueOrAlias>; // Mode-specific values (e.g., "light", "dark")
  description?: string;
  metadata?: TokenMetadata;
}

/**
 * Token set metadata
 */
export interface TokenSetMetadata {
  name?: string;
  version?: string;
  description?: string;
  source?: "figma" | "dtcg";
  [key: string]: unknown;
}

/**
 * Normalized token set
 */
export interface NormalizedTokenSet {
  tokens: Record<string, NormalizedToken>;
  metadata?: TokenSetMetadata;
}

