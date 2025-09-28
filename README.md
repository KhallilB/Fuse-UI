# FuseUI

FuseUI is a token-first, adapter-driven release engine that turns design intent into reviewed, versioned UI code packages. It bridges the gap between design tools and code repositories, enabling teams to ship UI changes with the speed and safety of modern DevOps.

## Features

- **Token Ingestion**: Pulls design tokens from Figma Variables or DTCG JSON
- **Multi-Format Output**: Generates CSS custom properties, TypeScript types, Tailwind config presets, and themes for MUI and Chakra UI
- **Storybook Integration**: Auto-generates stories and visual regression tests
- **CI/CD Pipeline**: Gates PRs with visual diffs and accessibility checks
- **Package Publishing**: Automates versioning and changelog generation

## Quick Start

### Local Development

```sh
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

### Docker Development (No Local Dependencies Required)

```sh
# Start development with Docker
pnpm fuseui:up

# Stop Docker containers
pnpm fuseui:down
```

See the [Docker](#docker) section for more details.

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

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. Vitest is a fast and lightweight testing framework for JavaScript and TypeScript.

### Running Tests

#### Local Testing

```sh
# Run all tests across the monorepo
pnpm test

# Run tests for a specific package
pnpm --filter @fuseui/sdk test

# Run tests in watch mode for a specific package
pnpm --filter @fuseui/sdk test:watch
```

#### Docker Testing

```sh
# Run all tests in Docker containers
pnpm fuseui:test
```

### Adding Tests

Tests should be co-located with the source files they're testing. This makes it easier to find tests and maintain them as the codebase evolves.

Test files should follow the naming convention `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`.

Example test file structure:

```
packages/
  sdk/
    src/
      index.ts
      index.test.ts

apps/
  web/
    src/
      components/
        Navigation.tsx
        Navigation.test.tsx
  server/
    src/
      index.ts
      index.test.ts
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
pnpm --filter server dev

# In another terminal, start the web app
pnpm --filter web dev
```

Then visit http://localhost:3000/sdk in your browser.

## Docker

This repository provides a containerized workflow for development, testing, and production builds using Docker and Docker Compose. Using Docker eliminates the need to install Node.js and PNPM locally.

### Prerequisites

- Docker Desktop 4.25+
- No local Node.js or PNPM required (everything runs in containers)

### Environment Variables

- Server env template: `apps/server/.env.example`
- Web env template: `apps/web/env.example`

Create runtime `.env` files based on the templates:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/env.example apps/web/.env
```

Environment variables used by the apps:

- `apps/server/.env`
  - `PORT` (default: 3001)
  - `HOST` (default: 0.0.0.0)
  - `FUSE_API_URL` (default: https://api.fuseui.com)
  - `FUSE_API_KEY` (required for authenticated requests)
- `apps/web/.env`
  - `NEXT_PUBLIC_FUSE_API_URL` (default: http://localhost:3001)
  - `NEXT_PUBLIC_FUSE_API_KEY` (optional for demo)

Notes:

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and must not include secrets.
- Sensitive values (e.g., API keys) should be stored securely in your CI/CD secret store when building images.

### Docker Commands

The following commands are available for Docker workflows:

```bash
# Start development with hot reload
pnpm fuseui:up

# Stop and clean up containers
pnpm fuseui:down

# Run tests in Docker containers
pnpm fuseui:test

# Build production images
pnpm fuseui:prod        # builds both images
```

### Production Docker Images

Multi-stage builds in the root `Dockerfile` create optimized production images:

- `khallilb/fuse-ui:web` (Next.js, port 3000)
- `khallilb/fuse-ui:server` (Fastify, port 3001)

To run a production image locally:

```bash
docker run --rm -p 3000:3000 --env-file apps/web/.env khallilb/fuse-ui:web
docker run --rm -p 3001:3001 --env-file apps/server/.env khallilb/fuse-ui:server
```

### Docker Hub Repository

The Docker images are hosted on Docker Hub under the `khallilb/fuse-ui` repository.

#### Pushing Images to Docker Hub

To push images to Docker Hub:

```bash
# Login to Docker Hub
docker login

# Build and push images
pnpm fuseui:prod
pnpm fuseui:push
```

Alternatively, you can manually push a specific tag:

```bash
docker push khallilb/fuse-ui:tagname
```

### Troubleshooting

- If hot reload does not trigger on file changes on macOS:
  - Set polling for Webpack/Next.js: `export WATCHPACK_POLLING=true` (or add to `apps/web/.env`).
  - Ensure your project folder is under Docker Desktop file sharing.
- If `pnpm` store permissions cause issues, remove the named volume:
  - `docker volume rm fuse-ui_pnpm-store` (volume name may vary).
- If `EADDRINUSE` conflicts occur, make sure ports 3000/3001 are free or edit `docker-compose.yml` mappings.

### CI/CD Notes

- Use the same root `Dockerfile` to build images in CI:

  - Web: `docker build --target web-prod -t ghcr.io/<org>/fuseui-web:<tag> .`
  - Server: `docker build --target server-prod -t ghcr.io/<org>/fuseui-server:<tag> .`

- Recommended:
  - Push images to your container registry on merges to `main`.
  - Pass secrets and env via CI variables; do not bake secrets into images.
  - Leverage build cache for faster CI builds (e.g., `--cache-from`, registry-backed cache).

## Release Process

This project uses [release-it](https://github.com/release-it/release-it) with the conventional changelog plugin to automate versioning and publishing.

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This enables automatic versioning and changelog generation.

Commit message format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat`: A new feature (triggers a minor version bump)
- `fix`: A bug fix (triggers a patch version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to the build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

Breaking changes are indicated by adding `BREAKING CHANGE:` in the commit footer or appending a `!` after the type/scope, which will trigger a major version bump.

### Creating a Release

#### Local Development

To create a release locally:

```sh
# Dry run (no changes will be made)
pnpm release:dry-run

# Create a release with automatic version bump based on commits
pnpm release

# Create a specific release type
pnpm release -- --increment=patch|minor|major
```

### Package Publishing

The CLI and SDK packages are configured for publishing to npm. The server and web applications are not published as npm packages.

## License

MIT
