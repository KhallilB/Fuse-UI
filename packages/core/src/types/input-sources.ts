/**
 * Type definitions for supported token input sources.
 */

export interface FigmaVariablesInput {
  type: "figma";
  fileKey: string;
  apiKey: string;
  variables?: Record<string, FigmaVariableInput>;
  variableCollections?: Record<string, FigmaVariableCollectionInput>;
}

/**
 * Figma Variable input from API response.
 * 
 * For ALIAS type values, the `value` field contains the variable ID as a string.
 * @see https://developers.figma.com/docs/rest-api/variables-endpoints/
 */
export interface FigmaVariableInput {
  id: string;
  name: string;
  key: string;
  variable_collection_id: string;
  resolved_type: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  description: string; // Required in API response
  hidden_from_publishing: boolean;
  scopes: Array<{
    node_id: string;
    node_name: string;
    node_type: string;
  }>;
  code_syntax: Record<string, string>;
  values_by_mode: Record<string, FigmaVariableValueInput>;
  remote: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Figma Variable value input
 * 
 * For ALIAS type: `value` contains the referenced variable ID as a string.
 * For VALUE type: `value` contains the actual value (string for COLOR/STRING, number for FLOAT, boolean for BOOLEAN).
 * COLOR values are returned as hex strings (e.g., "#FF5733") or rgba strings (e.g., "rgba(255, 87, 51, 1)").
 */
export interface FigmaVariableValueInput {
  type: "VALUE" | "ALIAS";
  value?: string | number | boolean; // For ALIAS: variable ID as string; For VALUE: actual value
  resolvedType?: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
}

/**
 * Figma Variable Collection input from API response.
 * @see https://developers.figma.com/docs/rest-api/variables-endpoints/
 */
export interface FigmaVariableCollectionInput {
  id: string;
  name: string;
  key: string;
  modes: Array<{
    mode_id: string;
    name: string;
  }>;
  default_mode_id: string;
  remote: boolean;
  hidden_from_publishing: boolean;
  created_at: string;
  updated_at: string;
}

export interface DTCGJsonInput {
  type: "dtcg";
  content: DTCGTokenFile;
  filePath?: string;
}

export interface DTCGTokenFile {
  $schema?: string;
  [key: string]: DTCGTokenGroup | DTCGToken | unknown;
}

export interface DTCGTokenGroup {
  [key: string]: DTCGToken | DTCGTokenGroup;
}

/**
 * DTCG token definition.
 * 
 * Aliases use `{token.path}` syntax in the `$value` field.
 * Modes can be nested as child objects or use `$extensions`.
 * @see https://tr.designtokens.org/format/
 */
export interface DTCGToken {
  $type?: string; // Token type: "color", "dimension", "fontFamily", etc.
  $value?: unknown; // Token value or alias reference like "{color.primary}"
  $description?: string;
  $extensions?: Record<string, unknown>;
  // Mode-specific values can be nested as child objects with the same structure
  [key: string]: DTCGToken | DTCGTokenGroup | unknown;
}

export type TokenInputSource = FigmaVariablesInput | DTCGJsonInput;

/** Type guard for Figma input. */
export function isFigmaInput(
  input: TokenInputSource,
): input is FigmaVariablesInput {
  return input.type === "figma";
}

/** Type guard for DTCG input. */
export function isDTCGInput(input: TokenInputSource): input is DTCGJsonInput {
  return input.type === "dtcg";
}

