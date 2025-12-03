import type { DTCGToken } from "../../types/input-sources";
import { parseAliasReference } from "./dtcg-normalizers";

const VALID_DTCG_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "borderRadius",
  "shadow",
] as const;

type DTCGType = (typeof VALID_DTCG_TYPES)[number];

/**
 * Validates a DTCG file structure against the DTCG specification.
 *
 * @returns Validation result with errors array
 */
export function validateDTCGFile(file: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!file || typeof file !== "object") {
    errors.push("DTCG file must be an object");
    return { valid: false, errors };
  }

  const fileObj = file as Record<string, unknown>;

  // Validate $schema if present (optional)
  if ("$schema" in fileObj && typeof fileObj.$schema !== "string") {
    errors.push("$schema must be a string if present");
  }

  // Recursively validate token structure
  const validateToken = (token: unknown, path: string): void => {
    if (!token || typeof token !== "object") {
      errors.push(`Token at path "${path}" must be an object`);
      return;
    }

    const tokenObj = token as DTCGToken;

    // Check if this is a token (has $type) or a group
    if ("$type" in tokenObj) {
      // This is a token - validate it
      if (typeof tokenObj.$type !== "string") {
        errors.push(`Token at path "${path}" must have $type as a string`);
        return;
      }

      const tokenType = tokenObj.$type;
      if (!VALID_DTCG_TYPES.includes(tokenType as DTCGType)) {
        errors.push(
          `Token at path "${path}" has invalid $type: "${tokenType}". Valid types: ${VALID_DTCG_TYPES.join(
            ", "
          )}`
        );
      }

      // Validate $value
      if (!("$value" in tokenObj)) {
        errors.push(`Token at path "${path}" must have $value`);
      } else {
        validateTokenValue(tokenObj.$value, tokenType);
      }
    }

    // Validate nested tokens/groups (excluding $type, $value, $description, $extensions)
    for (const [key, value] of Object.entries(tokenObj)) {
      if (
        key !== "$type" &&
        key !== "$value" &&
        key !== "$description" &&
        key !== "$extensions"
      ) {
        const childPath = path ? `${path}.${key}` : key;
        if (value && typeof value === "object") {
          validateToken(value, childPath);
        }
      }
    }
  };

  // Validate all root-level tokens/groups
  for (const [key, value] of Object.entries(fileObj)) {
    if (key !== "$schema" && value && typeof value === "object") {
      validateToken(value, key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateTokenValue(value: unknown, type: string): void {
  // Value can be:
  // 1. A concrete value matching the type
  // 2. An alias reference like "{token.path}"

  if (typeof value === "string") {
    // Check if it's an alias using parser for consistency
    if (parseAliasReference(value) !== null) {
      // Valid alias syntax
      return;
    }

    // For string types, any string is valid
    if (type === "color" || type === "fontFamily") {
      return;
    }

    // For dimension types, we're lenient and let the normalizer handle validation
    // The normalizer will parse and validate the actual format (e.g., "16px", "1rem")
    if (
      type === "dimension" ||
      type === "fontSize" ||
      type === "lineHeight" ||
      type === "letterSpacing" ||
      type === "borderRadius"
    ) {
      return;
    }
  }

  if (type === "fontWeight") {
    // Can be number or string
    if (typeof value === "number" || typeof value === "string") {
      return;
    }
  }

  if (type === "shadow") {
    // Can be array, object, or string
    if (
      Array.isArray(value) ||
      (typeof value === "object" && value !== null) ||
      typeof value === "string"
    ) {
      return;
    }
  }

  // For other types, we'll be lenient and let the parser handle it
}
