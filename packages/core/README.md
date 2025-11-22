# `@fuseui/core`

Core token processing engine for FuseUI that handles ingestion, transformation, and export of design tokens from various sources into multiple output formats.

## Installation

```bash
npm install @fuseui/core
# or
yarn add @fuseui/core
# or
pnpm add @fuseui/core
```

## Usage

```typescript
import { TokenEngine } from '@fuseui/core';

// Initialize the engine
const engine = new TokenEngine();

// Process tokens from a source
const processedTokens = engine.processTokens({
  type: 'figma',
  path: 'path/to/figma/tokens.json'
});

// Transform tokens to a specific format
const transformedTokens = engine.transformTokens(processedTokens, 'css');

// Export tokens to a destination
engine.exportTokens(transformedTokens, 'path/to/output');
```

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
