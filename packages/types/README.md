# `@fuseui-org/types`

TypeScript type definitions for external APIs used by FuseUI, including Figma REST API types.

## Installation

This package is typically installed as a dependency in workspace packages:

```bash
pnpm add @fuseui-org/types
```

## Contents

### Figma API Types

Type definitions for the Figma REST API, based on the official Figma API specification.

**Main exports:**

- `FigmaUser` - User information
- `FigmaFile` - File metadata and structure
- `FigmaDocument` - Document node structure
- `FigmaVariable` - Design variable definitions
- `FigmaVariableCollection` - Variable collection metadata
- And other Figma API response types

## Usage

```typescript
import type {
  FigmaFile,
  FigmaVariable,
  FigmaVariableCollection,
} from "@fuseui-org/types";

// Type-safe Figma API responses
const file: FigmaFile = await fetchFigmaFile(fileKey);
const variables: FigmaVariable[] = await fetchFigmaVariables(fileKey);
```

## Related Documentation

- [Figma REST API Documentation](https://developers.figma.com/docs/rest-api/)
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
