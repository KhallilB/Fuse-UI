# Figma Integration

Fetches and normalizes Figma Variables into FuseUI tokens.

## Usage

```typescript
import { FigmaImporter } from '@fuseui-org/core';

const importer = new FigmaImporter({
  apiKey: 'figd_your_personal_access_token',
  fileKey: 'your-figma-file-key',
});

const result = await importer.ingest();

// result.tokenSet contains normalized tokens
// result.warnings contains non-fatal issues
// result.errors contains fatal errors (if any)
```

## How It Works

1. Fetches variables and collections from Figma API in parallel
2. Variables are required - ingestion fails if they can't be fetched
3. Collections are optional - ingestion continues if they fail (uses mode IDs instead of names)
4. Normalizes variable names: `color/primary` → `color.primary`
5. Resolves aliases to token references
6. Parses colors (hex, rgb, rgba) to normalized format

## Supported Types

- `COLOR` → `color` token
- `FLOAT` → `number` token
- `STRING` → `string` token
- `BOOLEAN` → `boolean` token

## Error Handling

- **401/403**: Invalid API key → throws
- **404**: Invalid file key → throws
- **429**: Rate limited → throws
- **Collections API fails**: Returns tokens with warnings (partial success)
- **Individual variable fails**: Skips variable, adds to warnings

## Related Documentation

- [Figma Variables API](https://developers.figma.com/docs/rest-api/variables-endpoints/)
- [Core README](../../../README.md) - Package overview
- [Token Spec](../../../TOKEN_SPEC.md) - Token data model

