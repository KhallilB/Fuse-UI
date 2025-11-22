# `@fuseui-org/cli`

Command-line interface for FuseUI that manages design tokens and generates code from design intent.

## Installation

```bash
npm install -g @fuseui-org/cli
# or
yarn global add @fuseui-org/cli
# or
pnpm add -g @fuseui-org/cli

# Or use with npx (no installation required)
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
