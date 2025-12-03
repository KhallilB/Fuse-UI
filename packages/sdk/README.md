# `@fuseui-org/sdk`

FuseUI SDK providing programmatic access to the FuseUI API. Works in both browser and Node.js environments. The SDK targets modern JavaScript runtimes (ES2020+) in both Node.js and browser environments.

## Requirements

- Node.js 18+ (LTS) recommended
- Modern browsers (last 2 versions of major vendors)

## Installation

```bash
npm install @fuseui-org/sdk
# or
yarn add @fuseui-org/sdk
# or
pnpm add @fuseui-org/sdk
```

## Usage

```typescript
import { FuseClient } from "@fuseui-org/sdk";

// Initialize the client with options
const client = new FuseClient({
  baseUrl: "https://api.fuseui.com", // Optional, defaults to this value
  apiVersion: "v1", // Optional, defaults to 'v1'
  apiKey: "your-api-key", // Optional, for authenticated requests
});

// Make API requests
try {
  // Ping the API to check connectivity
  const pingResult = await client.ping();
  console.log("API Status:", pingResult.status);

  // Get user information
  const user = await client.getUser();
  console.log("User:", user);
} catch (error) {
  console.error("API Error:", error);
}
```

## API Documentation

### FuseClient

The main client class for interacting with the FuseUI API.

#### Constructor

```typescript
new FuseClient(options?: FuseClientOptions)
```

#### Methods

##### `ping()`

Pings the API to check connectivity.

```typescript
async ping(): Promise<{ status: string; message: string }>
```

##### `getUser()`

Returns information about the authenticated user.

```typescript
async getUser(): Promise<{ id: string; name: string }>
```

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
