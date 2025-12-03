/**
 * Core type definitions for the normalized token data model.
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

export interface ColorValue {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a?: number; // 0-1, optional
}

export interface SpacingValue {
  value: number;
  unit: "px" | "rem" | "em" | "pt";
}

export interface TypographyValue {
  fontFamily: string;
  fontSize: SpacingValue;
  fontWeight: number | string;
  lineHeight: number | SpacingValue;
  letterSpacing?: SpacingValue;
  textCase?: "uppercase" | "lowercase" | "capitalize" | "none";
  textDecoration?: "underline" | "strikethrough" | "none";
}

export interface BorderRadiusValue {
  value: number;
  unit: "px" | "rem" | "em" | "%";
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}

export interface ShadowValue {
  color: ColorValue;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  inset?: boolean;
}

export type TokenValueType =
  | string
  | number
  | boolean
  | ColorValue
  | SpacingValue
  | TypographyValue
  | BorderRadiusValue
  | ShadowValue;

export interface TokenValue {
  type: "value";
  value: TokenValueType;
}

export interface TokenAlias {
  type: "alias";
  reference: string; // Dot-separated path to referenced token (e.g., "color.primary")
}

export type TokenValueOrAlias = TokenValue | TokenAlias;

export interface TokenMetadata {
  source: "figma" | "dtcg";
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Allow additional metadata
}

export interface NormalizedToken {
  id: string;
  name: string; // Dot-separated path (e.g., "color.primary")
  type: TokenType;
  value: TokenValueOrAlias;
  modes?: Record<string, TokenValueOrAlias>; // Mode-specific values (e.g., "light", "dark")
  description?: string;
  metadata?: TokenMetadata;
}

export interface TokenSetMetadata {
  name?: string;
  version?: string;
  description?: string;
  source?: "figma" | "dtcg";
  [key: string]: unknown;
}

export interface NormalizedTokenSet {
  tokens: Record<string, NormalizedToken>;
  metadata?: TokenSetMetadata;
}

