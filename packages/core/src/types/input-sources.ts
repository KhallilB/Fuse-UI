/**
 * Input Source Type Definitions
 *
 * Type definitions for supported token input sources.
 */

/**
 * Figma Variables API input source
 */
export interface FigmaVariablesInput {
  type: "figma";
  fileKey: string;
  apiKey: string;
  variables?: Record<string, FigmaVariableInput>;
  variableCollections?: Record<string, FigmaVariableCollectionInput>;
}

/**
 * Figma Variable input (from API)
 * 
 * Aligned with Figma REST API response structure.
 * For ALIAS type values, the `value` field contains the variable ID as a string.
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
 * Figma Variable Collection input
 * 
 * Aligned with Figma REST API response structure.
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

/**
 * DTCG JSON input source
 */
export interface DTCGJsonInput {
  type: "dtcg";
  content: DTCGTokenFile;
  filePath?: string;
}

/**
 * DTCG token file structure
 */
export interface DTCGTokenFile {
  $schema?: string;
  [key: string]: DTCGTokenGroup | DTCGToken | unknown;
}

/**
 * DTCG token group (container for tokens)
 */
export interface DTCGTokenGroup {
  [key: string]: DTCGToken | DTCGTokenGroup;
}

/**
 * DTCG token definition
 * 
 * DTCG format uses individual token types (not composite):
 * - `color`: Color values (hex, rgb, rgba strings)
 * - `dimension`: Spacing/size values with units (e.g., "16px", "1rem")
 * - `fontFamily`: Font family names
 * - `fontSize`: Font size (dimension)
 * - `fontWeight`: Font weight (number or string like "400", "bold")
 * - `lineHeight`: Line height (dimension or number)
 * - `letterSpacing`: Letter spacing (dimension)
 * - `borderRadius`: Border radius (dimension)
 * - `shadow`: Shadow values (array of shadow objects or string)
 * 
 * Aliases use `{token.path}` syntax in the `$value` field.
 * Modes can be nested as child objects or use `$extensions`.
 */
export interface DTCGToken {
  $type?: string; // Token type: "color", "dimension", "fontFamily", etc.
  $value?: unknown; // Token value or alias reference like "{color.primary}"
  $description?: string;
  $extensions?: Record<string, unknown>;
  // Mode-specific values can be nested as child objects with the same structure
  [key: string]: DTCGToken | DTCGTokenGroup | unknown;
}

/**
 * Union type for all input sources
 */
export type TokenInputSource = FigmaVariablesInput | DTCGJsonInput;

/**
 * Type guard for Figma input
 */
export function isFigmaInput(
  input: TokenInputSource,
): input is FigmaVariablesInput {
  return input.type === "figma";
}

/**
 * Type guard for DTCG input
 */
export function isDTCGInput(input: TokenInputSource): input is DTCGJsonInput {
  return input.type === "dtcg";
}

