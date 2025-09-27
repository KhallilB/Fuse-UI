# FuseUI

FuseUI is a token-first, adapter-driven release engine that turns design intent into reviewed, versioned UI code packages. It bridges the gap between design tools and code repositories, enabling teams to ship UI changes with the speed and safety of modern DevOps.

## Features

- **Token Ingestion**: Pulls design tokens from Figma Variables or DTCG JSON
- **Multi-Format Output**: Generates CSS custom properties, TypeScript types, Tailwind config presets, and themes for MUI and Chakra UI
- **Storybook Integration**: Auto-generates stories and visual regression tests
- **CI/CD Pipeline**: Gates PRs with visual diffs and accessibility checks
- **Package Publishing**: Automates versioning and changelog generation

## Quick Start

```sh
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Biome is a fast, modern linter and formatter for JavaScript and TypeScript.

### Available Commands

```sh
# Run linting and formatting checks
turbo format-and-lint

# Fix linting and formatting issues automatically
turbo format-and-lint:fix

# Run standard linting and formatting checks
pnpm lint

# Fix linting and formatting issues automatically
pnpm lint:fix
```

The project is configured with pre-commit hooks that run `turbo format-and-lint` automatically before each commit to ensure code quality.

## Project Structure

- `apps/*`: Applications
  - `web`: Next.js web application (runs on port 3000)
    - `src/app/sdk`: SDK demo page
  - `server`: Fastify API server (runs on port 3001)
- `packages/*`: Shared libraries and tools
  - `core`: Core utilities and token engine
  - `sdk`: FuseUI API client SDK
  - `typescript-config`: Shared TypeScript configurations

## SDK Integration

The project includes a demonstration of how to use the `@fuseui/sdk` package:

1. The SDK package is located in `packages/sdk`
2. The server uses the SDK in `apps/server/src/index.ts`
3. The web app has a demo page at `apps/web/src/app/sdk`

To view the SDK demo:

```bash
# Start the server
pnpm --filter @repo/server dev

# In another terminal, start the web app
pnpm --filter web dev
```

Then visit http://localhost:3000/sdk in your browser.

## License

MIT
