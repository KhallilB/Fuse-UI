# Token Input Sources and Data Model Specification

## Overview

This document defines the supported token input sources for the FuseUI MVP and the normalized internal data model used to represent design tokens across all sources.

## Supported Input Sources

### 1. Figma Variables API

Figma Variables are accessed via the Figma REST API. Variables are organized into collections, and each collection can have multiple modes (e.g., light/dark themes).

**Key Characteristics:**

- Variables have a `resolved_type`: `BOOLEAN`, `FLOAT`, `STRING`, or `COLOR`
- Variables have `values_by_mode` which maps mode IDs to values
- Variables can reference other variables via aliases (`type: "ALIAS"`)
- Variable collections define modes (e.g., "Light", "Dark")
- Variables have scopes that define where they can be used

**API Endpoints:**

- `GET /v1/files/:file_key/variables/local` - Get local variables
- `GET /v1/files/:file_key/variable-collections` - Get variable collections

**Example Structure:**

```json
{
  "meta": {
    "variables": {
      "VariableID:123": {
        "id": "VariableID:123",
        "name": "color/primary",
        "key": "primary",
        "variable_collection_id": "CollectionID:456",
        "resolved_type": "COLOR",
        "description": "Primary brand color",
        "hidden_from_publishing": false,
        "scopes": [],
        "code_syntax": {},
        "values_by_mode": {
          "ModeID:light": { "type": "VALUE", "value": "#FF5733" },
          "ModeID:dark": { "type": "VALUE", "value": "#FF8C66" }
        },
        "remote": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    }
  }
}
```

**Important Notes:**

- COLOR values are returned as hex strings (e.g., "#FF5733") or rgba strings (e.g., "rgba(255, 87, 51, 1)")
- For ALIAS type, the `value` field contains the referenced variable ID as a string
- All fields in the API response are present (not optional)
- Variables must be parsed and transformed to the normalized format

### 2. DTCG (Design Tokens Community Group) JSON

Local JSON files following the [DTCG specification](https://tr.designtokens.org/format/).

**Key Characteristics:**

- Tokens are organized in a hierarchical structure
- Tokens have a `$type` property indicating the token type
- Tokens can reference other tokens using `{token.path}` syntax
- Tokens can have mode-specific values using `$extensions` or nested structures
- Supports groups and sets for organization

**Example Structure:**

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#FF5733",
      "light": {
        "$value": "#FF5733"
      },
      "dark": {
        "$value": "#FF8C66"
      }
    },
    "secondary": {
      "$type": "color",
      "$value": "{color.primary}"  // Alias reference
    }
  },
  "spacing": {
    "small": {
      "$type": "dimension",
      "$value": "8px"
    }
  },
  "typography": {
    "body": {
      "fontFamily": {
        "$type": "fontFamily",
        "$value": "Inter, sans-serif"
      },
      "fontSize": {
        "$type": "dimension",
        "$value": "16px"
      },
      "fontWeight": {
        "$type": "fontWeight",
        "$value": "400"
      },
      "lineHeight": {
        "$type": "dimension",
        "$value": "24px"
      }
    }
  }
}
```

**Important Notes:**

- DTCG uses individual token types (not composite types like "typography")
- Common token types: `color`, `dimension`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `borderRadius`, `shadow`
- Aliases use `{token.path}` syntax in the `$value` field
- Modes can be nested as child objects with the same structure
- Values are typically strings that need parsing (e.g., "16px" → { value: 16, unit: "px" })

## Normalized Internal Data Model

The normalized schema unifies tokens from all sources into a consistent structure that supports:

- Multiple token types (color, spacing, typography, border radius, shadows)
- Theming/modes (e.g., light/dark variants)
- Token aliases/references
- Metadata and descriptions

### Core Schema Structure

```typescript
interface NormalizedTokenSet {
  tokens: Record<string, NormalizedToken>;
  metadata?: TokenMetadata;
}

interface NormalizedToken {
  id: string;
  name: string;
  type: TokenType;
  value: TokenValue | TokenAlias;
  modes?: Record<string, TokenValue | TokenAlias>;
  description?: string;
  metadata?: Record<string, unknown>;
}

type TokenType = 
  | "color"
  | "spacing"
  | "typography"
  | "borderRadius"
  | "shadow"
  | "dimension"
  | "number"
  | "string"
  | "boolean";

interface TokenValue {
  type: "value";
  value: string | number | boolean | ColorValue | SpacingValue | TypographyValue | BorderRadiusValue | ShadowValue;
}

interface TokenAlias {
  type: "alias";
  reference: string; // Path to referenced token (e.g., "color.primary")
}

interface TokenMetadata {
  source: "figma" | "dtcg";
  sourceId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Token Type Definitions

#### Color

```typescript
interface ColorValue {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a?: number; // 0-1, optional
}
```

**Note:** Color values from Figma (hex/rgba strings) and DTCG (hex strings) must be parsed into this normalized format.

#### Spacing

```typescript
interface SpacingValue {
  value: number;
  unit: "px" | "rem" | "em" | "pt";
}
```

#### Typography

```typescript
interface TypographyValue {
  fontFamily: string;
  fontSize: SpacingValue;
  fontWeight: number | string;
  lineHeight: number | SpacingValue;
  letterSpacing?: SpacingValue;
  textCase?: "uppercase" | "lowercase" | "capitalize" | "none";
  textDecoration?: "underline" | "strikethrough" | "none";
}
```

**Note:** This is a composite type in the normalized schema. DTCG uses individual token types (`fontFamily`, `fontSize`, `fontWeight`, etc.) that must be grouped together during normalization.

#### Border Radius

```typescript
interface BorderRadiusValue {
  value: number;
  unit: "px" | "rem" | "em" | "%";
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
}
```

#### Shadow

```typescript
interface ShadowValue {
  color: ColorValue;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  inset?: boolean;
}
```

### Modes/Themes

Modes are represented as a `Record<string, TokenValue | TokenAlias>` on each token. The key is the mode identifier (e.g., "light", "dark", "mobile", "desktop").

**Example:**

```typescript
{
  id: "color-primary",
  name: "color.primary",
  type: "color",
  value: { type: "value", value: { r: 1, g: 0.34, b: 0.2, a: 1 } },
  modes: {
    "light": { type: "value", value: { r: 1, g: 0.34, b: 0.2, a: 1 } },
    "dark": { type: "value", value: { r: 1, g: 0.55, b: 0.4, a: 1 } }
  }
}
```

### Token Aliases

Aliases allow tokens to reference other tokens. The reference is a dot-separated path to the target token.

**Example:**

```typescript
{
  id: "color-primary-hover",
  name: "color.primary.hover",
  type: "color",
  value: { 
    type: "alias", 
    reference: "color.primary" 
  }
}
```

## Token Type Mapping

### From Figma Variables

| Figma `resolved_type` | Normalized `type` | Value Mapping |
|----------------------|-------------------|---------------|
| `COLOR` | `color` | RGBA values (0-1 range) |
| `FLOAT` | `spacing` or `dimension` | Based on variable name/context |
| `STRING` | `string` | Direct string value |
| `BOOLEAN` | `boolean` | Direct boolean value |

### From DTCG JSON

| DTCG `$type` | Normalized `type` | Value Mapping |
|--------------|-------------------|---------------|
| `color` | `color` | Hex/RGBA → ColorValue |
| `dimension` | `spacing` or `dimension` | Parse value + unit |
| `fontFamily` | `typography` (partial) | Part of TypographyValue |
| `fontWeight` | `typography` (partial) | Part of TypographyValue |
| `fontSize` | `typography` (partial) | Part of TypographyValue |
| `lineHeight` | `typography` (partial) | Part of TypographyValue |
| `letterSpacing` | `typography` (partial) | Part of TypographyValue |
| `borderRadius` | `borderRadius` | Parse value + unit |
| `shadow` | `shadow` | Parse shadow properties |

## Implementation Notes

1. **Mode Resolution**: When resolving a token value, first check if a mode-specific value exists, otherwise fall back to the default value.

2. **Alias Resolution**:
   - Figma: ALIAS values contain the variable ID in the `value` field (as a string). Must resolve to the referenced variable.
   - DTCG: Aliases use `{token.path}` syntax in `$value`. Must resolve recursively.
   - Circular references should be detected and handled.

3. **Value Parsing**:
   - **Colors**: Figma returns hex/rgba strings → parse to `ColorValue` object (RGBA 0-1)
   - **Dimensions**: DTCG returns strings like "16px" → parse to `SpacingValue` { value: 16, unit: "px" }
   - **Typography**: DTCG uses separate tokens → group into composite `TypographyValue`

4. **Type Mapping**:
   - Figma `COLOR` → normalized `color` (requires parsing)
   - Figma `FLOAT` → normalized `spacing` or `dimension` (based on context/name)
   - DTCG `dimension` → normalized `spacing` or `dimension`
   - DTCG individual typography tokens → normalized composite `typography`

5. **Validation**: All tokens should be validated against the normalized schema before processing.

6. **Extensibility**: The schema supports additional metadata via the `metadata` field for source-specific information.

## Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Types Documentation](./src/types/README.md) - Type definitions and usage
- [Testing Guide](./src/types/TESTING.md) - How to test token types and schemas
