# `@fuseui-org/core`

Core token processing engine for FuseUI that handles ingestion, transformation, and export of design tokens from various sources into multiple output formats.

## Installation

```bash
npm install @fuseui-org/core
# or
yarn add @fuseui-org/core
# or
pnpm add @fuseui-org/core
```

## Usage

```typescript
import { TokenEngine } from "@fuseui-org/core";

// Initialize the engine
const engine = new TokenEngine();

// Process tokens from a source
const processedTokens = engine.processTokens({
  type: "figma",
  path: "path/to/figma/tokens.json",
});

// Transform tokens to a specific format
const transformedTokens = engine.transformTokens(processedTokens, "css");

// Export tokens to a destination
engine.exportTokens(transformedTokens, "path/to/output");
```

## Supported Formats

The core engine supports multiple input sources (Figma Variables, DTCG JSON) and output formats CSS custom properties, TypeScript types, Tailwind config, and more.

## API Documentation

### TokenEngine

The main class for processing design tokens.

#### Methods

- `processTokens(source: unknown): unknown` - Process tokens from a source
- `transformTokens(tokens: unknown, format: string): unknown` - Transform tokens to a specific format
- `exportTokens(tokens: unknown, destination: string): void` - Export tokens to a destination

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [TOKEN_SPEC.md](./TOKEN_SPEC.md) - Token input sources and data model specification
- [Types Documentation](./src/types/README.md) - Type definitions and usage

## Example: processing a local DTCG file

```ts
import { TokenEngine } from "@fuseui-org/core";
import tokens from "./tokens/primitives.json";

const engine = new TokenEngine();

// Normalize raw tokens from a DTCG-compliant JSON file
const processed = engine.processTokens({
  type: "dtcg",
  value: tokens,
});

// Convert to CSS custom properties
const cssTokens = engine.transformTokens(processed, "css");
```
