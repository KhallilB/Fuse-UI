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
# Show help and version
fuseui --help
fuseui --version

# Import tokens from the Figma Variables API (prompts for a PAT)
fuseui import --figma <FILE_ID>

# Import tokens from a local DTCG/JSON file
fuseui import --file path/to/tokens.json

# Override the default output path (.fuseui/tokens.json)
fuseui import --file path/to/tokens.json --output ./my-tokens.json
```

### Import command details

- Normalized tokens are written to `.fuseui/tokens.json` relative to the current working directory unless `--output` is supplied.
- When using `--figma`, the CLI prompts for a Figma Personal Access Token; set `FIGMA_ACCESS_TOKEN` or `FIGMA_PERSONAL_ACCESS_TOKEN` to skip the prompt.
- The command prints the number of processed tokens plus any warnings or non-blocking errors so downstream tooling can verify ingestion health.

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
