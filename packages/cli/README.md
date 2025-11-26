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

# Import tokens using config (see below)
fuseui import

# Import explicitly from a DTCG file
fuseui import --dtcg-path ./tokens/primitives.json

# Import from Figma Variables
FUSEUI_FIGMA_API_KEY=xxx fuseui import --source figma --figma-file-key AbCd123

# Manage design tokens
fuseui tokens

# Generate code from design tokens
fuseui generate
```

## Import command

The `fuseui import` command validates configuration, runs the appropriate importer (DTCG or Figma), and reports token counts, types, warnings, and errors. Use the `--debug` flag (or `FUSEUI_DEBUG=1`) for verbose traces.

### Config file

Place a `fuseui.config.{json,js,ts}` file in your project root (or pass `--config path`), for example:

```json
{
  "defaults": {
    "figmaApiKey": "env:FUSEUI_FIGMA_API_KEY"
  },
  "sources": [
    {
      "type": "dtcg",
      "label": "local-draft",
      "filePath": "./tokens/draft.json"
    },
    {
      "type": "figma",
      "label": "marketing",
      "fileKey": "AbCd123",
      "apiBaseUrl": "https://api.figma.com"
    }
  ]
}
```

Any value prefixed with `env:` is a reminder to provide it through environment variables; the CLI does not resolve that syntax automatically.

### CLI overrides & environment variables

- `--config` or `FUSEUI_CONFIG` – custom config path
- `--source` – filter by label or type (`dtcg`, `figma`)
- `--dtcg-path`, `--dtcg-url`, `FUSEUI_DTCG_FILE_PATH`, `FUSEUI_DTCG_FILE_URL`
- `--figma-file-key`, `FUSEUI_FIGMA_FILE_KEY`
- `--figma-api-key`, `FUSEUI_FIGMA_API_KEY`
- `--figma-base-url`, `FUSEUI_FIGMA_BASE_URL`
- `--debug`, `FUSEUI_DEBUG=1`

### Exit codes

- `0` – success (warnings may still be emitted)
- `2` – validation or configuration error (missing auth, unreadable path, schema issues)
- `1` – fatal/unexpected error (e.g., network outage, crash)

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
