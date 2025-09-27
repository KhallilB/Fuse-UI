# `@fuseui/core`

Core functionality for the FuseUI design token processing system.

## Overview

This package provides the core token processing engine for FuseUI. It handles the ingestion, transformation, and export of design tokens from various sources into multiple output formats.

## Usage

```typescript
import { TokenEngine } from '@fuseui/core';

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

## Features

- Token ingestion from various sources
- Token transformation to multiple formats
- Token export to different destinations

## API

### TokenEngine

The main class for processing design tokens.

#### Methods

- `processTokens(source: unknown): unknown` - Process tokens from a source
- `transformTokens(tokens: unknown, format: string): unknown` - Transform tokens to a specific format
- `exportTokens(tokens: unknown, destination: string): void` - Export tokens to a destination