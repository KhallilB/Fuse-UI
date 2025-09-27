# `@fuseui/sdk`

The FuseUI SDK provides programmatic access to the FuseUI API. This package can be used in both browser and Node.js environments.

## Installation

```bash
npm install @fuseui/sdk
# or
yarn add @fuseui/sdk
# or
pnpm add @fuseui/sdk
```

## Usage

```typescript
import { FuseClient } from '@fuseui/sdk';

// Initialize the client
const client = new FuseClient();

// Use the client
const result = await client.someMethod();
```

## Features

- Cross-platform (works in browser and Node.js)
- Lightweight with minimal dependencies
- TypeScript support

## Documentation

This SDK will be used for any programmatic access to the FuseUI API. More detailed documentation will be added as the API evolves.