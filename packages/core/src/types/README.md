# Token Types

Type definitions for the normalized token data model and input sources.

## Files

- `token-types.ts` - Core normalized token schema types
- `input-sources.ts` - Input source type definitions (Figma Variables API and DTCG JSON)
- `validators.ts` - Runtime validation utilities

## Usage

```typescript
import {
  NormalizedToken,
  NormalizedTokenSet,
  TokenType,
  ColorValue,
  FigmaVariablesInput,
  DTCGJsonInput,
} from "@fuseui/core";

// Create a normalized token
const token: NormalizedToken = {
  id: "color-primary",
  name: "color.primary",
  type: "color",
  value: {
    type: "value",
    value: { r: 1, g: 0.34, b: 0.2, a: 1 },
  },
  modes: {
    light: {
      type: "value",
      value: { r: 1, g: 0.34, b: 0.2, a: 1 },
    },
    dark: {
      type: "value",
      value: { r: 1, g: 0.55, b: 0.4, a: 1 },
    },
  },
  description: "Primary brand color",
  metadata: {
    source: "figma",
    sourceId: "VariableID:123",
  },
};

// Create a token set
const tokenSet: NormalizedTokenSet = {
  tokens: {
    "color.primary": token,
  },
  metadata: {
    name: "Design Tokens",
    version: "1.0.0",
    source: "figma",
  },
};
```

## Supported Token Types

The normalized schema supports the following token types:

- **color** - Color values (RGBA)
- **spacing** - Spacing/dimension values with units
- **typography** - Typography definitions (font family, size, weight, etc.)
- **borderRadius** - Border radius values
- **shadow** - Shadow definitions
- **dimension** - Generic dimension values
- **number** - Numeric values
- **string** - String values
- **boolean** - Boolean values

## Modes/Themes

Tokens can have mode-specific values. Modes are represented as a `Record<string, TokenValueOrAlias>` on each token:

```typescript
{
  value: { type: "value", value: "default-value" },
  modes: {
    light: { type: "value", value: "light-value" },
    dark: { type: "value", value: "dark-value" },
  },
}
```

## Token Aliases

Tokens can reference other tokens using aliases:

```typescript
{
  value: {
    type: "alias",
    reference: "color.primary", // Dot-separated path
  },
}
```

## Related Documentation

- [CHANGELOG.md](../../../../CHANGELOG.md) - Version history
- [Testing Guide](./TESTING.md) - How to test token types and schemas
- [Token Specification](../../TOKEN_SPEC.md) - Complete token input sources and data model spec
