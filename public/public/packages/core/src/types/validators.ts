/**
 * Validation utilities for token types and schemas.
 * These utilities complement the TypeScript type system for runtime validation.
 */

import type {
  NormalizedToken,
  NormalizedTokenSet,
  TokenType,
  TokenValueOrAlias,
} from "./token-types";

const VALID_TOKEN_TYPES: readonly TokenType[] = [
  "color",
  "spacing",
  "typography",
  "borderRadius",
  "shadow",
  "dimension",
  "number",
  "string",
  "boolean",
] as const;

/** Type guard for valid token types. */
export function isValidTokenType(value: unknown): value is TokenType {
  return (
    typeof value === "string" &&
    VALID_TOKEN_TYPES.includes(value as TokenType)
  );
}

/** Type guard for TokenValueOrAlias. */
export function isValidTokenValueOrAlias(
	value: unknown,
): value is TokenValueOrAlias {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (obj.type === "value") {
    return "value" in obj;
  }

  if (obj.type === "alias") {
    return (
      typeof obj.reference === "string" && obj.reference.length > 0
    );
  }

  return false;
}

/** Type guard for normalized tokens. */
export function isValidNormalizedToken(
	token: unknown,
): token is NormalizedToken {
  if (typeof token !== "object" || token === null) {
    return false;
  }

  const t = token as Record<string, unknown>;

  // Required fields
  if (
    typeof t.id !== "string" ||
    typeof t.name !== "string" ||
    !isValidTokenType(t.type) ||
    !isValidTokenValueOrAlias(t.value)
  ) {
    return false;
  }

  // Optional modes
  if (t.modes !== undefined) {
    if (typeof t.modes !== "object" || t.modes === null) {
      return false;
    }

    const modes = t.modes as Record<string, unknown>;
    for (const modeValue of Object.values(modes)) {
      if (!isValidTokenValueOrAlias(modeValue)) {
        return false;
      }
    }
  }

  // Optional description
  if (t.description !== undefined && typeof t.description !== "string") {
    return false;
  }

  return true;
}

/** Type guard for normalized token sets. */
export function isValidNormalizedTokenSet(
	tokenSet: unknown,
): tokenSet is NormalizedTokenSet {
  if (typeof tokenSet !== "object" || tokenSet === null) {
    return false;
  }

  const ts = tokenSet as Record<string, unknown>;

  // Required tokens field
  if (typeof ts.tokens !== "object" || ts.tokens === null) {
    return false;
  }

  const tokens = ts.tokens as Record<string, unknown>;
  for (const token of Object.values(tokens)) {
    if (!isValidNormalizedToken(token)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates that all required token types are present in a token set.
 * 
 * @returns Object with `valid` boolean and `missing` array of absent token types.
 */
export function hasRequiredTokenTypes(
	tokenSet: NormalizedTokenSet,
): {
	valid: boolean;
	missing: TokenType[];
} {
  const requiredTypes: TokenType[] = [
    "color",
    "spacing",
    "typography",
    "borderRadius",
    "shadow",
  ];

  const presentTypes = new Set<TokenType>();
  for (const token of Object.values(tokenSet.tokens)) {
    presentTypes.add(token.type);
  }

  const missing = requiredTypes.filter((type) => !presentTypes.has(type));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates that token aliases reference existing tokens.
 * 
 * @returns Object with `valid` boolean and `errors` array of invalid references.
 */
export function validateAliasReferences(
	tokenSet: NormalizedTokenSet,
): {
	valid: boolean;
	errors: Array<{ tokenName: string; reference: string }>;
} {
  const errors: Array<{ tokenName: string; reference: string }> = [];
  const tokenNames = new Set(Object.keys(tokenSet.tokens));

  for (const [tokenName, token] of Object.entries(tokenSet.tokens)) {
    // Check main value
    if (token.value.type === "alias") {
      if (!tokenNames.has(token.value.reference)) {
        errors.push({
          tokenName,
          reference: token.value.reference,
        });
      }
    }

    // Check mode values
    if (token.modes) {
      for (const [modeName, modeValue] of Object.entries(token.modes)) {
        if (modeValue.type === "alias") {
          if (!tokenNames.has(modeValue.reference)) {
            errors.push({
              tokenName: `${tokenName} (mode: ${modeName})`,
              reference: modeValue.reference,
            });
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detects circular references in token aliases.
 * 
 * @returns Object with `hasCircular` boolean and `cycles` array of detected cycles.
 */
export function detectCircularReferences(
	tokenSet: NormalizedTokenSet,
): {
	hasCircular: boolean;
	cycles: Array<{ tokens: string[] }>;
} {
  const cycles: Array<{ tokens: string[] }> = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function resolveReference(
    tokenName: string,
    path: string[],
  ): TokenValueOrAlias | null {
    const token = tokenSet.tokens[tokenName];
    if (!token) {
      return null;
    }

    if (visiting.has(tokenName)) {
      // Found a cycle
      const cycleStart = path.indexOf(tokenName);
      if (cycleStart !== -1) {
        cycles.push({
          tokens: [...path.slice(cycleStart), tokenName],
        });
      }
      return null;
    }

    if (visited.has(tokenName)) {
      return token.value;
    }

    visiting.add(tokenName);
    path.push(tokenName);

    let value = token.value;
    if (value.type === "alias") {
      value = resolveReference(value.reference, path) || value;
    }

    visiting.delete(tokenName);
    visited.add(tokenName);
    path.pop();

    return value;
  }

  for (const tokenName of Object.keys(tokenSet.tokens)) {
    if (!visited.has(tokenName)) {
      resolveReference(tokenName, []);
    }
  }

  return {
    hasCircular: cycles.length > 0,
    cycles,
  };
}

