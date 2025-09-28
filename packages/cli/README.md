# FuseUI CLI

A command-line interface for FuseUI, a token-first, adapter-driven release engine that turns design intent into reviewed, versioned UI code packages.

## Installation

```bash
# Install globally
npm install -g @fuseui-org/cli

# Or use with npx
npx @fuseui-org/cli --help

# Or install in your project
npm install --save-dev @fuseui-org/cli
```

## Usage

```bash
# Show help
fuseui --help

# Show version
fuseui --version

# Manage design tokens
fuseui tokens

# Generate code from design tokens
fuseui generate
```

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run the CLI in development mode
node dist/index.js --help
```

## Testing

This package uses Vitest for testing. Tests are co-located with the source files they're testing.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT
